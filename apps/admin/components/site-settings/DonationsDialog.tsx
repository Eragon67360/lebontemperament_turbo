"use client";

import {
  FieldError,
  refusalMessage,
  SettingFormFeedback,
} from "@/components/site-settings/feedback";
import { Button } from "@/components/ui/button";
import type { ErrorSummaryItem } from "@/components/ui/error-summary";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteSettingError } from "@/hooks/useSiteSettings";
import {
  addTier,
  canAddTier,
  canRemoveTier,
  checkDonationsForm,
  donationsErrorKey,
  donationsErrorLabel,
  type DonationsForm,
  type FormErrors,
  isSameDonationsForm,
  moveTier,
  removeTier,
  SETTING_INFO,
  tierErrorKey,
  tierName,
  type TierPart,
  type TierRow,
} from "@/utils/siteSettings/form";
import {
  DONATION_AMOUNT_MAX,
  DONATION_DESCRIPTION_MAX,
  DONATION_TIERS_MAX,
  type DonationsSetting,
} from "@repo/domain/utils/siteSettings";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const FORM_ID = "site-setting-donations";
const info = SETTING_INFO.donations;

const ids = {
  helloasso: `${FORM_ID}-helloasso`,
  add: `${FORM_ID}-add`,
  tiers: `${FORM_ID}-tiers`,
  tier: (rowKey: string, part: TierPart | "up" | "down" | "remove") =>
    `${FORM_ID}-${rowKey}-${part}`,
  radio: (rowKey: string) => `${FORM_ID}-default-${rowKey}`,
  defaultError: `${FORM_ID}-default-error`,
};

/** The id of the input an error key is about. */
function errorInputId(form: DonationsForm, errorKey: string): string {
  if (errorKey === "helloassoUrl") return ids.helloasso;
  if (errorKey === "tiers") return ids.add;
  if (errorKey === "defaultAmount") {
    return ids.radio(form.defaultKey || form.tiers[0]?.key || "");
  }
  const [, rowKey = "", part = "amount"] = errorKey.split(":");
  return ids.tier(rowKey, part as TierPart);
}

/**
 * The dialog of « Dons »: the HelloAsso link, the amounts as editable rows
 * (move, take out, add) and the amount selected when the page opens. `initial`
 * is what it opens with, and `null` while it is closed. The website's rules
 * run before anything is sent; `onSubmit` saves and, when it throws, the
 * dialog stays open with what was typed.
 */
export function DonationsDialog({
  initial,
  isPending,
  onSubmit,
  onClose,
}: {
  initial: DonationsForm | null;
  isPending: boolean;
  onSubmit: (value: DonationsSetting) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<DonationsForm>(
    initial ?? { helloassoUrl: "", tiers: [], defaultKey: "" },
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [openedWith, setOpenedWith] = useState<DonationsForm | null>(null);

  // Each opening starts from `initial`.
  if (initial !== openedWith) {
    setOpenedWith(initial);
    if (initial) {
      setForm(initial);
      setErrors({});
      setProblem(null);
    }
  }

  // After adding, moving or taking out a row, the keyboard stays where it was.
  const focusAfter = useRef<string[] | null>(null);
  useEffect(() => {
    const candidates = focusAfter.current;
    if (!candidates) return;
    focusAfter.current = null;
    for (const id of candidates) {
      const element = document.getElementById(id);
      if (element instanceof HTMLButtonElement && element.disabled) continue;
      if (element) {
        element.focus();
        return;
      }
    }
  });

  const setRow = (rowKey: string, patch: Partial<TierRow>) =>
    setForm((f) => ({
      ...f,
      tiers: f.tiers.map((row) =>
        row.key === rowKey ? { ...row, ...patch } : row,
      ),
    }));

  const add = () => {
    const next = addTier(form);
    const added = next.tiers[next.tiers.length - 1];
    if (added && next !== form)
      focusAfter.current = [ids.tier(added.key, "amount")];
    setForm(next);
  };
  const move = (rowKey: string, direction: "up" | "down") => {
    focusAfter.current = [
      ids.tier(rowKey, direction),
      ids.tier(rowKey, direction === "up" ? "down" : "up"),
    ];
    setForm((f) => moveTier(f, rowKey, direction));
  };
  const remove = (rowKey: string) => {
    focusAfter.current = [ids.add];
    setForm((f) => removeTier(f, rowKey));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const check = checkDonationsForm(form);
    if (!check.ok) {
      setErrors(check.errors);
      setProblem(check.general);
      return;
    }
    setErrors({});
    setProblem(null);
    try {
      await onSubmit(check.value);
      onClose();
    } catch (error) {
      const message = refusalMessage(error);
      const key =
        error instanceof SiteSettingError && error.field
          ? donationsErrorKey(form, error.field)
          : null;
      if (key) {
        setErrors({ [key]: message });
        setProblem(null);
      } else {
        setErrors({});
        setProblem(message);
      }
    }
  };

  const summary: ErrorSummaryItem[] = Object.entries(errors).map(
    ([errorKey, message]) => ({
      fieldId: errorInputId(form, errorKey),
      label: donationsErrorLabel(form, errorKey),
      message,
    }),
  );

  const describedBy = (id: string, errorKey: string) =>
    errors[errorKey] ? `${id}-error` : undefined;

  return (
    <FormDialog
      open={initial !== null}
      onOpenChange={(open) => !open && onClose()}
      title={info.dialogTitle}
      description={info.dialogDescription}
      formId={FORM_ID}
      isDirty={initial !== null && !isSameDonationsForm(form, initial)}
      isPending={isPending}
      submitLabel="Enregistrer"
      className="sm:max-w-[720px]"
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-6"
      >
        <SettingFormFeedback summary={summary} problem={problem} />

        <div className="grid gap-2">
          <Label htmlFor={ids.helloasso}>
            Lien HelloAsso
            <RequiredMark />
          </Label>
          <Input
            id={ids.helloasso}
            type="url"
            inputMode="url"
            autoComplete="off"
            value={form.helloassoUrl}
            placeholder="https://www.helloasso.com/…"
            onChange={(e) =>
              setForm((f) => ({ ...f, helloassoUrl: e.target.value }))
            }
            aria-invalid={Boolean(errors.helloassoUrl) || undefined}
            aria-describedby={describedBy(ids.helloasso, "helloassoUrl")}
          />
          <p className="text-note text-muted-foreground">
            La page HelloAsso où les donateurs sont envoyés.
          </p>
          <FieldError
            id={`${ids.helloasso}-error`}
            message={errors.helloassoUrl}
          />
        </div>

        <div className="grid gap-3" role="group" aria-labelledby={ids.tiers}>
          <div className="space-y-1">
            <p
              id={ids.tiers}
              className="text-[15px] leading-[22px] font-medium"
            >
              Montants proposés
            </p>
            <p className="text-note text-muted-foreground">
              Dans l&apos;ordre de la page Don, avec ce que chaque montant
              permet d&apos;offrir.
            </p>
          </div>

          <ol className="grid gap-3">
            {form.tiers.map((row, index) => {
              const name = tierName(row, index);
              const part = (p: TierPart) => ({
                id: ids.tier(row.key, p),
                error: errors[tierErrorKey(row.key, p)],
                describedBy: describedBy(
                  ids.tier(row.key, p),
                  tierErrorKey(row.key, p),
                ),
              });
              const amount = part("amount");
              const emoji = part("emoji");
              const description = part("description");
              return (
                <li key={row.key}>
                  <fieldset className="border-border grid min-w-0 gap-4 rounded-md border p-4">
                    <legend className="px-1 text-[15px] leading-[22px] font-medium">
                      Montant {index + 1}
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-[10rem_8rem]">
                      <div className="grid content-start gap-2">
                        <Label htmlFor={amount.id}>
                          Montant en euros
                          <RequiredMark />
                        </Label>
                        <div className="relative">
                          <Input
                            id={amount.id}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={DONATION_AMOUNT_MAX}
                            step={1}
                            autoComplete="off"
                            className="pr-9"
                            value={row.amount}
                            onChange={(e) =>
                              setRow(row.key, { amount: e.target.value })
                            }
                            aria-invalid={Boolean(amount.error) || undefined}
                            aria-describedby={amount.describedBy}
                          />
                          <span
                            aria-hidden
                            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2"
                          >
                            €
                          </span>
                        </div>
                        <FieldError
                          id={`${amount.id}-error`}
                          message={amount.error}
                        />
                      </div>
                      <div className="grid content-start gap-2">
                        <Label htmlFor={emoji.id}>
                          Emoji
                          <RequiredMark />
                        </Label>
                        <Input
                          id={emoji.id}
                          autoComplete="off"
                          value={row.emoji}
                          onChange={(e) =>
                            setRow(row.key, { emoji: e.target.value })
                          }
                          aria-invalid={Boolean(emoji.error) || undefined}
                          aria-describedby={emoji.describedBy}
                        />
                        <FieldError
                          id={`${emoji.id}-error`}
                          message={emoji.error}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={description.id}>
                        Description
                        <RequiredMark />
                      </Label>
                      <Textarea
                        id={description.id}
                        rows={3}
                        value={row.description}
                        onChange={(e) =>
                          setRow(row.key, { description: e.target.value })
                        }
                        aria-invalid={Boolean(description.error) || undefined}
                        aria-describedby={description.describedBy}
                      />
                      <p className="text-note text-muted-foreground">
                        {DONATION_DESCRIPTION_MAX} caractères au plus.
                      </p>
                      <FieldError
                        id={`${description.id}-error`}
                        message={description.error}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        id={ids.tier(row.key, "up")}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => move(row.key, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp aria-hidden />
                        Monter
                        <span className="sr-only"> « {name} »</span>
                      </Button>
                      <Button
                        id={ids.tier(row.key, "down")}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => move(row.key, "down")}
                        disabled={index === form.tiers.length - 1}
                      >
                        <ArrowDown aria-hidden />
                        Descendre
                        <span className="sr-only"> « {name} »</span>
                      </Button>
                      <Button
                        id={ids.tier(row.key, "remove")}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(row.key)}
                        disabled={!canRemoveTier(form)}
                      >
                        <Trash2 aria-hidden />
                        Retirer
                        <span className="sr-only"> « {name} »</span>
                      </Button>
                    </div>
                  </fieldset>
                </li>
              );
            })}
          </ol>

          <FieldError id={`${ids.add}-error`} message={errors.tiers} />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              id={ids.add}
              type="button"
              variant="outline"
              onClick={add}
              disabled={!canAddTier(form)}
              aria-describedby={errors.tiers ? `${ids.add}-error` : undefined}
            >
              <Plus aria-hidden />
              Ajouter un montant
            </Button>
            {!canAddTier(form) && (
              <p className="text-note text-muted-foreground">
                {DONATION_TIERS_MAX} montants au plus.
              </p>
            )}
          </div>
        </div>

        <fieldset className="grid min-w-0 gap-3">
          <legend className="text-[15px] leading-[22px] font-medium">
            Montant sélectionné à l&apos;ouverture de la page
            <RequiredMark />
          </legend>
          <p className="text-note text-muted-foreground">
            Celui qui est déjà choisi quand quelqu&apos;un arrive sur la page
            Don.
          </p>
          <div className="flex flex-wrap gap-2">
            {form.tiers.map((row, index) => (
              <label
                key={row.key}
                htmlFor={ids.radio(row.key)}
                className="border-border has-[:checked]:border-primary has-[:checked]:bg-primary-soft flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border px-3.5"
              >
                <input
                  id={ids.radio(row.key)}
                  type="radio"
                  name={`${FORM_ID}-default`}
                  value={row.key}
                  checked={form.defaultKey === row.key}
                  onChange={() =>
                    setForm((f) => ({ ...f, defaultKey: row.key }))
                  }
                  aria-describedby={
                    errors.defaultAmount ? ids.defaultError : undefined
                  }
                  className="accent-primary size-4 shrink-0"
                />
                <span className="text-[15px] leading-6 font-medium">
                  {tierName(row, index)}
                </span>
              </label>
            ))}
          </div>
          <FieldError id={ids.defaultError} message={errors.defaultAmount} />
        </fieldset>
      </form>
    </FormDialog>
  );
}
