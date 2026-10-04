"use client";

import {
  DateField,
  SelectField,
  SwitchField,
  TextField,
} from "@/components/anniversary/form-fields";
import {
  FormFeedback,
  saveErrorMessage,
} from "@/components/anniversary/FormFeedback";
import { Callout } from "@/components/ui/callout";
import { Form } from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import {
  rehearsalFormSchema,
  type RehearsalFormInput,
  type RehearsalFormValues,
} from "@/utils/formSchemas";
import {
  formatLongDateFr,
  parseIsoDate,
  recurrenceDates,
  rehearsalCountLabel,
} from "@/utils/season/schedule";
import { zodResolver } from "@hookform/resolvers/zod";
import { GROUP_TYPES, type Rehearsal } from "@repo/domain/types/rehearsals";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

const FORM_ID = "rehearsal-form";

/** Field labels and ids, also the order of the error summary. */
const LABELS = {
  name: { label: "Intitulé", id: "rehearsal-name" },
  group_type: { label: "Groupe concerné", id: "rehearsal-group" },
  date: { label: "Date", id: "rehearsal-date" },
  place: { label: "Lieu", id: "rehearsal-place" },
  start_time: { label: "Début", id: "rehearsal-start" },
  end_time: { label: "Fin", id: "rehearsal-end" },
  repeat: { label: "Répéter la séance", id: "rehearsal-repeat" },
  repeat_interval: {
    label: "Toutes les (semaines)",
    id: "rehearsal-repeat-interval",
  },
  repeat_until: { label: "Jusqu'au", id: "rehearsal-repeat-until" },
};

const GROUP_OPTIONS = GROUP_TYPES.map((value) => ({ value, label: value }));

const defaults = (rehearsal?: Rehearsal | null): RehearsalFormInput => ({
  name: rehearsal?.name ?? "",
  group_type: rehearsal?.group_type ?? "Tous",
  date:
    (rehearsal?.date ? parseIsoDate(rehearsal.date) : null) ??
    (undefined as never),
  place: rehearsal?.place ?? "",
  // The column is a `time`: "19:00:00" from the base, "19:00" from the input.
  start_time: rehearsal?.start_time?.slice(0, 5) ?? "",
  end_time: rehearsal?.end_time?.slice(0, 5) ?? "",
  repeat: false,
  repeat_interval: "1",
  repeat_until: undefined,
});

export interface RehearsalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The rehearsal being edited; none for a creation. */
  rehearsal?: Rehearsal | null;
  /** Saves; throws when it fails. */
  onSubmit: (values: RehearsalFormValues) => Promise<void>;
  isPending: boolean;
}

/**
 * « Ajouter une répétition » / « Modifier « … » » in direction B: the séance,
 * then, on a creation only, the weekly repeat with a live count of the
 * séances it will create.
 */
export function RehearsalDialog({
  open,
  onOpenChange,
  rehearsal,
  onSubmit,
  isPending,
}: RehearsalDialogProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const editing = !!rehearsal;

  const form = useForm<RehearsalFormInput, unknown, RehearsalFormValues>({
    resolver: zodResolver(rehearsalFormSchema),
    defaultValues: defaults(rehearsal),
    shouldFocusError: false,
  });

  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(defaults(rehearsal));
  }, [open, rehearsal, form]);

  const [date, repeat, repeatInterval, repeatUntil] = useWatch({
    control: form.control,
    name: ["date", "repeat", "repeat_interval", "repeat_until"],
  });

  const plannedCount = useMemo(() => {
    if (editing || !repeat) return null;
    if (!(date instanceof Date) || !(repeatUntil instanceof Date)) return null;
    const weeks = Number(repeatInterval);
    if (!Number.isInteger(weeks) || weeks < 1) return null;
    return recurrenceDates(date, weeks, repeatUntil).length;
  }, [editing, repeat, date, repeatInterval, repeatUntil]);

  const submit = async (values: RehearsalFormValues) => {
    setSaveError(null);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      setSaveError(saveErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        rehearsal ? `Modifier « ${rehearsal.name} »` : "Ajouter une répétition"
      }
      description={
        rehearsal
          ? "Les membres voient le changement dans leur calendrier dès l'enregistrement."
          : "La séance apparaît dans le calendrier des membres, sur le site et dans l'application."
      }
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={isPending}
      submitLabel={
        rehearsal
          ? "Enregistrer"
          : plannedCount && plannedCount > 1
            ? "Créer les répétitions"
            : "Créer la répétition"
      }
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

          {rehearsal?.event_id && (
            <Callout tone="info" title="Séance venue de Google Agenda">
              <p>
                Elle est synchronisée depuis l&apos;agenda partagé : une
                prochaine synchronisation peut écraser ce que vous modifiez ici.
                Pour un changement durable, modifiez aussi l&apos;événement dans
                Google Agenda.
              </p>
            </Callout>
          )}

          <TextField
            control={form.control}
            name="name"
            id={LABELS.name.id}
            label={LABELS.name.label}
            required
            placeholder="Répétition générale"
            hint="Tel que les membres le liront dans leur calendrier."
          />
          <SelectField
            control={form.control}
            name="group_type"
            id={LABELS.group_type.id}
            label={LABELS.group_type.label}
            options={GROUP_OPTIONS}
            hint="Qui est attendu : tout le monde, un pupitre ou l'orchestre."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <DateField
              control={form.control}
              name="date"
              id={LABELS.date.id}
              label={LABELS.date.label}
              required
            />
            <TextField
              control={form.control}
              name="place"
              id={LABELS.place.id}
              label={LABELS.place.label}
              required
              placeholder="Salle paroissiale, Barr"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="start_time"
              id={LABELS.start_time.id}
              label={LABELS.start_time.label}
              type="time"
              required
              hint="Sur 24 heures, par exemple 20:00."
            />
            <TextField
              control={form.control}
              name="end_time"
              id={LABELS.end_time.id}
              label={LABELS.end_time.label}
              type="time"
              required
            />
          </div>

          {!editing && (
            <fieldset className="space-y-4">
              <legend className="sr-only">Répétition hebdomadaire</legend>
              <SwitchField
                control={form.control}
                name="repeat"
                id={LABELS.repeat.id}
                label={LABELS.repeat.label}
                hint="Crée une séance identique toutes les semaines, ou toutes les deux, jusqu'à une date de fin."
              />
              {repeat && (
                <div className="space-y-4 pl-4 sm:pl-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      control={form.control}
                      name="repeat_interval"
                      id={LABELS.repeat_interval.id}
                      label={LABELS.repeat_interval.label}
                      required
                      inputMode="numeric"
                      maxLength={2}
                      hint="1 pour chaque semaine, 2 pour une semaine sur deux."
                    />
                    <DateField
                      control={form.control}
                      name="repeat_until"
                      id={LABELS.repeat_until.id}
                      label={LABELS.repeat_until.label}
                      required
                      disabledDays={(day) =>
                        date instanceof Date
                          ? format(day, "yyyy-MM-dd") <
                            format(date, "yyyy-MM-dd")
                          : false
                      }
                      hint="Dernier jour possible pour une séance."
                    />
                  </div>
                  {plannedCount !== null && (
                    <p
                      className="text-detail text-muted-foreground"
                      aria-live="polite"
                    >
                      {plannedCount === 0
                        ? "Aucune séance ne sera créée avec ces dates."
                        : `${rehearsalCountLabel(plannedCount)} ${
                            plannedCount > 1 ? "seront créées" : "sera créée"
                          }, à partir du ${formatLongDateFr(
                            format(date as Date, "yyyy-MM-dd"),
                          ).toLocaleLowerCase("fr-FR")}.`}
                    </p>
                  )}
                </div>
              )}
            </fieldset>
          )}
        </form>
      </Form>
    </FormDialog>
  );
}
