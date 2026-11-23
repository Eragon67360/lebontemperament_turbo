"use client";

import {
  SelectField,
  TextareaField,
  TextField,
} from "@/components/anniversary/form-fields";
import {
  FormFeedback,
  saveErrorMessage,
} from "@/components/anniversary/FormFeedback";
import { GROUP_ICON_COMPONENTS } from "@/components/groups/GroupIcon";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import { GroupApiError } from "@/hooks/useGroups";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { cn } from "@/lib/utils";
import {
  groupFormDefaults,
  groupFormSchema,
  type GroupFormValues,
} from "@/utils/groups/form";
import { GROUP_COLOR_CLASSES } from "@/utils/groups/view";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GROUP_COLORS,
  GROUP_ICONS,
  GROUP_VISIBILITIES,
  PICKABLE_GROUP_KINDS,
  type MemberGroup,
} from "@repo/domain/types/memberGroups";
import {
  GROUP_COLOR_LABELS,
  GROUP_ICON_LABELS,
  GROUP_KIND_HINTS,
  GROUP_KIND_LABELS,
  GROUP_VISIBILITY_DESCRIPTIONS,
  GROUP_VISIBILITY_LABELS,
} from "@repo/domain/utils/memberGroups";
import { useEffect, useState, type ReactNode } from "react";
import { useForm, useWatch, type Control } from "react-hook-form";

const FORM_ID = "group-form";

const LABELS = {
  name: { label: "Nom du groupe", id: "group-name" },
  kind: { label: "Type", id: "group-kind" },
  description: { label: "À quoi sert-il ?", id: "group-description" },
  visibility: { label: "Qui voit le groupe ?", id: "group-visibility" },
  color: { label: "Teinte", id: "group-color" },
  icon: { label: "Icône", id: "group-icon" },
};

const KIND_OPTIONS = PICKABLE_GROUP_KINDS.map((value) => ({
  value,
  label: GROUP_KIND_LABELS[value],
}));

export interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The group being edited; none for a creation. */
  group?: MemberGroup | null;
  /** Saves; throws when it fails (a GroupApiError names its field). */
  onSubmit: (values: GroupFormValues) => Promise<void>;
  isPending: boolean;
}

/**
 * « Nouveau groupe » / « Modifier le groupe » (superadmins): the name, the
 * type, what it is for, who sees it, and its tint and icon for the cards.
 */
export function GroupDialog({
  open,
  onOpenChange,
  group,
  onSubmit,
  isPending,
}: GroupDialogProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: groupFormDefaults(group ?? null),
    shouldFocusError: false,
  });
  const kind = useWatch({ control: form.control, name: "kind" });

  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(groupFormDefaults(group ?? null));
    // Reset on open and when the subject changes, not when the list refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, group?.id, form]);

  const submit = async (values: GroupFormValues) => {
    setSaveError(null);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof GroupApiError && error.field) {
        const field = error.field as keyof GroupFormValues;
        if (field in LABELS) {
          form.setError(field, { message: error.message });
          return;
        }
      }
      setSaveError(saveErrorMessage(error));
    }
  };

  // A group of a kind the form doesn't offer (« ensemble ») keeps it.
  const kindEditable =
    !group || (PICKABLE_GROUP_KINDS as readonly string[]).includes(group.kind);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={group ? `Modifier « ${group.name} »` : "Nouveau groupe"}
      description={
        group
          ? "Les changements s'affichent tout de suite dans l'administration ; les événements du groupe restent réservés à ses membres."
          : "Créez le groupe, puis ajoutez-y ses membres : vous pourrez ensuite lui réserver des événements."
      }
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={isPending}
      submitLabel={group ? "Enregistrer" : "Créer le groupe"}
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
            name="name"
            id={LABELS.name.id}
            label={LABELS.name.label}
            required
            placeholder="Commission concerts"
          />
          {kindEditable && (
            <SelectField
              control={form.control}
              name="kind"
              id={LABELS.kind.id}
              label={LABELS.kind.label}
              options={KIND_OPTIONS}
              hint={kind ? GROUP_KIND_HINTS[kind] : undefined}
            />
          )}
          <TextareaField
            control={form.control}
            name="description"
            id={LABELS.description.id}
            label={LABELS.description.label}
            rows={2}
            placeholder="Prépare le programme de la saison et les concerts."
            hint="Une phrase, affichée sur la carte du groupe."
          />

          <ChoiceField
            control={form.control}
            name="visibility"
            id={LABELS.visibility.id}
            legend={LABELS.visibility.label}
            layout="stack"
            options={GROUP_VISIBILITIES.map((value) => ({
              value,
              label: GROUP_VISIBILITY_LABELS[value],
              description: GROUP_VISIBILITY_DESCRIPTIONS[value],
            }))}
          />

          <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
            <ChoiceField
              control={form.control}
              name="color"
              id={LABELS.color.id}
              legend={LABELS.color.label}
              layout="swatches"
              options={GROUP_COLORS.map((value) => ({
                value,
                label: GROUP_COLOR_LABELS[value],
                visual: (
                  <span
                    aria-hidden
                    className={cn(
                      "block size-6 rounded-full border border-current/30",
                      GROUP_COLOR_CLASSES[value],
                    )}
                  />
                ),
              }))}
            />
            <ChoiceField
              control={form.control}
              name="icon"
              id={LABELS.icon.id}
              legend={LABELS.icon.label}
              layout="swatches"
              options={GROUP_ICONS.map((value) => {
                const Icon = GROUP_ICON_COMPONENTS[value];
                return {
                  value,
                  label: GROUP_ICON_LABELS[value],
                  visual: <Icon aria-hidden className="size-5" />,
                };
              })}
            />
          </div>
        </form>
      </Form>
    </FormDialog>
  );
}

type Choice = {
  value: string;
  label: string;
  description?: string;
  /** A swatch or an icon: the label is then for screen readers and the tooltip. */
  visual?: ReactNode;
};

/**
 * A radio group in a fieldset: stacked cards with a description, or a row of
 * 44 px swatches (tint, icon) whose names are read out and shown on hover.
 */
function ChoiceField({
  control,
  name,
  id,
  legend,
  options,
  layout,
}: {
  control: Control<GroupFormValues>;
  name: "visibility" | "color" | "icon";
  id: string;
  legend: string;
  options: readonly Choice[];
  layout: "stack" | "swatches";
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <fieldset id={id} className="space-y-2">
            <legend className="text-detail mb-2 font-medium">{legend}</legend>
            <div
              className={
                layout === "stack"
                  ? "grid gap-2 sm:grid-cols-2"
                  : "flex flex-wrap gap-1.5"
              }
            >
              {options.map((option) => {
                const checked = field.value === option.value;
                const inputId = `${id}-${option.value}`;
                return (
                  <label
                    key={option.value}
                    htmlFor={inputId}
                    title={layout === "swatches" ? option.label : undefined}
                    className={cn(
                      "border-border has-focus-visible:outline-ring relative flex cursor-pointer rounded-md border has-focus-visible:outline-2 has-focus-visible:outline-offset-2",
                      checked
                        ? "border-primary-strong bg-primary-soft"
                        : "hover:bg-accent",
                      layout === "stack"
                        ? "flex-col gap-1 p-3"
                        : "size-11 items-center justify-center",
                    )}
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name={`${id}-choice`}
                      value={option.value}
                      checked={checked}
                      onChange={() => field.onChange(option.value)}
                      onBlur={field.onBlur}
                      ref={checked ? field.ref : undefined}
                      className="sr-only"
                    />
                    {layout === "stack" ? (
                      <>
                        <span className="font-medium">{option.label}</span>
                        {option.description && (
                          <span className="text-note text-muted-foreground">
                            {option.description}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {option.visual}
                        <span className="sr-only">{option.label}</span>
                      </>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {layout === "stack" && (
            <FormDescription>
              Les événements réservés au groupe ne sont jamais montrés aux
              autres membres, quel que soit ce choix.
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
