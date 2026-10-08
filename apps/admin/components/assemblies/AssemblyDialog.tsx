"use client";

import { Button } from "@/components/ui/button";
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
import type { AssemblyInput } from "@/hooks/useAssemblies";
import {
  type AssemblyForm,
  type AssemblyFormField,
  inputFromForm,
  isSameForm,
  MARKDOWN_FIELDS,
} from "@/utils/assemblies/form";
import type { SiteDocument } from "@repo/domain/types/documents";
import {
  ASSEMBLY_NOTE_MAX,
  ASSEMBLY_PLACE_MAX,
  ASSEMBLY_TEXT_MAX,
} from "@repo/domain/utils/generalAssemblies";
import { Eye, Pencil } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

const FORM_ID = "assembly-form";
const NONE = "none";

const id = (field: AssemblyFormField) => `assembly-${field}`;

const LABELS: Record<AssemblyFormField, string> = {
  heldAt: "Date et heure",
  place: "Lieu",
  practicalNote: "Note pratique",
  convocationId: "Convocation",
  proxyId: "Formulaire de procuration",
  reminders: "Rappels importants",
  votingRights: "Droit de vote",
  agenda: "Ordre du jour",
  afterwards: "Après l'AG",
  published: "Publiée sur le site",
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

function DocumentSelect({
  field,
  value,
  onChange,
  documents,
}: {
  field: "convocationId" | "proxyId";
  value: string;
  onChange: (value: string) => void;
  documents: SiteDocument[];
}) {
  const selected = documents.find((d) => d.id === value);
  return (
    <div className="grid gap-2">
      <Label htmlFor={id(field)}>
        {LABELS[field]}
        <OptionalMark />
      </Label>
      <Select
        value={value || NONE}
        onValueChange={(v) => onChange(v === NONE ? "" : v)}
      >
        <SelectTrigger id={id(field)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Aucun pour l&apos;instant</SelectItem>
          {documents.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.title}
              {d.visibility === "members" ? " (membres)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected?.visibility === "members" && (
        <p className="text-note text-warning-foreground">
          Ce PDF est réservé aux membres : le bouton n&apos;apparaîtra pas sur
          la page publique. Passez-le en « Public » dans Documents de
          l&apos;association.
        </p>
      )}
    </div>
  );
}

/**
 * « Nouvelle assemblée générale » / « Modifier l'assemblée générale »: the
 * date, the place, the two PDFs (picked from the « Assemblées générales »
 * collection) and four short texts in Markdown, with a preview. `onSubmit`
 * saves; when it throws, the dialog stays open with what was typed.
 */
export function AssemblyDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  initial,
  editing,
  documents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AssemblyInput) => Promise<void>;
  isPending: boolean;
  /** What the form opens with (the AG edited, or the previous one copied). */
  initial: AssemblyForm;
  editing: boolean;
  /** Published PDFs of the « Assemblées générales » collection. */
  documents: SiteDocument[];
}) {
  const [form, setForm] = useState<AssemblyForm>(initial);
  const [errors, setErrors] = useState<
    Partial<Record<AssemblyFormField, string>>
  >({});
  const [preview, setPreview] = useState(false);
  const [openedWith, setOpenedWith] = useState<AssemblyForm | null>(null);

  // Each opening starts from `initial`.
  const current = open ? initial : null;
  if (current !== openedWith) {
    setOpenedWith(current);
    if (current) {
      setForm(current);
      setErrors({});
      setPreview(false);
    }
  }

  const set = <K extends AssemblyFormField>(key: K, value: AssemblyForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const check = inputFromForm(form);
    if (!check.ok) {
      setErrors(check.errors);
      setPreview(false);
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
    Object.keys(errors) as AssemblyFormField[]
  ).map((field) => ({
    fieldId: id(field),
    label: LABELS[field],
    message: errors[field] ?? "",
  }));

  const describedBy = (field: AssemblyFormField) =>
    errors[field] ? `${id(field)}-error` : undefined;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        editing
          ? "Modifier l'assemblée générale"
          : "Nouvelle assemblée générale"
      }
      description={
        editing
          ? "La page /ag du site change dans les minutes qui suivent."
          : "Préparée à partir de la précédente : relisez les textes, puis publiez quand tout est prêt."
      }
      formId={FORM_ID}
      isDirty={!isSameForm(form, initial)}
      isPending={isPending}
      submitLabel={editing ? "Enregistrer" : "Créer"}
      className="sm:max-w-2xl"
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-5"
      >
        <ErrorSummary errors={summary} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={id("heldAt")}>
              {LABELS.heldAt}
              <RequiredMark />
            </Label>
            <Input
              id={id("heldAt")}
              type="datetime-local"
              value={form.heldAt}
              onChange={(e) => set("heldAt", e.target.value)}
              aria-invalid={Boolean(errors.heldAt) || undefined}
              aria-describedby={describedBy("heldAt")}
            />
            <FieldError field={id("heldAt")} message={errors.heldAt} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={id("place")}>
              {LABELS.place}
              <RequiredMark />
            </Label>
            <Input
              id={id("place")}
              value={form.place}
              maxLength={ASSEMBLY_PLACE_MAX}
              placeholder="Par exemple : Freihof, Wangen"
              onChange={(e) => set("place", e.target.value)}
              aria-invalid={Boolean(errors.place) || undefined}
              aria-describedby={describedBy("place")}
            />
            <FieldError field={id("place")} message={errors.place} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={id("practicalNote")}>
            {LABELS.practicalNote}
            <OptionalMark />
          </Label>
          <Input
            id={id("practicalNote")}
            value={form.practicalNote}
            maxLength={ASSEMBLY_NOTE_MAX}
            placeholder="Par exemple : le parking se fera devant la salle des fêtes."
            onChange={(e) => set("practicalNote", e.target.value)}
            aria-invalid={Boolean(errors.practicalNote) || undefined}
            aria-describedby={describedBy("practicalNote")}
          />
          <FieldError
            field={id("practicalNote")}
            message={errors.practicalNote}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DocumentSelect
            field="convocationId"
            value={form.convocationId}
            onChange={(v) => set("convocationId", v)}
            documents={documents}
          />
          <DocumentSelect
            field="proxyId"
            value={form.proxyId}
            onChange={(v) => set("proxyId", v)}
            documents={documents}
          />
          <p className="text-note text-muted-foreground sm:col-span-2">
            Les PDF se déposent d&apos;abord dans Documents de
            l&apos;association, collection « Assemblées générales ».
          </p>
        </div>

        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-body font-semibold">Textes de la page</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-pressed={preview}
              onClick={() => setPreview((p) => !p)}
            >
              {preview ? <Pencil aria-hidden /> : <Eye aria-hidden />}
              {preview ? "Modifier les textes" : "Aperçu"}
            </Button>
          </div>
          <p className="text-note text-muted-foreground">
            Mise en forme : **gras**, une ligne commençant par « - » pour une
            liste. Un texte vide n&apos;apparaît pas sur la page.
          </p>
          {MARKDOWN_FIELDS.map(({ key, label }) => (
            <div key={key} className="grid gap-2">
              {preview ? (
                <section
                  aria-label={label}
                  className="border-border rounded-md border p-4"
                >
                  <p className="text-body mb-2 font-semibold">{label}</p>
                  {form[key].trim() ? (
                    <div className="text-body text-muted-foreground [&_strong]:text-foreground space-y-2 [&_ol]:list-inside [&_ol]:list-decimal [&_ul]:list-inside [&_ul]:list-disc">
                      <ReactMarkdown skipHtml>{form[key]}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-note text-muted-foreground italic">
                      Pas affiché (vide)
                    </p>
                  )}
                </section>
              ) : (
                <>
                  <Label htmlFor={id(key)}>
                    {label}
                    <OptionalMark />
                  </Label>
                  <Textarea
                    id={id(key)}
                    value={form[key]}
                    maxLength={ASSEMBLY_TEXT_MAX}
                    rows={4}
                    onChange={(e) => set(key, e.target.value)}
                    aria-invalid={Boolean(errors[key]) || undefined}
                    aria-describedby={describedBy(key)}
                  />
                  <FieldError field={id(key)} message={errors[key]} />
                </>
              )}
            </div>
          ))}
        </div>

        <div className="border-border flex items-start justify-between gap-4 rounded-md border p-4">
          <div className="space-y-1">
            <Label htmlFor={id("published")}>{LABELS.published}</Label>
            <p className="text-note text-muted-foreground">
              La plus récente des AG publiées s&apos;affiche sur la page /ag et
              s&apos;annonce sur l&apos;accueil jusqu&apos;à son jour.
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
