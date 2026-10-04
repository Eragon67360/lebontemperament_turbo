"use client";

import {
  IconField,
  SwitchField,
  TextField,
} from "@/components/anniversary/form-fields";
import {
  FormFeedback,
  saveErrorMessage,
} from "@/components/anniversary/FormFeedback";
import { Form } from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import {
  useCreateHeroStat,
  useUpdateHeroStat,
} from "@/hooks/useAnniversaryHeroStats";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import type { AnniversaryHeroStat } from "@/types/anniversary";
import { DEFAULT_ICON, isIconName } from "@/utils/anniversary/icons";
import {
  heroStatFormSchema,
  type HeroStatFormValues,
} from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const FORM_ID = "hero-stat-form";

const LABELS = {
  icon_name: { label: "Icône", id: "stat-icon" },
  number: { label: "Chiffre", id: "stat-number" },
  label: { label: "Libellé", id: "stat-label" },
  is_visible: { label: "Visible sur le site", id: "stat-visible" },
};

const defaults = (stat?: AnniversaryHeroStat): HeroStatFormValues => ({
  icon_name: isIconName(stat?.icon_name) ? stat.icon_name : DEFAULT_ICON,
  number: stat?.number ?? "",
  label: stat?.label ?? "",
  is_visible: stat?.is_visible ?? true,
});

interface HeroStatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stat?: AnniversaryHeroStat;
  /** The order a new figure takes: after the last one. */
  nextOrder: number;
}

export function HeroStatDialog({
  open,
  onOpenChange,
  stat,
  nextOrder,
}: HeroStatDialogProps) {
  const create = useCreateHeroStat();
  const update = useUpdateHeroStat();
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<HeroStatFormValues>({
    resolver: zodResolver(heroStatFormSchema),
    defaultValues: defaults(stat),
    shouldFocusError: false,
  });

  // A fresh open starts clean: the fields from the item, no stale error.
  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(defaults(stat));
  }, [open, stat, form]);

  const onSubmit = async (values: HeroStatFormValues) => {
    setSaveError(null);
    try {
      if (stat) {
        await update.mutateAsync({ id: stat.id, ...values });
        toast.success(`« ${values.number} ${values.label} » enregistré`);
      } else {
        await create.mutateAsync({ ...values, display_order: nextOrder });
        toast.success(`« ${values.number} ${values.label} » ajouté`);
      }
      onOpenChange(false);
    } catch (error) {
      // The failure used to reach the console only, with the dialog left
      // open and silent: now it is said here and in a toast.
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
        stat
          ? `Modifier « ${stat.number} ${stat.label} »`
          : "Ajouter un chiffre clé"
      }
      description="Un chiffre et son libellé, affichés sous l'en-tête de la page des 40 ans."
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={create.isPending || update.isPending}
      submitLabel={stat ? "Enregistrer" : "Ajouter"}
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
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="number"
              id={LABELS.number.id}
              label={LABELS.number.label}
              required
              placeholder="40"
              maxLength={20}
              hint="Affiché en grand, par exemple « 40 » ou « 200+ »."
            />
            <TextField
              control={form.control}
              name="label"
              id={LABELS.label.id}
              label={LABELS.label.label}
              required
              placeholder="ans"
              maxLength={100}
              hint="Le mot sous le chiffre, par exemple « concerts »."
            />
          </div>
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
            hint="Masqué, le chiffre reste ici sans apparaître sur la page."
          />
        </form>
      </Form>
    </FormDialog>
  );
}
