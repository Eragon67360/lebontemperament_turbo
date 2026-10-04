"use client";

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
import { useCreatePhoto, useUpdatePhoto } from "@/hooks/useAnniversaryPhotos";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { PHOTO_CATEGORIES, type AnniversaryPhoto } from "@/types/anniversary";
import {
  photoFormSchema,
  type PhotoFormInput,
  type PhotoFormValues,
} from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const FORM_ID = "photo-form";

const LABELS = {
  image_url: { label: "Photo", id: "photo-image" },
  title: { label: "Titre", id: "photo-title" },
  description: { label: "Description", id: "photo-description" },
  year: { label: "Année", id: "photo-year" },
  category: { label: "Catégorie", id: "photo-category" },
  is_visible: { label: "Visible sur le site", id: "photo-visible" },
};

const CATEGORY_OPTIONS = PHOTO_CATEGORIES.map((value) => ({
  value,
  label: value,
}));

const defaults = (photo?: AnniversaryPhoto): PhotoFormInput => ({
  image_url: photo?.image_url ?? "",
  title: photo?.title ?? "",
  description: photo?.description ?? "",
  year: photo?.year ? String(photo.year) : "",
  category: (photo?.category as PhotoFormValues["category"]) ?? "Concert",
  is_visible: photo?.is_visible ?? true,
});

interface PhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo?: AnniversaryPhoto;
  nextOrder: number;
}

export function PhotoDialog({
  open,
  onOpenChange,
  photo,
  nextOrder,
}: PhotoDialogProps) {
  const create = useCreatePhoto();
  const update = useUpdatePhoto();
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<PhotoFormInput, unknown, PhotoFormValues>({
    resolver: zodResolver(photoFormSchema),
    defaultValues: defaults(photo),
    shouldFocusError: false,
  });

  // A fresh open starts clean: the fields from the item, no stale error.
  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(defaults(photo));
  }, [open, photo, form]);

  const onSubmit = async (values: PhotoFormValues) => {
    setSaveError(null);
    const data = { ...values, description: values.description || null };
    try {
      if (photo) {
        await update.mutateAsync({ id: photo.id, ...data });
        toast.success(`« ${values.title} » enregistrée`);
      } else {
        await create.mutateAsync({ ...data, display_order: nextOrder });
        toast.success(`« ${values.title} » ajoutée`);
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
      title={photo ? `Modifier « ${photo.title} »` : "Ajouter une photo"}
      description="Une photo de la collection des 40 ans, avec son titre et son année."
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={create.isPending || update.isPending}
      submitLabel={photo ? "Enregistrer" : "Ajouter"}
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
            name="image_url"
            id={LABELS.image_url.id}
            label={LABELS.image_url.label}
            kind="image"
            folder="Site/anniversary/photos"
          />
          <TextField
            control={form.control}
            name="title"
            id={LABELS.title.id}
            label={LABELS.title.label}
            required
            placeholder="Concert inaugural, 1984"
          />
          <TextareaField
            control={form.control}
            name="description"
            id={LABELS.description.id}
            label={LABELS.description.label}
            placeholder="Le tout premier concert du Bon Tempérament…"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <YearField
              control={form.control}
              name="year"
              id={LABELS.year.id}
              label={LABELS.year.label}
            />
            <SelectField
              control={form.control}
              name="category"
              id={LABELS.category.id}
              label={LABELS.category.label}
              options={CATEGORY_OPTIONS}
            />
          </div>
          <SwitchField
            control={form.control}
            name="is_visible"
            id={LABELS.is_visible.id}
            label={LABELS.is_visible.label}
            hint="Masquée, la photo reste ici sans apparaître sur la page."
          />
        </form>
      </Form>
    </FormDialog>
  );
}
