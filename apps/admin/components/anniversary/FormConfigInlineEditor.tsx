"use client";

import {
  EditorLoadError,
  EditorSkeleton,
  FieldGroup,
} from "@/components/anniversary/EditorFrame";
import {
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/anniversary/form-fields";
import {
  FormFeedback,
  saveErrorMessage,
} from "@/components/anniversary/FormFeedback";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import {
  useFormConfig,
  useUpdateFormConfig,
} from "@/hooks/useAnniversaryFormConfig";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import type { AnniversaryFormConfig } from "@/types/anniversary";
import {
  formConfigFormSchema,
  type FormConfigFormValues,
} from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const FORM_ID = "form-config-form";

const LABELS = {
  section_title: { label: "Titre de la section", id: "config-title" },
  section_description: {
    label: "Texte d'invitation",
    id: "config-description",
  },
  name_label: { label: "Champ « nom »", id: "config-name-label" },
  email_label: { label: "Champ « e-mail »", id: "config-email-label" },
  message_label: { label: "Champ « souvenir »", id: "config-message-label" },
  year_label: { label: "Champ « année »", id: "config-year-label" },
  submit_button_text: { label: "Texte du bouton d'envoi", id: "config-submit" },
  success_message: { label: "Message après l'envoi", id: "config-success" },
  is_enabled: {
    label: "Formulaire ouvert aux visiteurs",
    id: "config-enabled",
  },
};

const toValues = (config: AnniversaryFormConfig): FormConfigFormValues => ({
  section_title: config.section_title ?? "",
  section_description: config.section_description ?? "",
  name_label: config.name_label ?? "",
  email_label: config.email_label ?? "",
  message_label: config.message_label ?? "",
  year_label: config.year_label ?? "",
  submit_button_text: config.submit_button_text ?? "",
  success_message: config.success_message ?? "",
  is_enabled: config.is_enabled ?? true,
});

export function FormConfigInlineEditor() {
  const { data: config, isLoading, isError, refetch } = useFormConfig();

  if (isLoading) {
    return <EditorSkeleton label="Chargement du formulaire…" />;
  }
  if (isError || !config) {
    return (
      <EditorLoadError
        description="Les réglages du formulaire n'ont pas pu être chargés. Rien n'est modifiable tant qu'ils ne sont pas récupérés."
        onRetry={() => refetch()}
      />
    );
  }
  return <FormConfigForm config={config} />;
}

function FormConfigForm({ config }: { config: AnniversaryFormConfig }) {
  const update = useUpdateFormConfig();
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<FormConfigFormValues>({
    resolver: zodResolver(formConfigFormSchema),
    defaultValues: toValues(config),
    shouldFocusError: false,
  });
  const { isDirty } = form.formState;
  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    if (!form.formState.isDirty) form.reset(toValues(config));
  }, [config, form]);

  const onSubmit = async (values: FormConfigFormValues) => {
    setSaveError(null);
    try {
      await update.mutateAsync(values);
      form.reset(values);
      toast.success("Formulaire enregistré");
    } catch (error) {
      const message = saveErrorMessage(error);
      setSaveError(message);
      toast.error("L'enregistrement a échoué", { description: message });
    }
  };

  return (
    <Form {...form}>
      <form
        id={FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
      >
        <FormFeedback
          errors={form.formState.errors}
          labels={LABELS}
          submitCount={form.formState.submitCount}
          saveError={saveError}
        />

        <FieldGroup
          title="L'invitation"
          intro="Le titre et le texte qui présentent le formulaire sur la page des 40 ans."
        >
          <TextField
            control={form.control}
            name="section_title"
            id={LABELS.section_title.id}
            label={LABELS.section_title.label}
            required
            placeholder="Partagez vos souvenirs"
          />
          <TextareaField
            control={form.control}
            name="section_description"
            id={LABELS.section_description.id}
            label={LABELS.section_description.label}
            required
            placeholder="Vous avez des souvenirs avec Le Bon Tempérament ? Racontez-les-nous…"
          />
        </FieldGroup>

        <FieldGroup
          title="Les champs"
          intro="Les intitulés des quatre champs que le visiteur remplit."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="name_label"
              id={LABELS.name_label.id}
              label={LABELS.name_label.label}
              required
              placeholder="Votre nom"
            />
            <TextField
              control={form.control}
              name="email_label"
              id={LABELS.email_label.id}
              label={LABELS.email_label.label}
              required
              placeholder="Votre e-mail"
            />
            <TextField
              control={form.control}
              name="message_label"
              id={LABELS.message_label.id}
              label={LABELS.message_label.label}
              required
              placeholder="Votre souvenir"
            />
            <TextField
              control={form.control}
              name="year_label"
              id={LABELS.year_label.id}
              label={LABELS.year_label.label}
              required
              placeholder="Année (facultatif)"
            />
          </div>
        </FieldGroup>

        <FieldGroup
          title="L'envoi"
          intro="Le bouton, puis le remerciement affiché une fois le souvenir envoyé ; il est ensuite relu ici, dans « Modération »."
        >
          <TextField
            control={form.control}
            name="submit_button_text"
            id={LABELS.submit_button_text.id}
            label={LABELS.submit_button_text.label}
            required
            placeholder="Partager mon souvenir"
          />
          <TextareaField
            control={form.control}
            name="success_message"
            id={LABELS.success_message.id}
            label={LABELS.success_message.label}
            required
            rows={2}
            placeholder="Merci pour votre partage ! Votre souvenir sera publié après relecture."
          />
          <SwitchField
            control={form.control}
            name="is_enabled"
            id={LABELS.is_enabled.id}
            label={LABELS.is_enabled.label}
            hint="Fermé, la section reste visible mais personne ne peut envoyer de souvenir."
          />
        </FieldGroup>

        <StickyActionBar
          className="-mx-4 sm:-mx-6"
          note={
            isDirty
              ? "Modifications non enregistrées."
              : "Rien ne change sur le site avant « Enregistrer »."
          }
          secondary={
            <Button
              type="button"
              variant="ghost"
              disabled={!isDirty || update.isPending}
              onClick={() => form.reset(toValues(config))}
            >
              Annuler les modifications
            </Button>
          }
        >
          <Button
            type="submit"
            form={FORM_ID}
            disabled={update.isPending}
            aria-busy={update.isPending || undefined}
          >
            {update.isPending && (
              <Loader2 className="animate-spin" aria-hidden />
            )}
            {update.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </StickyActionBar>
      </form>
    </Form>
  );
}
