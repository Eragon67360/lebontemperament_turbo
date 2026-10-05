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
import { FileUpload } from "@/components/FileUpload";
import { Form } from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import { Label, OptionalMark } from "@/components/ui/label";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import type { Tour } from "@/types/tours";
import { CONTEXT_LABELS, parseIsoDate } from "@/utils/concerts/schedule";
import {
  CONTEXTS,
  tourFormSchema,
  type TourFormValues,
} from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

const FORM_ID = "tour-form";

const LABELS = {
  tourName: { label: "Nom de la tournée", id: "tourName" },
  context: { label: "Type", id: "tour-context" },
  start_date: { label: "Premier concert", id: "tour-start-date" },
  end_date: { label: "Dernier concert", id: "tour-end-date" },
  description: { label: "Description", id: "tour-description" },
};

const TYPE_OPTIONS = CONTEXTS.map((value) => ({
  value,
  label: CONTEXT_LABELS[value]!,
}));

const defaults = (tour?: Tour | null): TourFormValues => ({
  tourName: tour?.name ?? "",
  description: tour?.description ?? "",
  context: (tour?.context as TourFormValues["context"]) ?? "orchestre",
  start_date:
    (tour?.start_date ? parseIsoDate(tour.start_date) : null) ?? undefined,
  end_date: (tour?.end_date ? parseIsoDate(tour.end_date) : null) ?? undefined,
});

export interface TourDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tour?: Tour | null;
  onSubmit: (values: TourFormValues, poster: File | null) => Promise<void>;
  isPending: boolean;
}

/** « Nouvelle tournée » / « Modifier « … » » in direction B. */
export function TourDialog({
  open,
  onOpenChange,
  tour,
  onSubmit,
  isPending,
}: TourDialogProps) {
  const [poster, setPoster] = useState<File | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<TourFormValues>({
    resolver: zodResolver(tourFormSchema),
    defaultValues: defaults(tour),
    shouldFocusError: false,
  });
  const startDate = useWatch({ control: form.control, name: "start_date" });

  useResetOnChange([open], () => {
    setSaveError(null);
    setPoster(null);
  });
  useEffect(() => {
    if (open) form.reset(defaults(tour));
  }, [open, tour, form]);

  const submit = async (values: TourFormValues) => {
    setSaveError(null);
    try {
      await onSubmit(values, poster);
      onOpenChange(false);
    } catch (error) {
      setSaveError(saveErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={tour ? `Modifier « ${tour.name} »` : "Nouvelle tournée"}
      description="Une tournée regroupe plusieurs concerts sous un même nom ; ses dates peuvent être précisées plus tard."
      formId={FORM_ID}
      isDirty={form.formState.isDirty || poster !== null}
      isPending={isPending}
      submitLabel={tour ? "Enregistrer" : "Créer la tournée"}
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
            name="tourName"
            id={LABELS.tourName.id}
            label={LABELS.tourName.label}
            required
            placeholder="Tournée d'été 2026"
          />
          <SelectField
            control={form.control}
            name="context"
            id={LABELS.context.id}
            label={LABELS.context.label}
            options={TYPE_OPTIONS}
            hint="Qui est sur scène : l'orchestre, le chœur ou les deux."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <DateField
              control={form.control}
              name="start_date"
              id={LABELS.start_date.id}
              label={LABELS.start_date.label}
              hint="Sans dates, la tournée reste dans « À venir »."
            />
            <DateField
              control={form.control}
              name="end_date"
              id={LABELS.end_date.id}
              label={LABELS.end_date.label}
              disabledDays={(date) =>
                startDate instanceof Date ? date < startDate : false
              }
              hint="Après ce jour, la tournée passe dans « Passés »."
            />
          </div>
          <TextareaField
            control={form.control}
            name="description"
            id={LABELS.description.id}
            label={LABELS.description.label}
            rows={3}
            hint="Quelques lignes pour présenter la tournée sur le site."
          />
          <div className="space-y-2">
            <Label asChild>
              <span>
                Affiche de la tournée
                <OptionalMark />
              </span>
            </Label>
            <FileUpload
              onFileSelect={setPoster}
              onFileClear={() => setPoster(null)}
              value={poster}
              currentImageUrl={tour?.tour_poster ?? null}
              mode="image"
            />
          </div>
        </form>
      </Form>
    </FormDialog>
  );
}
