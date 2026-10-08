"use client";

import {
  ErrorSummary,
  type ErrorSummaryItem,
} from "@/components/ui/error-summary";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label, OptionalMark, RequiredMark } from "@/components/ui/label";
import type { DocumentCollection } from "@repo/domain/types/documents";
import { collectionSlug } from "@repo/domain/utils/documents";
import { useState } from "react";

export type CollectionFormValues = {
  label: string;
  description: string | null;
  slug: string;
};

const FORM_ID = "collection-form";
const LABEL_ID = "collection-label";
const DESCRIPTION_ID = "collection-description";

/**
 * « Nouvelle collection » / « Renommer la collection »: its name and one
 * line under it in the members area. The address part (slug) is made from
 * the first name and never changes.
 */
export function CollectionDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  collection,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CollectionFormValues) => Promise<void>;
  isPending: boolean;
  collection?: DocumentCollection | null;
}) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string>();
  const [openedFor, setOpenedFor] = useState<string | null | undefined>();

  const key = open ? (collection?.id ?? "new") : null;
  if (key !== openedFor) {
    setOpenedFor(key);
    if (open) {
      setLabel(collection?.label ?? "");
      setDescription(collection?.description ?? "");
      setError(undefined);
    }
  }

  const slug = collection?.slug ?? collectionSlug(label);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!label.trim() || !slug) {
      setError("Donnez un nom à la collection.");
      return;
    }
    setError(undefined);
    try {
      await onSubmit({
        label: label.trim(),
        description: description.trim() || null,
        slug,
      });
      onOpenChange(false);
    } catch {
      // The page has said what failed.
    }
  };

  const summary: ErrorSummaryItem[] = error
    ? [{ fieldId: LABEL_ID, label: "Nom", message: error }]
    : [];

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={collection ? "Renommer la collection" : "Nouvelle collection"}
      description="Une collection est une rubrique des archives de l'espace membres."
      formId={FORM_ID}
      isDirty={
        label !== (collection?.label ?? "") ||
        description !== (collection?.description ?? "")
      }
      isPending={isPending}
      submitLabel={collection ? "Enregistrer" : "Créer la collection"}
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-5"
      >
        <ErrorSummary errors={summary} />
        <div className="grid gap-2">
          <Label htmlFor={LABEL_ID}>
            Nom
            <RequiredMark />
          </Label>
          <Input
            id={LABEL_ID}
            value={label}
            maxLength={80}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Par exemple : Programmes de concert"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? `${LABEL_ID}-error` : `${LABEL_ID}-hint`}
          />
          {error ? (
            <p
              id={`${LABEL_ID}-error`}
              className="text-detail text-danger-foreground font-medium"
            >
              {error}
            </p>
          ) : (
            <p
              id={`${LABEL_ID}-hint`}
              className="text-note text-muted-foreground"
            >
              Adresse des documents : /documents/{slug || "…"}/
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={DESCRIPTION_ID}>
            Description
            <OptionalMark />
          </Label>
          <Input
            id={DESCRIPTION_ID}
            value={description}
            maxLength={300}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Par exemple : Archives des gazettes"
          />
        </div>
      </form>
    </FormDialog>
  );
}
