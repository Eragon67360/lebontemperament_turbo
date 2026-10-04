"use client";

import {
  DateField,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/anniversary/form-fields";
import {
  FormFeedback,
  saveErrorMessage,
} from "@/components/anniversary/FormFeedback";
import { ConcertPreview } from "@/components/concerts/ConcertPreview";
import { FileUpload } from "@/components/FileUpload";
import { Form } from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import { Label, OptionalMark } from "@/components/ui/label";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import {
  concertTitle,
  CONTEXT_LABELS,
  parseIsoDate,
} from "@/utils/concerts/schedule";
import {
  concertFormSchema,
  CONTEXTS,
  type ConcertFormValues,
} from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Concert } from "@repo/domain/types/concerts";
import { Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

const FORM_ID = "concert-form";

/** Field labels and ids, also the order of the error summary. */
const LABELS = {
  concertName: { label: "Titre", id: "concertName" },
  date: { label: "Date", id: "concert-date" },
  time: { label: "Heure", id: "time" },
  place: { label: "Lieu", id: "place" },
  tour_id: { label: "Tournée", id: "concert-tour" },
  context: { label: "Type de concert", id: "context" },
  related_link: { label: "Lien de billetterie", id: "related_link" },
  additional_informations: {
    label: "Informations complémentaires",
    id: "additional_informations",
  },
};

const NO_TOUR = "none";

export type TourOption = { id: string; name: string; past?: boolean };

const TYPE_OPTIONS = CONTEXTS.map((value) => ({
  value,
  label: CONTEXT_LABELS[value]!,
}));

const defaults = (concert?: Concert | null): ConcertFormValues => ({
  concertName: concert?.name ?? "",
  place: concert?.place ?? "",
  date:
    (concert?.date ? parseIsoDate(concert.date) : null) ?? (undefined as never),
  time: concert?.time?.slice(0, 5) ?? "",
  context:
    (concert?.context as ConcertFormValues["context"]) ?? (undefined as never),
  tour_id: concert?.tour_id ?? NO_TOUR,
  additional_informations: concert?.additional_informations ?? "",
  related_link: concert?.related_link ?? "",
});

export interface ConcertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The concert being edited; none for a creation. */
  concert?: Concert | null;
  /** The tours a concert can belong to, upcoming first; past ones say so. */
  tours: readonly TourOption[];
  /** Saves (uploads the poster, then writes); throws when it fails. */
  onSubmit: (values: ConcertFormValues, poster: File | null) => Promise<void>;
  isPending: boolean;
}

/**
 * « Ajouter un concert » / « Modifier « … » » in direction B: three
 * sections (Le concert, Organisation, Pour le public), hints under the
 * fields, inline errors with the summary, and a live likeness of the public
 * card beside the form from `lg`.
 */
export function ConcertDialog({
  open,
  onOpenChange,
  concert,
  tours,
  onSubmit,
  isPending,
}: ConcertDialogProps) {
  const [poster, setPoster] = useState<File | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<ConcertFormValues>({
    resolver: zodResolver(concertFormSchema),
    defaultValues: defaults(concert),
    shouldFocusError: false,
  });

  useResetOnChange([open], () => {
    setSaveError(null);
    setPoster(null);
  });
  useEffect(() => {
    if (open) form.reset(defaults(concert));
  }, [open, concert, form]);

  const watched = useWatch({ control: form.control });
  const posterUrl = useMemo(
    () => (poster ? URL.createObjectURL(poster) : null),
    [poster],
  );
  useEffect(() => {
    return () => {
      if (posterUrl) URL.revokeObjectURL(posterUrl);
    };
  }, [posterUrl]);

  const tourOptions = useMemo(
    () => [
      { value: NO_TOUR, label: "Aucune" },
      ...tours.map((tour) => ({
        value: tour.id,
        label: tour.past ? `${tour.name} (passée)` : tour.name,
      })),
    ],
    [tours],
  );

  const submit = async (values: ConcertFormValues) => {
    setSaveError(null);
    try {
      await onSubmit(
        {
          ...values,
          tour_id: values.tour_id === NO_TOUR ? "" : values.tour_id,
        },
        poster,
      );
      onOpenChange(false);
    } catch (error) {
      setSaveError(saveErrorMessage(error));
    }
  };

  const preview = (
    <ConcertPreview
      values={{
        name: watched.concertName ?? "",
        place: watched.place ?? "",
        date: watched.date instanceof Date ? watched.date : null,
        time: watched.time ?? "",
        additional_informations: watched.additional_informations ?? "",
        related_link: watched.related_link ?? "",
        posterUrl: posterUrl ?? concert?.affiche ?? null,
      }}
    />
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        concert ? `Modifier « ${concertTitle(concert)} »` : "Ajouter un concert"
      }
      description={
        concert
          ? "Les changements apparaissent sur le site public dès l'enregistrement."
          : "Dès que vous l'enregistrez, le concert apparaît sur le site public dans « Prochains concerts »."
      }
      formId={FORM_ID}
      isDirty={form.formState.isDirty || poster !== null}
      isPending={isPending}
      submitLabel={concert ? "Enregistrer" : "Créer le concert"}
      className="lg:max-w-[960px]"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <Form {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(submit)}
            noValidate
            className="min-w-0 space-y-6"
          >
            <FormFeedback
              errors={form.formState.errors}
              labels={LABELS}
              submitCount={form.formState.submitCount}
              saveError={saveError}
            />

            <fieldset className="space-y-4">
              <legend className="text-[17px] leading-6 font-semibold">
                Le concert
              </legend>
              <TextField
                control={form.control}
                name="concertName"
                id={LABELS.concertName.id}
                label={LABELS.concertName.label}
                placeholder="Concert de Noël"
                hint="Tel qu'il s'affichera sur le site. Sans titre, le site écrit « Concert à … » suivi du lieu."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <DateField
                  control={form.control}
                  name="date"
                  id={LABELS.date.id}
                  label={LABELS.date.label}
                  required
                />
                <TextField
                  control={form.control}
                  name="time"
                  id={LABELS.time.id}
                  label={LABELS.time.label}
                  type="time"
                  required
                  hint="Sur 24 heures, par exemple 20:30."
                />
              </div>
              <TextField
                control={form.control}
                name="place"
                id={LABELS.place.id}
                label={LABELS.place.label}
                required
                placeholder="Église Saint-Paul, Strasbourg"
                hint="Le nom de la salle ou de l'église, avec la ville : le public le lira sous le titre."
              />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-[17px] leading-6 font-semibold">
                Organisation
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  control={form.control}
                  name="context"
                  id={LABELS.context.id}
                  label={LABELS.context.label}
                  options={TYPE_OPTIONS}
                  placeholder="Choisir…"
                  hint="Qui est sur scène : l'orchestre, le chœur ou les deux."
                />
                <SelectField
                  control={form.control}
                  name="tour_id"
                  id={LABELS.tour_id.id}
                  label={LABELS.tour_id.label}
                  required={false}
                  options={tourOptions}
                  hint="Rattache le concert à une tournée existante."
                />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-[17px] leading-6 font-semibold">
                Pour le public
              </legend>
              <div className="space-y-2">
                <Label asChild>
                  <span id="concert-poster-label">
                    Affiche
                    <OptionalMark />
                  </span>
                </Label>
                <FileUpload
                  onFileSelect={setPoster}
                  onFileClear={() => setPoster(null)}
                  value={poster}
                  currentImageUrl={concert?.affiche ?? null}
                  mode="image"
                />
              </div>
              <TextField
                control={form.control}
                name="related_link"
                id={LABELS.related_link.id}
                label={LABELS.related_link.label}
                type="url"
                inputMode="url"
                placeholder="https://"
                hint="Affiche un bouton « Informations et réservation » sur le site."
              />
              <TextareaField
                control={form.control}
                name="additional_informations"
                id={LABELS.additional_informations.id}
                label={LABELS.additional_informations.label}
                rows={4}
                hint="Tarifs, entrée libre, programme… Quelques lignes suffisent."
              />
            </fieldset>

            <details className="border-border bg-card rounded-md border lg:hidden">
              <summary className="text-primary-text flex min-h-11 cursor-pointer list-none items-center gap-2.5 px-3.5 py-1.5 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                <Eye className="size-5 shrink-0" aria-hidden />
                Voir l&apos;aperçu sur le site public
              </summary>
              <div className="border-border border-t p-3">{preview}</div>
            </details>
          </form>
        </Form>

        <aside
          className="hidden lg:sticky lg:top-0 lg:block"
          aria-labelledby="concert-preview-heading"
        >
          <h2
            id="concert-preview-heading"
            className="text-[17px] leading-6 font-semibold"
          >
            Aperçu sur le site public
          </h2>
          <p className="text-detail text-muted-foreground mt-1 mb-3">
            Se met à jour pendant que vous écrivez.
          </p>
          {preview}
        </aside>
      </div>
    </FormDialog>
  );
}
