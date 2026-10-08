"use client";

import {
  ErrorSummary,
  type ErrorSummaryItem,
} from "@/components/ui/error-summary";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label, OptionalMark, RequiredMark } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AnnouncementInput } from "@/hooks/useAnnouncements";
import {
  type AnnouncementForm,
  type AnnouncementFormField,
  announcementInputFromForm,
  isSameAnnouncementForm,
  PLACEMENT_LABELS,
} from "@/utils/announcements/form";
import {
  ANNOUNCEMENT_BODY_MAX,
  ANNOUNCEMENT_LINK_LABEL_MAX,
  ANNOUNCEMENT_LINK_MAX,
  ANNOUNCEMENT_PLACEMENTS,
  ANNOUNCEMENT_TITLE_MAX,
  type AnnouncementPlacement,
} from "@repo/domain/utils/announcements";
import { useState } from "react";

const FORM_ID = "announcement-form";
const id = (field: AnnouncementFormField) => `announcement-${field}`;

const LABELS: Record<AnnouncementFormField, string> = {
  placement: "Où",
  title: "Titre",
  body: "Texte",
  linkLabel: "Texte du bouton",
  linkUrl: "Lien",
  startsOn: "À partir du",
  endsOn: "Jusqu'au",
  published: "Publiée",
};

function FieldError({ field, message }: { field: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={`${field}-error`}
      className="text-detail text-danger-foreground font-medium"
    >
      {message}
    </p>
  );
}

/**
 * « Nouvelle annonce » / « Modifier l'annonce »: where it shows, its title,
 * a short text, where it leads, from and until which day. `onSubmit` saves;
 * when it throws, the dialog stays open with what was typed.
 */
export function AnnouncementDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  initial,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AnnouncementInput) => Promise<void>;
  isPending: boolean;
  initial: AnnouncementForm;
  editing: boolean;
}) {
  const [form, setForm] = useState<AnnouncementForm>(initial);
  const [errors, setErrors] = useState<
    Partial<Record<AnnouncementFormField, string>>
  >({});
  const [openedWith, setOpenedWith] = useState<AnnouncementForm | null>(null);

  // Each opening starts from `initial`.
  const current = open ? initial : null;
  if (current !== openedWith) {
    setOpenedWith(current);
    if (current) {
      setForm(current);
      setErrors({});
    }
  }

  const set = <K extends AnnouncementFormField>(
    key: K,
    value: AnnouncementForm[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const check = announcementInputFromForm(form);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    try {
      await onSubmit(check.value);
      onOpenChange(false);
    } catch {
      // The page has said what failed; the form keeps what was typed.
    }
  };

  const summary: ErrorSummaryItem[] = (
    Object.keys(errors) as AnnouncementFormField[]
  ).map((field) => ({
    fieldId: id(field),
    label: LABELS[field],
    message: errors[field] ?? "",
  }));

  const describedBy = (field: AnnouncementFormField) =>
    errors[field] ? `${id(field)}-error` : undefined;
  const isHome = form.placement === "home";

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Modifier l'annonce" : "Nouvelle annonce"}
      description="Elle s'affiche sur le site entre ses dates, une fois publiée."
      formId={FORM_ID}
      isDirty={!isSameAnnouncementForm(form, initial)}
      isPending={isPending}
      submitLabel={editing ? "Enregistrer" : "Créer"}
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-5"
      >
        <ErrorSummary errors={summary} />

        <div className="grid gap-2">
          <Label htmlFor={id("placement")}>
            {LABELS.placement}
            <RequiredMark />
          </Label>
          <Select
            value={form.placement}
            onValueChange={(v) => set("placement", v as AnnouncementPlacement)}
            disabled={editing}
          >
            <SelectTrigger id={id("placement")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANNOUNCEMENT_PLACEMENTS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PLACEMENT_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-note text-muted-foreground">
            {isHome
              ? "Le titre devient le bouton sous « Bienvenue sur le site du Bon Tempérament ». Deux au plus en même temps."
              : "Une petite carte s'ouvre une fois près du cœur du menu, pour chaque visiteur. Une seule à la fois."}
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={id("title")}>
            {LABELS.title}
            <RequiredMark />
          </Label>
          <Input
            id={id("title")}
            value={form.title}
            maxLength={ANNOUNCEMENT_TITLE_MAX}
            placeholder={
              isHome
                ? "Par exemple : 🎄 Calendrier musical 2026"
                : "Par exemple : Nouvelle campagne de dons"
            }
            onChange={(e) => set("title", e.target.value)}
            aria-invalid={Boolean(errors.title) || undefined}
            aria-describedby={describedBy("title")}
          />
          <FieldError field={id("title")} message={errors.title} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={id("body")}>
            {LABELS.body}
            <OptionalMark />
          </Label>
          <Textarea
            id={id("body")}
            value={form.body}
            rows={3}
            maxLength={ANNOUNCEMENT_BODY_MAX}
            onChange={(e) => set("body", e.target.value)}
            aria-invalid={Boolean(errors.body) || undefined}
            aria-describedby={describedBy("body")}
          />
          <p className="text-note text-muted-foreground">
            {isHome
              ? "Lu par les lecteurs d'écran à la place du titre."
              : "Sous le titre de la carte."}
          </p>
          <FieldError field={id("body")} message={errors.body} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={id("linkUrl")}>
              {LABELS.linkUrl}
              <RequiredMark />
            </Label>
            <Input
              id={id("linkUrl")}
              value={form.linkUrl}
              maxLength={ANNOUNCEMENT_LINK_MAX}
              placeholder="/don ou https://…"
              onChange={(e) => set("linkUrl", e.target.value)}
              aria-invalid={Boolean(errors.linkUrl) || undefined}
              aria-describedby={describedBy("linkUrl")}
            />
            <FieldError field={id("linkUrl")} message={errors.linkUrl} />
          </div>
          {!isHome && (
            <div className="grid gap-2">
              <Label htmlFor={id("linkLabel")}>
                {LABELS.linkLabel}
                <OptionalMark />
              </Label>
              <Input
                id={id("linkLabel")}
                value={form.linkLabel}
                maxLength={ANNOUNCEMENT_LINK_LABEL_MAX}
                placeholder="Découvrir"
                onChange={(e) => set("linkLabel", e.target.value)}
                aria-invalid={Boolean(errors.linkLabel) || undefined}
                aria-describedby={describedBy("linkLabel")}
              />
              <FieldError field={id("linkLabel")} message={errors.linkLabel} />
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={id("startsOn")}>
              {LABELS.startsOn}
              <OptionalMark />
            </Label>
            <Input
              id={id("startsOn")}
              type="date"
              value={form.startsOn}
              onChange={(e) => set("startsOn", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={id("endsOn")}>
              {LABELS.endsOn}
              <OptionalMark />
            </Label>
            <Input
              id={id("endsOn")}
              type="date"
              value={form.endsOn}
              onChange={(e) => set("endsOn", e.target.value)}
              aria-invalid={Boolean(errors.endsOn) || undefined}
              aria-describedby={describedBy("endsOn")}
            />
            <FieldError field={id("endsOn")} message={errors.endsOn} />
          </div>
          <p className="text-note text-muted-foreground sm:col-span-2">
            Sans date, elle reste affichée jusqu&apos;à ce que vous la repassiez
            en brouillon. Le dernier jour est inclus.
          </p>
        </div>

        <div className="border-border flex items-start justify-between gap-4 rounded-md border p-4">
          <div className="space-y-1">
            <Label htmlFor={id("published")}>{LABELS.published}</Label>
            <p className="text-note text-muted-foreground">
              En brouillon, personne ne la voit sur le site.
            </p>
          </div>
          <Switch
            id={id("published")}
            checked={form.published}
            onCheckedChange={(checked) => set("published", checked)}
          />
        </div>
      </form>
    </FormDialog>
  );
}
