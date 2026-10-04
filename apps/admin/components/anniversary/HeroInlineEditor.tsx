"use client";

import {
  EditorLoadError,
  EditorSkeleton,
  FieldGroup,
} from "@/components/anniversary/EditorFrame";
import {
  SelectField,
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
  useAnniversaryHero,
  useUpdateAnniversaryHero,
} from "@/hooks/useAnniversaryHero";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import type { AnniversaryHero } from "@/types/anniversary";
import { PAGE_SECTIONS } from "@/utils/anniversary/sections";
import { heroFormSchema, type HeroFormValues } from "@/utils/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const FORM_ID = "hero-form";

const LABELS = {
  hero_number: { label: "Chiffre", id: "hero-number" },
  hero_subtitle: { label: "Sous-titre", id: "hero-subtitle" },
  description: { label: "Texte d'introduction", id: "hero-description" },
  cta_text: { label: "Texte du bouton", id: "hero-cta-text" },
  cta_target_section: { label: "Le bouton mène à", id: "hero-cta-target" },
  enable_intro_animation: {
    label: "Jouer l'animation d'introduction",
    id: "hero-animation",
  },
  skip_button_text: {
    label: "Texte du bouton « Passer l'animation »",
    id: "hero-skip-text",
  },
};

const SECTION_OPTIONS = PAGE_SECTIONS.map((section) => ({
  value: section.id,
  label: section.label,
}));

const toValues = (hero: AnniversaryHero): HeroFormValues => ({
  hero_number: hero.hero_number ?? "",
  hero_subtitle: hero.hero_subtitle ?? "",
  description: hero.description ?? "",
  cta_text: hero.cta_text ?? "",
  cta_target_section: hero.cta_target_section ?? "",
  enable_intro_animation: hero.enable_intro_animation ?? true,
  skip_button_text: hero.skip_button_text ?? "",
});

export function HeroInlineEditor() {
  const { data: hero, isLoading, isError, refetch } = useAnniversaryHero();

  if (isLoading) {
    return <EditorSkeleton label="Chargement de l'en-tête…" />;
  }
  if (isError || !hero) {
    return (
      <EditorLoadError
        description="L'en-tête n'a pas pu être chargé. Rien n'est modifiable tant qu'il n'est pas récupéré."
        onRetry={() => refetch()}
      />
    );
  }
  return <HeroForm hero={hero} />;
}

function HeroForm({ hero }: { hero: AnniversaryHero }) {
  const update = useUpdateAnniversaryHero();
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<HeroFormValues>({
    resolver: zodResolver(heroFormSchema),
    defaultValues: toValues(hero),
    shouldFocusError: false,
  });
  const { isDirty } = form.formState;
  useUnsavedChangesWarning(isDirty);

  // A refetch (after a save, or in another tab) replaces the fields only
  // when nothing is being edited.
  useEffect(() => {
    if (!form.formState.isDirty) form.reset(toValues(hero));
  }, [hero, form]);

  const onSubmit = async (values: HeroFormValues) => {
    setSaveError(null);
    try {
      await update.mutateAsync(values);
      form.reset(values);
      toast.success("En-tête enregistré");
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
          title="Le grand titre"
          intro="Ce que le visiteur lit en premier : un chiffre en très grand, puis une phrase."
        >
          <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
            <TextField
              control={form.control}
              name="hero_number"
              id={LABELS.hero_number.id}
              label={LABELS.hero_number.label}
              required
              placeholder="40"
            />
            <TextField
              control={form.control}
              name="hero_subtitle"
              id={LABELS.hero_subtitle.id}
              label={LABELS.hero_subtitle.label}
              required
              placeholder="années de passion musicale"
            />
          </div>
          <TextareaField
            control={form.control}
            name="description"
            id={LABELS.description.id}
            label={LABELS.description.label}
            placeholder="Célébrons quatre décennies de musique partagée…"
            hint="Deux ou trois phrases sous le titre."
          />
        </FieldGroup>

        <FieldGroup
          title="Le bouton"
          intro="Un bouton sous le titre fait défiler la page jusqu'à une de ses sections."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="cta_text"
              id={LABELS.cta_text.id}
              label={LABELS.cta_text.label}
              required
              placeholder="Découvrir notre histoire"
            />
            <SelectField
              control={form.control}
              name="cta_target_section"
              id={LABELS.cta_target_section.id}
              label={LABELS.cta_target_section.label}
              options={SECTION_OPTIONS}
              placeholder="Choisir une section de la page"
            />
          </div>
        </FieldGroup>

        <FieldGroup
          title="L'animation d'introduction"
          intro="À l'arrivée, une courte animation précède le titre ; les visiteurs peuvent la passer, et elle ne rejoue pas pour ceux qui reviennent."
        >
          <SwitchField
            control={form.control}
            name="enable_intro_animation"
            id={LABELS.enable_intro_animation.id}
            label={LABELS.enable_intro_animation.label}
            hint="Désactivée, la page s'ouvre directement sur le titre."
          />
          <TextField
            control={form.control}
            name="skip_button_text"
            id={LABELS.skip_button_text.id}
            label={LABELS.skip_button_text.label}
            required
            placeholder="Passer l'animation"
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
              onClick={() => form.reset(toValues(hero))}
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
