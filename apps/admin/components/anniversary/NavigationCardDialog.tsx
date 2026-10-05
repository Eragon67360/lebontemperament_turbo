"use client";

import {
  IconField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/anniversary/form-fields";
import {
  FormFeedback,
  saveErrorMessage,
} from "@/components/anniversary/FormFeedback";
import { Form } from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import {
  useCreateNavigationCard,
  useUpdateNavigationCard,
} from "@/hooks/useAnniversaryNavigation";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import type { AnniversaryNavigationCard } from "@/types/anniversary";
import { DEFAULT_ICON, isIconName } from "@/utils/anniversary/icons";
import { PAGE_SECTIONS } from "@/utils/anniversary/sections";
import {
  navigationCardFormSchema,
  type NavigationCardFormValues,
} from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const FORM_ID = "navigation-card-form";

const LABELS = {
  title: { label: "Titre", id: "card-title" },
  description: { label: "Description", id: "card-description" },
  target_section_id: { label: "Mène à la section", id: "card-target" },
  icon_name: { label: "Icône", id: "card-icon" },
  is_visible: { label: "Visible sur le site", id: "card-visible" },
};

const SECTION_OPTIONS = PAGE_SECTIONS.map((section) => ({
  value: section.id,
  label: section.label,
}));

const defaults = (
  card?: AnniversaryNavigationCard,
): NavigationCardFormValues => ({
  title: card?.title ?? "",
  description: card?.description ?? "",
  icon_name: isIconName(card?.icon_name) ? card.icon_name : DEFAULT_ICON,
  target_section_id: card?.target_section_id ?? "",
  is_visible: card?.is_visible ?? true,
});

interface NavigationCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: AnniversaryNavigationCard;
  nextOrder: number;
}

export function NavigationCardDialog({
  open,
  onOpenChange,
  card,
  nextOrder,
}: NavigationCardDialogProps) {
  const create = useCreateNavigationCard();
  const update = useUpdateNavigationCard();
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<NavigationCardFormValues>({
    resolver: zodResolver(navigationCardFormSchema),
    defaultValues: defaults(card),
    shouldFocusError: false,
  });

  // A fresh open starts clean: the fields from the item, no stale error.
  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(defaults(card));
  }, [open, card, form]);

  const onSubmit = async (values: NavigationCardFormValues) => {
    setSaveError(null);
    try {
      if (card) {
        await update.mutateAsync({ id: card.id, ...values });
        toast.success(`« ${values.title} » enregistrée`);
      } else {
        await create.mutateAsync({ ...values, display_order: nextOrder });
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
      title={card ? `Modifier « ${card.title} »` : "Ajouter une carte"}
      description="Une carte en haut de la page, qui emmène le visiteur vers une de ses sections."
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={create.isPending || update.isPending}
      submitLabel={card ? "Enregistrer" : "Ajouter"}
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
          <TextField
            control={form.control}
            name="title"
            id={LABELS.title.id}
            label={LABELS.title.label}
            required
            placeholder="Notre histoire"
          />
          <TextareaField
            control={form.control}
            name="description"
            id={LABELS.description.id}
            label={LABELS.description.label}
            required
            placeholder="Parcourez 40 ans de moments marquants…"
            hint="Une ou deux phrases sous le titre de la carte."
          />
          <SelectField
            control={form.control}
            name="target_section_id"
            id={LABELS.target_section_id.id}
            label={LABELS.target_section_id.label}
            options={SECTION_OPTIONS}
            placeholder="Choisir une section de la page"
            hint="La section de la page des 40 ans jusqu'à laquelle la carte fait défiler."
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
            hint="Masquée, la carte reste ici sans apparaître sur la page."
          />
        </form>
      </Form>
    </FormDialog>
  );
}
