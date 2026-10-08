"use client";

import { Callout } from "@/components/ui/callout";
import {
  ErrorSummary,
  type ErrorSummaryItem,
} from "@/components/ui/error-summary";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { Slot } from "@radix-ui/react-slot";
import { useState } from "react";
import { toast } from "sonner";

interface BugReportDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** An element that opens the dialog when clicked (the shell opens it from the account menu instead). */
  trigger?: React.ReactNode;
}

const FORM_ID = "bug-report-form";
const TITLE_ID = "bug-report-title";
const DESCRIPTION_ID = "bug-report-description";

type FieldErrors = { title?: string; description?: string };

/** « Signaler un problème » from the account menu: a title, a description, sent to the team. */
export function BugReportDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: BugReportDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState(false);
  const supabase = createClient();

  const reset = () => {
    setTitle("");
    setDescription("");
    setErrors({});
    setSubmitError(false);
  };

  const handleOpenChange = (next: boolean) => {
    // Closing (saved or abandoned) leaves an empty form for next time.
    if (!next) reset();
    setOpen(next);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!title.trim()) nextErrors.title = "Donnez un titre au signalement.";
    if (!description.trim())
      nextErrors.description = "Décrivez ce que vous avez constaté.";
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.description) return;

    setIsSubmitting(true);
    setSubmitError(false);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User must be authenticated");

      const { error } = await supabase.from("bug_reports").insert([
        {
          title,
          description,
          reported_by: user.id,
        },
      ]);

      if (error) throw error;

      toast.success("Merci, votre signalement est envoyé");
      handleOpenChange(false);
    } catch (error) {
      console.error("Error submitting bug report:", error);
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary: ErrorSummaryItem[] = [];
  if (errors.title)
    summary.push({ fieldId: TITLE_ID, label: "Titre", message: errors.title });
  if (errors.description)
    summary.push({
      fieldId: DESCRIPTION_ID,
      label: "Description",
      message: errors.description,
    });

  return (
    <>
      {trigger && <Slot onClick={() => handleOpenChange(true)}>{trigger}</Slot>}
      <FormDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Signaler un problème ou proposer une idée"
        description="Décrivez ce qui ne marche pas ou ce qui vous manquerait : l'équipe technique le verra tout de suite et vous répondra dans vos messages."
        formId={FORM_ID}
        isDirty={title !== "" || description !== ""}
        isPending={isSubmitting}
        submitLabel="Envoyer le signalement"
        pendingLabel="Envoi…"
      >
        <form
          id={FORM_ID}
          onSubmit={handleSubmit}
          noValidate
          className="grid gap-4"
        >
          <ErrorSummary errors={summary} />
          {submitError && (
            <Callout tone="danger" title="Le signalement n'a pas été envoyé">
              Vérifiez votre connexion, puis réessayez.
            </Callout>
          )}
          <div className="grid gap-2">
            <Label htmlFor={TITLE_ID}>
              Titre
              <RequiredMark />
            </Label>
            <Input
              id={TITLE_ID}
              placeholder="En quelques mots"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={Boolean(errors.title) || undefined}
              aria-describedby={errors.title ? `${TITLE_ID}-error` : undefined}
            />
            {errors.title && (
              <p
                id={`${TITLE_ID}-error`}
                className="text-detail text-danger-foreground font-medium"
              >
                {errors.title}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={DESCRIPTION_ID}>
              Description
              <RequiredMark />
            </Label>
            <Textarea
              id={DESCRIPTION_ID}
              placeholder="Ce que vous faisiez, ce qui s'est passé, ce que vous attendiez…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              aria-invalid={Boolean(errors.description) || undefined}
              aria-describedby={
                errors.description ? `${DESCRIPTION_ID}-error` : undefined
              }
            />
            {errors.description && (
              <p
                id={`${DESCRIPTION_ID}-error`}
                className="text-detail text-danger-foreground font-medium"
              >
                {errors.description}
              </p>
            )}
          </div>
        </form>
      </FormDialog>
    </>
  );
}
