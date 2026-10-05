"use client";

import {
  IconField,
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
  useCreateTimelineEvent,
  useUpdateTimelineEvent,
} from "@/hooks/useAnniversaryTimeline";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import type { AnniversaryTimelineEvent } from "@/types/anniversary";
import { DEFAULT_ICON, isIconName } from "@/utils/anniversary/icons";
import {
  timelineEventFormSchema,
  type TimelineEventFormInput,
  type TimelineEventFormValues,
} from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const FORM_ID = "timeline-event-form";

const LABELS = {
  year: { label: "Année", id: "event-year" },
  title: { label: "Titre", id: "event-title" },
  description: { label: "Description", id: "event-description" },
  icon_name: { label: "Icône", id: "event-icon" },
  is_visible: { label: "Visible sur le site", id: "event-visible" },
};

const defaults = (
  event?: AnniversaryTimelineEvent,
): TimelineEventFormInput => ({
  year: event?.year ? String(event.year) : "",
  title: event?.title ?? "",
  description: event?.description ?? "",
  icon_name: isIconName(event?.icon_name) ? event.icon_name : DEFAULT_ICON,
  is_visible: event?.is_visible ?? true,
});

interface TimelineEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: AnniversaryTimelineEvent;
  nextOrder: number;
}

export function TimelineEventDialog({
  open,
  onOpenChange,
  event,
  nextOrder,
}: TimelineEventDialogProps) {
  const create = useCreateTimelineEvent();
  const update = useUpdateTimelineEvent();
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<
    TimelineEventFormInput,
    unknown,
    TimelineEventFormValues
  >({
    resolver: zodResolver(timelineEventFormSchema),
    defaultValues: defaults(event),
    shouldFocusError: false,
  });

  // A fresh open starts clean: the fields from the item, no stale error.
  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(defaults(event));
  }, [open, event, form]);

  const onSubmit = async (values: TimelineEventFormValues) => {
    setSaveError(null);
    try {
      if (event) {
        await update.mutateAsync({ id: event.id, ...values });
        toast.success(`« ${values.title} » enregistré`);
      } else {
        await create.mutateAsync({ ...values, display_order: nextOrder });
        toast.success(`« ${values.title} » ajouté à la chronologie`);
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
      title={event ? `Modifier « ${event.title} »` : "Ajouter un événement"}
      description="Un moment marquant de l'histoire de l'association, daté de son année."
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={create.isPending || update.isPending}
      submitLabel={event ? "Enregistrer" : "Ajouter"}
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
          <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
            <YearField
              control={form.control}
              name="year"
              id={LABELS.year.id}
              label={LABELS.year.label}
              required
              placeholder="1984"
            />
            <TextField
              control={form.control}
              name="title"
              id={LABELS.title.id}
              label={LABELS.title.label}
              required
              placeholder="La création"
            />
          </div>
          <TextareaField
            control={form.control}
            name="description"
            id={LABELS.description.id}
            label={LABELS.description.label}
            required
            rows={5}
            placeholder="Un dimanche de novembre 1984…"
          />
          <IconField
            control={form.control}
            name="icon_name"
            id={LABELS.icon_name.id}
          />
          <SwitchField
            control={form.control}
            name="is_visible"
            id={LABELS.is_visible.id}
            label={LABELS.is_visible.label}
            hint="Masqué, l'événement reste ici sans apparaître sur la page."
          />
        </form>
      </Form>
    </FormDialog>
  );
}
