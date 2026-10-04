"use client";

import {
  DateField,
  TextareaField,
  TextField,
} from "@/components/anniversary/form-fields";
import {
  FormFeedback,
  saveErrorMessage,
} from "@/components/anniversary/FormFeedback";
import { Form } from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { parseIsoDate } from "@/utils/concerts/schedule";
import {
  galleryVideoFormSchema,
  type GalleryVideoFormValues,
} from "@/utils/formSchemas";
import {
  parseSoloists,
  parseYouTubeInput,
  youtubeWatchUrl,
} from "@/utils/videos/youtube";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Video, VideoFormData } from "@repo/domain/types/videos";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const FORM_ID = "gallery-video-form";

const LABELS = {
  youtube_url: { label: "Lien YouTube", id: "video-youtube-url" },
  title: { label: "Titre", id: "video-title" },
  composer: { label: "Compositeur", id: "video-composer" },
  performance_date: { label: "Date du concert", id: "video-date" },
  venue: { label: "Lieu", id: "video-venue" },
  soloists: { label: "Solistes", id: "video-soloists" },
};

const defaults = (video?: Video | null): GalleryVideoFormValues => ({
  youtube_url: video?.youtube_url ?? "",
  title: video?.title ?? "",
  composer: video?.composer ?? "",
  performance_date:
    (video?.performance_date ? parseIsoDate(video.performance_date) : null) ??
    (undefined as never),
  venue: video?.venue ?? "",
  soloists: video?.soloists?.join(", ") ?? "",
});

/** The row to store: the link normalised, the soloists split. */
export function toVideoFormData(values: GalleryVideoFormValues): VideoFormData {
  const id = parseYouTubeInput(values.youtube_url);
  return {
    title: values.title.trim(),
    composer: values.composer.trim(),
    youtube_url: id ? youtubeWatchUrl(id) : values.youtube_url.trim(),
    performance_date: format(values.performance_date, "yyyy-MM-dd"),
    venue: values.venue.trim(),
    soloists: parseSoloists(values.soloists),
  };
}

export interface VideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video?: Video | null;
  onSubmit: (data: VideoFormData) => Promise<void>;
  isPending: boolean;
}

/** « Ajouter une vidéo » / « Modifier « … » » of the public gallery, in direction B. */
export function VideoDialog({
  open,
  onOpenChange,
  video,
  onSubmit,
  isPending,
}: VideoDialogProps) {
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<GalleryVideoFormValues>({
    resolver: zodResolver(galleryVideoFormSchema),
    defaultValues: defaults(video),
    shouldFocusError: false,
  });

  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(defaults(video));
  }, [open, video, form]);

  const submit = async (values: GalleryVideoFormValues) => {
    setSaveError(null);
    try {
      await onSubmit(toVideoFormData(values));
      onOpenChange(false);
    } catch (error) {
      setSaveError(saveErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={video ? `Modifier « ${video.title} »` : "Ajouter une vidéo"}
      description="Une vidéo de la galerie publique : son lien YouTube et de quoi la présenter."
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={isPending}
      submitLabel={video ? "Enregistrer" : "Ajouter"}
    >
      <Form {...form}>
        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(submit)}
          noValidate
          className="space-y-5"
        >
          <FormFeedback
            errors={form.formState.errors}
            labels={LABELS}
            submitCount={form.formState.submitCount}
            saveError={saveError}
          />
          <TextField
            control={form.control}
            name="youtube_url"
            id={LABELS.youtube_url.id}
            label={LABELS.youtube_url.label}
            required
            type="url"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=…"
            hint="L'adresse de la vidéo (youtube.com, youtu.be, shorts) ou son identifiant de 11 caractères."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="title"
              id={LABELS.title.id}
              label={LABELS.title.label}
              required
              placeholder="Requiem"
              hint="Le titre de l'œuvre, tel qu'il s'affiche dans la galerie."
            />
            <TextField
              control={form.control}
              name="composer"
              id={LABELS.composer.id}
              label={LABELS.composer.label}
              required
              placeholder="Gabriel Fauré"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <DateField
              control={form.control}
              name="performance_date"
              id={LABELS.performance_date.id}
              label={LABELS.performance_date.label}
              required
              disabledDays={(date) => date > new Date()}
              hint="Le jour de l'enregistrement."
            />
            <TextField
              control={form.control}
              name="venue"
              id={LABELS.venue.id}
              label={LABELS.venue.label}
              required
              placeholder="Église Saint-Paul, Strasbourg"
            />
          </div>
          <TextareaField
            control={form.control}
            name="soloists"
            id={LABELS.soloists.id}
            label={LABELS.soloists.label}
            rows={2}
            placeholder="Prénom Nom, Prénom Nom"
            hint="Les noms, séparés par des virgules."
          />
        </form>
      </Form>
    </FormDialog>
  );
}
