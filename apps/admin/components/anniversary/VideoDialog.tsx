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
import { useCreateVideo, useUpdateVideo } from "@/hooks/useAnniversaryVideos";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { VIDEO_CATEGORIES, type AnniversaryVideo } from "@/types/anniversary";
import {
  videoFormSchema,
  type VideoFormInput,
  type VideoFormValues,
} from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const FORM_ID = "video-form";

const LABELS = {
  thumbnail_url: { label: "Miniature", id: "video-thumbnail" },
  title: { label: "Titre", id: "video-title" },
  description: { label: "Description", id: "video-description" },
  video_url: { label: "Lien de la vidéo", id: "video-url" },
  year: { label: "Année", id: "video-year" },
  category: { label: "Catégorie", id: "video-category" },
  is_visible: { label: "Visible sur le site", id: "video-visible" },
};

const CATEGORY_OPTIONS = VIDEO_CATEGORIES.map((value) => ({
  value,
  label: value,
}));

const defaults = (video?: AnniversaryVideo): VideoFormInput => ({
  thumbnail_url: video?.thumbnail_url ?? "",
  title: video?.title ?? "",
  description: video?.description ?? "",
  video_url: video?.video_url ?? "",
  year: video?.year ? String(video.year) : "",
  category: (video?.category as VideoFormValues["category"]) ?? "Concert",
  is_visible: video?.is_visible ?? true,
});

interface VideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video?: AnniversaryVideo;
  nextOrder: number;
}

export function VideoDialog({
  open,
  onOpenChange,
  video,
  nextOrder,
}: VideoDialogProps) {
  const create = useCreateVideo();
  const update = useUpdateVideo();
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<VideoFormInput, unknown, VideoFormValues>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: defaults(video),
    shouldFocusError: false,
  });

  // A fresh open starts clean: the fields from the item, no stale error.
  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(defaults(video));
  }, [open, video, form]);

  const onSubmit = async (values: VideoFormValues) => {
    setSaveError(null);
    const data = { ...values, video_url: values.video_url || null };
    try {
      if (video) {
        await update.mutateAsync({ id: video.id, ...data });
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
      title={video ? `Modifier « ${video.title} »` : "Ajouter une vidéo"}
      description="Une vignette dans la galerie des 40 ans, avec le lien vers la vidéo."
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={create.isPending || update.isPending}
      submitLabel={video ? "Enregistrer" : "Ajouter"}
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
            name="thumbnail_url"
            id={LABELS.thumbnail_url.id}
            label={LABELS.thumbnail_url.label}
            kind="image"
            folder="Site/anniversary/videos/thumbnails"
          />
          <TextField
            control={form.control}
            name="title"
            id={LABELS.title.id}
            label={LABELS.title.label}
            required
            placeholder="Concert d'anniversaire 2024"
          />
          <TextareaField
            control={form.control}
            name="description"
            id={LABELS.description.id}
            label={LABELS.description.label}
            required
            placeholder="Le grand concert du 15 juin 2024…"
          />
          <TextField
            control={form.control}
            name="video_url"
            id={LABELS.video_url.id}
            label={LABELS.video_url.label}
            type="url"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=…"
            hint="L'adresse YouTube ou un lien direct ; sans lien, la vignette ne s'ouvre pas."
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
            hint="Masquée, la vidéo reste ici sans apparaître sur la page."
          />
        </form>
      </Form>
    </FormDialog>
  );
}
