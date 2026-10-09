"use client";

import { TextField } from "@/components/anniversary/form-fields";
import {
  FormFeedback,
  saveErrorMessage,
} from "@/components/anniversary/FormFeedback";
import { Form } from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import type { User } from "@/types/user";
import {
  changeEmailFormSchema,
  type ChangeEmailFormValues,
} from "@/utils/formSchemas";
import { firstNameOf, memberName } from "@/utils/members/list";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const FORM_ID = "change-email-form";
const LABELS = {
  email: { label: "Nouvelle adresse e-mail", id: "change-email-new" },
};

export interface ChangeEmailDialogProps {
  /** The account whose email changes; the dialog is open while it is set. */
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (user: User, email: string) => Promise<void>;
  isPending: boolean;
}

/**
 * « Changer l’e-mail de Lucie BERNARD » (superadmins): the address the member
 * signs in with, applied at once. Says what changes for them and what to
 * update elsewhere.
 */
export function ChangeEmailDialog({
  user,
  onOpenChange,
  onSubmit,
  isPending,
}: ChangeEmailDialogProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const form = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailFormSchema),
    defaultValues: { email: "" },
    shouldFocusError: false,
  });
  const open = !!user;

  useResetOnChange([user?.id], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset({ email: "" });
  }, [open, user?.id, form]);

  const submit = async (values: ChangeEmailFormValues) => {
    if (!user) return;
    setSaveError(null);
    try {
      await onSubmit(user, values.email);
    } catch (error) {
      setSaveError(saveErrorMessage(error));
    }
  };

  const name = user ? firstNameOf(user) : "";

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={user ? `Changer l’e-mail de ${memberName(user)}` : ""}
      description={
        user ? (
          <>
            Adresse actuelle :{" "}
            <strong className="text-foreground font-medium break-all">
              {user.email}
            </strong>
          </>
        ) : undefined
      }
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={isPending}
      submitLabel="Changer l’e-mail"
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
            name="email"
            id={LABELS.email.id}
            label={LABELS.email.label}
            required
            type="email"
            inputMode="email"
            placeholder="prenom.nom@exemple.fr"
            hint={`L’adresse avec laquelle ${name} se connectera au site, à l’application et ici.`}
          />
          <ul className="text-detail text-muted-foreground list-disc space-y-1.5 pl-5">
            <li>
              Le changement est immédiat et aucun e-mail de confirmation n’est
              envoyé : vérifiez l’adresse avec {name}.
            </li>
            <li>
              Son mot de passe ne change pas. La connexion avec Google ou Apple
              continue de fonctionner avec le même compte Google ou Apple.
            </li>
            <li>
              Corrigez aussi l’adresse dans la liste des membres, sinon la
              prochaine synchronisation la signalera.
            </li>
          </ul>
        </form>
      </Form>
    </FormDialog>
  );
}
