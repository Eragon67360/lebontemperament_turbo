"use client";

import { readAudioDuration } from "@/components/anniversary/AssetUploader";
import {
  AssetField,
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
  useCreateAudioMemory,
  useUpdateAudioMemory,
} from "@/hooks/useAnniversaryAudio";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import type { AnniversaryAudioMemory } from "@/types/anniversary";
import {
  audioMemoryFormSchema,
  type AudioMemoryFormInput,
  type AudioMemoryFormValues,
} from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const FORM_ID = "audio-memory-form";

const LABELS = {
  audio_url: { label: "Fichier audio", id: "audio-file" },
  title: { label: "Titre", id: "audio-title" },
  description: { label: "Description", id: "audio-description" },
  speaker_name: { label: "Qui parle", id: "audio-speaker" },
  year: { label: "Année", id: "audio-year" },
  duration: { label: "Durée", id: "audio-duration" },
  is_visible: { label: "Visible sur le site", id: "audio-visible" },
};

const defaults = (audio?: AnniversaryAudioMemory): AudioMemoryFormInput => ({
  audio_url: audio?.audio_url ?? "",
  title: audio?.title ?? "",
  description: audio?.description ?? "",
  speaker_name: audio?.speaker_name ?? "",
  year: audio?.year ? String(audio.year) : "",
  duration: audio?.duration ?? "",
  is_visible: audio?.is_visible ?? true,
});

interface AudioMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audio?: AnniversaryAudioMemory;
  nextOrder: number;
}

export function AudioMemoryDialog({
  open,
  onOpenChange,
  audio,
  nextOrder,
}: AudioMemoryDialogProps) {
  const create = useCreateAudioMemory();
  const update = useUpdateAudioMemory();
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<AudioMemoryFormInput, unknown, AudioMemoryFormValues>({
    resolver: zodResolver(audioMemoryFormSchema),
    defaultValues: defaults(audio),
    shouldFocusError: false,
  });

  // A fresh open starts clean: the fields from the item, no stale error.
  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(defaults(audio));
  }, [open, audio, form]);

  // The duration comes from the file itself; the field stays editable.
  const fillDuration = async (file: File) => {
    const duration = await readAudioDuration(file);
    if (duration && !form.getValues("duration")) {
      form.setValue("duration", duration, { shouldDirty: true });
    }
  };

  const onSubmit = async (values: AudioMemoryFormValues) => {
    setSaveError(null);
    const data = { ...values, speaker_name: values.speaker_name || null };
    try {
      if (audio) {
        await update.mutateAsync({ id: audio.id, ...data });
        toast.success(`« ${values.title} » enregistré`);
      } else {
        await create.mutateAsync({ ...data, display_order: nextOrder });
        toast.success(`« ${values.title} » ajouté`);
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
      title={
        audio ? `Modifier « ${audio.title} »` : "Ajouter un souvenir audio"
      }
      description="Un témoignage ou un extrait sonore à écouter sur la page des 40 ans."
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={create.isPending || update.isPending}
      submitLabel={audio ? "Enregistrer" : "Ajouter"}
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
            name="audio_url"
            id={LABELS.audio_url.id}
            label={LABELS.audio_url.label}
            kind="audio"
            folder="Site/anniversary/audio"
            onFile={fillDuration}
          />
          <TextField
            control={form.control}
            name="title"
            id={LABELS.title.id}
            label={LABELS.title.label}
            required
            placeholder="Simone se souvient : novembre 1984"
          />
          <TextareaField
            control={form.control}
            name="description"
            id={LABELS.description.id}
            label={LABELS.description.label}
            required
            placeholder="Simone raconte avec émotion…"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="speaker_name"
              id={LABELS.speaker_name.id}
              label={LABELS.speaker_name.label}
              placeholder="Simone, fondatrice"
            />
            <YearField
              control={form.control}
              name="year"
              id={LABELS.year.id}
              label={LABELS.year.label}
            />
          </div>
          <TextField
            control={form.control}
            name="duration"
            id={LABELS.duration.id}
            label={LABELS.duration.label}
            required
            placeholder="5:32"
            hint="Minutes:secondes, remplie automatiquement à l'envoi du fichier."
          />
          <SwitchField
            control={form.control}
            name="is_visible"
            id={LABELS.is_visible.id}
            label={LABELS.is_visible.label}
            hint="Masqué, le souvenir reste ici sans apparaître sur la page."
          />
        </form>
      </Form>
    </FormDialog>
  );
}
