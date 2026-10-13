"use client";

import {
  FieldError,
  refusalMessage,
  SettingFormFeedback,
} from "@/components/site-settings/feedback";
import type { ErrorSummaryItem } from "@/components/ui/error-summary";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label, OptionalMark, RequiredMark } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteSettingError } from "@/hooks/useSiteSettings";
import {
  checkTextForm,
  type FormErrors,
  isSameTextValues,
  SETTING_INFO,
  settingFields,
  textErrorKey,
  type TextSettingKey,
  type TextValues,
} from "@/utils/siteSettings/form";
import type { SiteSettings } from "@repo/domain/utils/siteSettings";
import { useState } from "react";

/**
 * The dialog of a setting made of text fields (contact details, social
 * links, joining facts, legal notice). `initial` is what it opens with, and
 * `null` while it is closed. The website's own rules run before anything is
 * sent; when the server refuses all the same, its sentence shows on the
 * input it names. `onSubmit` saves; when it throws, the dialog stays open
 * with what was typed.
 */
export function SettingDialog({
  settingKey,
  initial,
  isPending,
  onSubmit,
  onClose,
}: {
  settingKey: TextSettingKey;
  initial: TextValues | null;
  isPending: boolean;
  onSubmit: (value: SiteSettings[TextSettingKey]) => Promise<void>;
  onClose: () => void;
}) {
  const info = SETTING_INFO[settingKey];
  const fields = settingFields(settingKey);
  const formId = `site-setting-${settingKey}`;
  const inputId = (key: string) => `${formId}-${key.replace(/\./g, "-")}`;

  const [values, setValues] = useState<TextValues>(initial ?? {});
  const [errors, setErrors] = useState<FormErrors>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [openedWith, setOpenedWith] = useState<TextValues | null>(null);

  // Each opening starts from `initial`.
  if (initial !== openedWith) {
    setOpenedWith(initial);
    if (initial) {
      setValues(initial);
      setErrors({});
      setProblem(null);
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const check = checkTextForm(settingKey, values);
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
          ? textErrorKey(values, error.field)
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

  const summary: ErrorSummaryItem[] = fields
    .filter((field) => errors[field.key])
    .map((field) => ({
      fieldId: inputId(field.key),
      label: field.label,
      message: errors[field.key] ?? "",
    }));

  return (
    <FormDialog
      open={initial !== null}
      onOpenChange={(open) => !open && onClose()}
      title={info.dialogTitle}
      description={info.dialogDescription}
      formId={formId}
      isDirty={initial !== null && !isSameTextValues(values, initial)}
      isPending={isPending}
      submitLabel="Enregistrer"
    >
      <form
        id={formId}
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-5"
      >
        <SettingFormFeedback summary={summary} problem={problem} />
        {fields.map((field) => {
          const id = inputId(field.key);
          const error = errors[field.key];
          const describedBy =
            [field.hint ? `${id}-hint` : null, error ? `${id}-error` : null]
              .filter(Boolean)
              .join(" ") || undefined;
          const shared = {
            id,
            value: values[field.key] ?? "",
            placeholder: field.placeholder,
            autoComplete: field.autoComplete,
            "aria-invalid": Boolean(error) || undefined,
            "aria-describedby": describedBy,
            onChange: (
              e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
            ) => setValues((v) => ({ ...v, [field.key]: e.target.value })),
          };
          return (
            <div key={field.key} className="grid gap-2">
              <Label htmlFor={id}>
                {field.label}
                {field.optional ? <OptionalMark /> : <RequiredMark />}
              </Label>
              {field.multiline ? (
                <Textarea {...shared} rows={5} />
              ) : (
                <Input
                  {...shared}
                  type={field.type ?? "text"}
                  inputMode={field.inputMode}
                />
              )}
              {field.hint && (
                <p
                  id={`${id}-hint`}
                  className="text-note text-muted-foreground"
                >
                  {field.hint}
                </p>
              )}
              <FieldError id={`${id}-error`} message={error} />
            </div>
          );
        })}
      </form>
    </FormDialog>
  );
}
