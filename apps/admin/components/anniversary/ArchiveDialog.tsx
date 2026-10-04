"use client";

import { formatFileSize } from "@/components/anniversary/AssetUploader";
import {
  AssetField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
  YearField,
} from "@/components/anniversary/form-fields";
import {
  FormFeedback,
  saveErrorMessage,
} from "@/components/anniversary/FormFeedback";
import { Form } from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import {
  useCreateArchive,
  useUpdateArchive,
} from "@/hooks/useAnniversaryArchives";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import type { AnniversaryArchive } from "@/types/anniversary";
import {
  ARCHIVE_THEME_OPTIONS,
  ARCHIVE_TYPE_OPTIONS,
} from "@/utils/anniversary/labels";
import {
  archiveFormSchema,
  type ArchiveFormInput,
  type ArchiveFormValues,
} from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const FORM_ID = "archive-form";

const LABELS = {
  file_url: { label: "Document", id: "archive-file" },
  title: { label: "Titre", id: "archive-title" },
  description: { label: "Description", id: "archive-description" },
  year: { label: "Année", id: "archive-year" },
  type: { label: "Type de document", id: "archive-type" },
  theme: { label: "Thème", id: "archive-theme" },
  file_size: { label: "Taille", id: "archive-size" },
  is_visible: { label: "Visible sur le site", id: "archive-visible" },
};

const defaults = (archive?: AnniversaryArchive): ArchiveFormInput => ({
  title: archive?.title ?? "",
  description: archive?.description ?? "",
  year: archive?.year ? String(archive.year) : "",
  type: (archive?.type as ArchiveFormValues["type"]) ?? "assemblée-générale",
  theme: archive?.theme ?? "Gouvernance",
  file_url: archive?.file_url ?? "",
  file_size: archive?.file_size ?? "",
  is_visible: archive?.is_visible ?? true,
});

interface ArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  archive?: AnniversaryArchive;
}

export function ArchiveDialog({
  open,
  onOpenChange,
  archive,
}: ArchiveDialogProps) {
  const create = useCreateArchive();
  const update = useUpdateArchive();
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<ArchiveFormInput, unknown, ArchiveFormValues>({
    resolver: zodResolver(archiveFormSchema),
    defaultValues: defaults(archive),
    shouldFocusError: false,
  });

  // A fresh open starts clean: the fields from the item, no stale error.
  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(defaults(archive));
  }, [open, archive, form]);

  const onSubmit = async (values: ArchiveFormValues) => {
    setSaveError(null);
    try {
      if (archive) {
        await update.mutateAsync({ id: archive.id, ...values });
        toast.success(`« ${values.title} » enregistrée`);
      } else {
        await create.mutateAsync(values);
        toast.success(`« ${values.title} » ajoutée aux archives`);
      }
      onOpenChange(false);
    } catch (error) {
      const message = saveErrorMessage(error);
      setSaveError(message);
      toast.error("L'enregistrement a échoué", { description: message });
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={archive ? `Modifier « ${archive.title} »` : "Ajouter une archive"}
      description="Un document à consulter sur la page des 40 ans : compte rendu, gazette, programme…"
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={create.isPending || update.isPending}
      submitLabel={archive ? "Enregistrer" : "Ajouter"}
    >
      <Form {...form}>
        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="space-y-5"
        >
          <FormFeedback
            errors={form.formState.errors}
            labels={LABELS}
            submitCount={form.formState.submitCount}
            saveError={saveError}
          />
          <AssetField
            control={form.control}
            name="file_url"
            id={LABELS.file_url.id}
            label={LABELS.file_url.label}
            kind="document"
            folder="Site/anniversary/archives"
            onFile={(file) =>
              form.setValue("file_size", formatFileSize(file.size), {
                shouldDirty: true,
              })
            }
          />
          <TextField
            control={form.control}
            name="title"
            id={LABELS.title.id}
            label={LABELS.title.label}
            required
            placeholder="Assemblée générale 2023"
          />
          <TextareaField
            control={form.control}
            name="description"
            id={LABELS.description.id}
            label={LABELS.description.label}
            required
            placeholder="Compte rendu complet de l'assemblée générale annuelle…"
          />
          <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
            <YearField
              control={form.control}
              name="year"
              id={LABELS.year.id}
              label={LABELS.year.label}
              required
              placeholder="2023"
            />
            <SelectField
              control={form.control}
              name="type"
              id={LABELS.type.id}
              label={LABELS.type.label}
              options={ARCHIVE_TYPE_OPTIONS}
            />
          </div>
          <SelectField
            control={form.control}
            name="theme"
            id={LABELS.theme.id}
            label={LABELS.theme.label}
            options={ARCHIVE_THEME_OPTIONS}
          />
          <SwitchField
            control={form.control}
            name="is_visible"
            id={LABELS.is_visible.id}
            label={LABELS.is_visible.label}
            hint="Masquée, l'archive reste ici sans apparaître sur la page."
          />
        </form>
      </Form>
    </FormDialog>
  );
}
