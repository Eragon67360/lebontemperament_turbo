"use client";

import { DateField, TextareaField } from "@/components/anniversary/form-fields";
import {
  FormFeedback,
  saveErrorMessage,
} from "@/components/anniversary/FormFeedback";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/ui/label";
import { OrderApiError } from "@/hooks/useOrders";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import {
  paymentFormDefaults,
  paymentFormSchema,
  paymentFormToBody,
  type PaymentFormValues,
} from "@/utils/orders/form";
import type { PaymentBody } from "@/utils/orders/types";
import { todayParisIso } from "@/utils/orders/view";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  formatEuros,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
} from "@repo/domain/utils/orders";
import { Banknote, Landmark, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const FORM_ID = "payment-form";

const LABELS = {
  amount: { label: "Montant reçu", id: "payment-amount" },
  method: { label: "Moyen de paiement", id: "payment-method-transfer" },
  paid_on: { label: "Date du paiement", id: "payment-date" },
  note: { label: "Remarque", id: "payment-note" },
};

const FIELD_OF: Record<string, keyof PaymentFormValues> = {
  amount_cents: "amount",
  method: "method",
  paid_on: "paid_on",
  note: "note",
};

const METHOD_ICONS = {
  transfer: Landmark,
  cash: Banknote,
  cheque: ScrollText,
} as const;

export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Whose payment: « Enregistrer un paiement de « Léa TEST » ». */
  buyerName: string;
  /** What is left to pay, prefilled when positive. */
  dueCents: number;
  onSubmit: (body: PaymentBody) => Promise<void>;
  isPending: boolean;
}

/**
 * « Enregistrer un paiement »: the amount (what is left, by default), the
 * method as three cards, the day (today in Paris) and a note. A negative
 * amount records a refund.
 */
export function PaymentDialog({
  open,
  onOpenChange,
  buyerName,
  dueCents,
  onSubmit,
  isPending,
}: PaymentDialogProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: paymentFormDefaults(dueCents, todayParisIso()),
    shouldFocusError: false,
  });

  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(paymentFormDefaults(dueCents, todayParisIso()));
    // Only when it opens: a refresh of the order mustn't wipe what is typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form]);

  const submit = async (values: PaymentFormValues) => {
    setSaveError(null);
    try {
      await onSubmit(paymentFormToBody(values));
      onOpenChange(false);
    } catch (error) {
      const field =
        error instanceof OrderApiError && error.field
          ? FIELD_OF[error.field]
          : undefined;
      if (field) {
        form.setError(field, { message: saveErrorMessage(error) });
        return;
      }
      setSaveError(saveErrorMessage(error));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Enregistrer un paiement de « ${buyerName} »`}
      description={
        dueCents > 0
          ? `Reste à payer : ${formatEuros(dueCents)}. Un paiement partiel laisse le reste à payer visible.`
          : dueCents < 0
            ? `Trop perçu : ${formatEuros(-dueCents)}. Saisissez un montant négatif pour un remboursement.`
            : "Cette commande est payée. Un montant négatif enregistre un remboursement."
      }
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={isPending}
      submitLabel="Enregistrer le paiement"
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
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor={LABELS.amount.id}>
                    {LABELS.amount.label}
                    <RequiredMark />
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        id={LABELS.amount.id}
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="8,50"
                        className="pr-9"
                        aria-required
                      />
                    </FormControl>
                    <span
                      aria-hidden
                      className="text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2"
                    >
                      €
                    </span>
                  </div>
                  <FormDescription>Par exemple 8,50 ou 12.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DateField
              control={form.control}
              name="paid_on"
              id={LABELS.paid_on.id}
              label={LABELS.paid_on.label}
              required
            />
          </div>

          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <fieldset className="space-y-2">
                  <legend className="text-[15px] leading-[22px] font-medium">
                    {LABELS.method.label}
                    <RequiredMark />
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = METHOD_ICONS[method];
                      const id = `payment-method-${method}`;
                      return (
                        <label
                          key={method}
                          htmlFor={id}
                          className="border-input has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:outline-ring flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border px-3.5 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
                        >
                          <input
                            id={id}
                            type="radio"
                            name={field.name}
                            value={method}
                            checked={field.value === method}
                            onChange={() => field.onChange(method)}
                            onBlur={field.onBlur}
                            className="accent-primary size-4 shrink-0"
                          />
                          <Icon
                            className="text-primary size-4 shrink-0"
                            aria-hidden
                          />
                          <span className="text-[15px] leading-6 font-medium">
                            {PAYMENT_METHOD_LABELS[method]}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <FormMessage />
              </FormItem>
            )}
          />

          <TextareaField
            control={form.control}
            name="note"
            id={LABELS.note.id}
            label={LABELS.note.label}
            rows={2}
            placeholder="Numéro de chèque, acompte…"
          />
        </form>
      </Form>
    </FormDialog>
  );
}
