"use client";

import { FileUpload } from "@/components/FileUpload";
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
import {
  type FormDate,
  type FormPrecision,
  fromFormDate,
  guessFromFileName,
  PRECISION_LABELS,
  type StoredDate,
  toFormDate,
} from "@/utils/documents/form";
import type {
  DocumentCollection,
  SiteDocument,
} from "@repo/domain/types/documents";
import { DOCUMENT_MAX_BYTES } from "@repo/domain/utils/documents";
import { useState } from "react";

export type DocumentFormValues = StoredDate & {
  collection_id: string;
  title: string;
  visibility: "public" | "members";
  /** A new PDF (required to add, optional to edit: « Remplacer le fichier »). */
  file: File | null;
};

const FORM_ID = "document-form";
const IDS = {
  collection: "document-collection",
  file: "document-file",
  title: "document-title",
  precision: "document-precision",
  date: "document-date",
  visibility: "document-visibility",
};

type FieldErrors = Partial<
  Record<"collection" | "file" | "title" | "date", string>
>;

const VISIBILITY_LABELS = {
  members: "Membres : dans l'espace membres et l'appli",
  public: "Public : peut aussi apparaître sur le site public",
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={`${id}-error`}
      className="text-detail text-danger-foreground font-medium"
    >
      {message}
    </p>
  );
}

/**
 * « Ajouter un document » / « Modifier le document »: the PDF (dropping it
 * pre-fills the title and the date from its name), the collection, the
 * title, the date and its precision, who sees it. `onSubmit` uploads and
 * saves; when it throws, the dialog stays open with what was typed.
 */
export function DocumentDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  collections,
  document,
  defaultCollectionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DocumentFormValues) => Promise<void>;
  isPending: boolean;
  collections: DocumentCollection[];
  /** The document being edited; absent to add one. */
  document?: SiteDocument | null;
  defaultCollectionId?: string;
}) {
  const editing = Boolean(document);
  const initial = () => ({
    collectionId: document?.collection_id ?? defaultCollectionId ?? "",
    title: document?.title ?? "",
    date: toFormDate(document?.document_date, document?.date_precision),
    visibility: (document?.visibility === "public" ? "public" : "members") as
      "public" | "members",
  });

  const [collectionId, setCollectionId] = useState(initial().collectionId);
  const [title, setTitle] = useState(initial().title);
  const [date, setDate] = useState<FormDate>(initial().date);
  const [visibility, setVisibility] = useState(initial().visibility);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [openedFor, setOpenedFor] = useState<string | null | undefined>(
    undefined,
  );

  // Each opening starts from the document (or an empty form).
  const key = open
    ? (document?.id ?? `new:${defaultCollectionId ?? ""}`)
    : null;
  if (key !== openedFor) {
    setOpenedFor(key);
    if (open) {
      const next = initial();
      setCollectionId(next.collectionId);
      setTitle(next.title);
      setDate(next.date);
      setVisibility(next.visibility);
      setFile(null);
      setErrors({});
    }
  }

  const start = initial();
  const isDirty =
    file !== null ||
    collectionId !== start.collectionId ||
    title !== start.title ||
    date.precision !== start.date.precision ||
    date.value !== start.date.value ||
    visibility !== start.visibility;

  const handleFile = (selected: File) => {
    setFile(selected);
    if (!editing && title.trim() === "") {
      const guess = guessFromFileName(selected.name);
      setTitle(guess.title);
      if (date.precision === "none") setDate(guess.date);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: FieldErrors = {};
    if (!collectionId) next.collection = "Choisissez la collection.";
    if (!editing && !file) next.file = "Ajoutez le PDF.";
    if (!title.trim()) next.title = "Donnez un titre au document.";
    const stored = fromFormDate(date);
    if (!stored.ok) next.date = stored.error;
    setErrors(next);
    if (Object.keys(next).length > 0 || !stored.ok) return;

    try {
      await onSubmit({
        collection_id: collectionId,
        title: title.trim(),
        visibility,
        file,
        ...stored.value,
      });
      onOpenChange(false);
    } catch {
      // The page has said what failed; the form keeps what was typed.
    }
  };

  const summary: ErrorSummaryItem[] = [];
  if (errors.file)
    summary.push({
      fieldId: IDS.file,
      label: "Fichier PDF",
      message: errors.file,
    });
  if (errors.collection)
    summary.push({
      fieldId: IDS.collection,
      label: "Collection",
      message: errors.collection,
    });
  if (errors.title)
    summary.push({ fieldId: IDS.title, label: "Titre", message: errors.title });
  if (errors.date)
    summary.push({ fieldId: IDS.date, label: "Date", message: errors.date });

  const describedBy = (id: string, error?: string) =>
    error ? `${id}-error` : undefined;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Modifier le document" : "Nouveau document"}
      description={
        editing
          ? "Les membres voient le changement dans les minutes qui suivent."
          : "Le PDF apparaît dans l'espace membres, rangé dans sa collection."
      }
      formId={FORM_ID}
      isDirty={isDirty}
      isPending={isPending}
      submitLabel={editing ? "Enregistrer" : "Ajouter le document"}
      pendingLabel={file ? "Envoi du PDF…" : undefined}
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-5"
      >
        <ErrorSummary errors={summary} />

        <div className="grid gap-2" id={IDS.file} tabIndex={-1}>
          <Label>
            {editing ? "Remplacer le PDF" : "Fichier PDF"}
            {editing ? <OptionalMark /> : <RequiredMark />}
          </Label>
          <FileUpload
            onFileSelect={handleFile}
            onFileClear={() => setFile(null)}
            value={file}
            currentImageUrl={null}
            mode="pdf"
            maxPdfMegabytes={DOCUMENT_MAX_BYTES / (1024 * 1024)}
          />
          {editing && (
            <p className="text-note text-muted-foreground">
              L&apos;ancien fichier reste dans l&apos;historique.
            </p>
          )}
          <FieldError id={IDS.file} message={errors.file} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={IDS.collection}>
            Collection
            <RequiredMark />
          </Label>
          <Select
            value={collectionId}
            onValueChange={setCollectionId}
            disabled={editing}
          >
            <SelectTrigger
              id={IDS.collection}
              aria-invalid={Boolean(errors.collection) || undefined}
              aria-describedby={describedBy(IDS.collection, errors.collection)}
            >
              <SelectValue placeholder="Choisir une collection…" />
            </SelectTrigger>
            <SelectContent>
              {collections.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {editing && (
            <p className="text-note text-muted-foreground">
              La collection fait partie de l&apos;adresse du document : elle ne
              change pas.
            </p>
          )}
          <FieldError id={IDS.collection} message={errors.collection} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={IDS.title}>
            Titre
            <RequiredMark />
          </Label>
          <Input
            id={IDS.title}
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Par exemple : Gazette du 21/06/2025"
            aria-invalid={Boolean(errors.title) || undefined}
            aria-describedby={describedBy(IDS.title, errors.title)}
          />
          <FieldError id={IDS.title} message={errors.title} />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          <div className="grid gap-2">
            <Label htmlFor={IDS.precision}>Date du document</Label>
            <Select
              value={date.precision}
              onValueChange={(precision) =>
                setDate({
                  precision: precision as FormPrecision,
                  value:
                    precision === "year"
                      ? date.value.slice(0, 4)
                      : precision === "month"
                        ? date.value.slice(0, 7)
                        : date.value,
                })
              }
            >
              <SelectTrigger id={IDS.precision}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRECISION_LABELS) as FormPrecision[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRECISION_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {date.precision !== "none" && (
            <div className="grid gap-2 sm:self-end">
              <Label htmlFor={IDS.date} className="sm:sr-only">
                {date.precision === "year"
                  ? "Année"
                  : date.precision === "month"
                    ? "Mois"
                    : "Jour"}
              </Label>
              <Input
                id={IDS.date}
                type={
                  date.precision === "year"
                    ? "number"
                    : date.precision === "month"
                      ? "month"
                      : "date"
                }
                inputMode={date.precision === "year" ? "numeric" : undefined}
                min={date.precision === "year" ? 1900 : undefined}
                max={date.precision === "year" ? 2100 : undefined}
                placeholder={date.precision === "year" ? "2025" : undefined}
                value={date.value}
                onChange={(e) => setDate({ ...date, value: e.target.value })}
                aria-invalid={Boolean(errors.date) || undefined}
                aria-describedby={describedBy(IDS.date, errors.date)}
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <FieldError id={IDS.date} message={errors.date} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={IDS.visibility}>Qui le voit</Label>
          <Select
            value={visibility}
            onValueChange={(v) => setVisibility(v as "public" | "members")}
          >
            <SelectTrigger id={IDS.visibility}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="members">
                {VISIBILITY_LABELS.members}
              </SelectItem>
              <SelectItem value="public">{VISIBILITY_LABELS.public}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-note text-muted-foreground">
            Dans les deux cas, toute personne qui a le lien peut ouvrir le PDF.
          </p>
        </div>
      </form>
    </FormDialog>
  );
}
