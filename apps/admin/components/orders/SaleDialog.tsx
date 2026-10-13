"use client";

import {
  DateField,
  SelectField,
  TextField,
} from "@/components/anniversary/form-fields";
import {
  FormFeedback,
  saveErrorMessage,
} from "@/components/anniversary/FormFeedback";
import { Form } from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import { OrderApiError } from "@/hooks/useOrders";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import {
  NONE,
  saleFormDefaults,
  saleFormSchema,
  saleFormToBody,
  type SaleFormValues,
} from "@/utils/orders/form";
import type { Sale } from "@/utils/orders/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

const FORM_ID = "sale-form";

const LABELS = {
  title: { label: "Nom de la vente", id: "sale-title" },
  order_deadline: { label: "Date limite des commandes", id: "sale-deadline" },
  delivery_date: { label: "Jour de livraison", id: "sale-delivery" },
  copy_from: { label: "Partir du catalogue de", id: "sale-copy-from" },
};

export type SaleOption = { id: string; title: string; archived?: boolean };

export interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The sale being edited; none for a creation. */
  sale?: Sale | null;
  /** For a creation: the sales whose catalogue can be copied, newest first. */
  sales?: readonly SaleOption[];
  /** Saves; throws when it fails. */
  onSubmit: (body: ReturnType<typeof saleFormToBody>) => Promise<void>;
  isPending: boolean;
}

/**
 * « Nouvelle vente » / « Modifier la vente »: the name, the two dates and,
 * for a new sale, the sale whose catalogue to start from (the latest one by
 * default, so prices are only corrected, never retyped).
 */
export function SaleDialog({
  open,
  onOpenChange,
  sale,
  sales = [],
  onSubmit,
  isPending,
}: SaleDialogProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const latest = sales[0]?.id ?? null;

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: saleFormDefaults(sale ?? null, sale ? null : latest),
    shouldFocusError: false,
  });

  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(saleFormDefaults(sale ?? null, sale ? null : latest));
    // Reset on open and when the subject changes, not when the list refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sale?.id, form]);

  const copyOptions = useMemo(
    () => [
      { value: NONE, label: "Aucun : catalogue vide" },
      ...sales.map((s) => ({
        value: s.id,
        label: s.archived ? `${s.title} (archivée)` : s.title,
      })),
    ],
    [sales],
  );

  const submit = async (values: SaleFormValues) => {
    setSaveError(null);
    try {
      await onSubmit(saleFormToBody(values));
      onOpenChange(false);
    } catch (error) {
      if (error instanceof OrderApiError && error.field) {
        const field = error.field as keyof SaleFormValues;
        if (field in LABELS) {
          form.setError(field, { message: error.message });
          return;
        }
      }
      setSaveError(saveErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={sale ? "Modifier la vente" : "Nouvelle vente"}
      description={
        sale
          ? "Le nom et les dates s'affichent en tête de la vente et dans l'application."
          : "La vente démarre avec une copie du catalogue choisi : vous corrigez ensuite les prix et les produits dans « Catalogue »."
      }
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={isPending}
      submitLabel={sale ? "Enregistrer" : "Créer la vente"}
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
            name="title"
            id={LABELS.title.id}
            label={LABELS.title.label}
            required
            placeholder="Fromages et saucissons · novembre 2026"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <DateField
              control={form.control}
              name="order_deadline"
              id={LABELS.order_deadline.id}
              label={LABELS.order_deadline.label}
              hint="Le dernier jour pour prendre des commandes."
            />
            <DateField
              control={form.control}
              name="delivery_date"
              id={LABELS.delivery_date.id}
              label={LABELS.delivery_date.label}
              hint="Les coordonnées des acheteurs sont effacées 30 jours après."
            />
          </div>
          {!sale && (
            <SelectField
              control={form.control}
              name="copy_from"
              id={LABELS.copy_from.id}
              label={LABELS.copy_from.label}
              required={false}
              options={copyOptions}
              hint="Les produits et leurs prix sont copiés ; les commandes ne le sont pas."
            />
          )}
        </form>
      </Form>
    </FormDialog>
  );
}
