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
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/ui/label";
import { OrderApiError } from "@/hooks/useOrders";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { cn } from "@/lib/utils";
import {
  missesDeliveryAddress,
  NONE,
  orderableProducts,
  orderFormDefaults,
  orderFormSchema,
  orderFormToBody,
  type OrderFormValues,
  quantitiesTotalCents,
  readQuantity,
  stepQuantity,
} from "@/utils/orders/form";
import type { SaleOrder, SaleProduct } from "@/utils/orders/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BALANCE_LABELS,
  balanceStatus,
  formatEuros,
  formatPhone,
  FULFILMENT_LABELS,
  FULFILMENTS,
  groupProductsByCategory,
  orderPaidCents,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
  productLabel,
  QUANTITY_MAX,
} from "@repo/domain/utils/orders";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Banknote, Minus, Plus, Store, Trash2, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

const FORM_ID = "order-form";
const QUANTITIES_ID = "order-quantities";

const LABELS = {
  buyer_name: { label: "Nom de l'acheteur", id: "order-buyer-name" },
  buyer_phone: { label: "Téléphone", id: "order-buyer-phone" },
  buyer_address: { label: "Adresse", id: "order-buyer-address" },
  sold_by: { label: "Vendu par", id: "order-sold-by" },
  fulfilment: { label: "Remise", id: "order-fulfilment-delivery" },
  quantities: { label: "Produits", id: QUANTITIES_ID },
  notes: { label: "Remarque", id: "order-notes" },
};

const FIELD_OF: Record<string, keyof OrderFormValues> = {
  buyer_name: "buyer_name",
  buyer_phone: "buyer_phone",
  buyer_address: "buyer_address",
  sold_by: "sold_by",
  fulfilment: "fulfilment",
  notes: "notes",
  items: "quantities",
};

const FULFILMENT_ICONS = { delivery: Truck, pickup: Store } as const;

export type MemberOption = { id: string; name: string };

export interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The order being edited; none for a creation. */
  order?: SaleOrder | null;
  products: readonly SaleProduct[];
  /** The members who may have sold the order, in alphabetical order. */
  members: readonly MemberOption[];
  /** Saves; throws when it fails. */
  onSubmit: (body: ReturnType<typeof orderFormToBody>) => Promise<void>;
  isPending: boolean;
  /** Opens « Enregistrer un paiement » for this order (edit only). */
  onPay?: () => void;
  /** Removes a payment recorded by mistake (edit only). */
  onDeletePayment?: (paymentId: string) => void;
  deletingPaymentId?: string | null;
}

/**
 * « Ajouter une commande » / « Modifier la commande de « … » »: the buyer,
 * how the order is handed over, the quantities by category with steppers
 * and a live total, a note; beside it the breakdown and, for an existing
 * order, its payments.
 */
export function OrderDialog({
  open,
  onOpenChange,
  order,
  products,
  members,
  onSubmit,
  isPending,
  onPay,
  onDeletePayment,
  deletingPaymentId,
}: OrderDialogProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: orderFormDefaults(order ?? null, products),
    shouldFocusError: false,
  });

  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(orderFormDefaults(order ?? null, products));
    // Reset when the dialog opens or changes subject, not when a payment
    // refreshes the order while the admin is typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order?.id, form]);

  const listed = useMemo(
    () => orderableProducts(products, order ?? null),
    [products, order],
  );
  const groups = useMemo(() => groupProductsByCategory(listed), [listed]);
  const quantities = useWatch({ control: form.control, name: "quantities" });
  const fulfilment = useWatch({ control: form.control, name: "fulfilment" });
  const address = useWatch({ control: form.control, name: "buyer_address" });
  const totalCents = quantitiesTotalCents(quantities ?? {}, listed);

  const memberOptions = useMemo(
    () => [
      { value: NONE, label: "Personne en particulier" },
      ...members.map((m) => ({ value: m.id, label: m.name })),
    ],
    [members],
  );

  const setQuantity = (productId: string, value: number) => {
    form.setValue(`quantities.${productId}`, value, {
      shouldDirty: true,
      shouldValidate: form.formState.submitCount > 0,
    });
  };

  const submit = async (values: OrderFormValues) => {
    setSaveError(null);
    try {
      await onSubmit(orderFormToBody(values));
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

  const lines = listed
    .filter((p) => (quantities?.[p.id] ?? 0) > 0)
    .map((p) => ({
      id: p.id,
      label: productLabel(p),
      quantity: quantities?.[p.id] ?? 0,
      unit: p.unit_price_cents,
      amount: (quantities?.[p.id] ?? 0) * p.unit_price_cents,
    }));
  const paidCents = order ? orderPaidCents(order.payments) : 0;
  const dueCents = totalCents - paidCents;
  const warnAddress = missesDeliveryAddress({
    fulfilment: fulfilment ?? "delivery",
    buyer_address: address ?? "",
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        order
          ? `Modifier la commande de « ${order.buyer_name} »`
          : "Ajouter une commande"
      }
      description={
        order
          ? "Les quantités et les coordonnées remplacent celles enregistrées ; les paiements restent."
          : "Une commande par acheteur : ses coordonnées, puis les quantités de la feuille de commande."
      }
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={isPending}
      submitLabel={order ? "Enregistrer" : "Ajouter la commande"}
      className="lg:max-w-[1040px]"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <Form {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(submit)}
            noValidate
            className="min-w-0 space-y-6"
          >
            <FormFeedback
              errors={form.formState.errors}
              labels={LABELS}
              submitCount={form.formState.submitCount}
              saveError={saveError}
            />

            <fieldset className="space-y-4">
              <legend className="text-[17px] leading-6 font-semibold">
                L&apos;acheteur
              </legend>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
                <TextField
                  control={form.control}
                  name="buyer_name"
                  id={LABELS.buyer_name.id}
                  label={LABELS.buyer_name.label}
                  required
                  placeholder="Prénom NOM"
                />
                <TextField
                  control={form.control}
                  name="buyer_phone"
                  id={LABELS.buyer_phone.id}
                  label={LABELS.buyer_phone.label}
                  inputMode="tel"
                  format={formatPhone}
                  placeholder="06 12 34 56 78"
                  hint="Pour le SMS de livraison."
                />
              </div>
              <TextareaField
                control={form.control}
                name="buyer_address"
                id={LABELS.buyer_address.id}
                label={LABELS.buyer_address.label}
                rows={2}
                placeholder="N°, rue, code postal et ville"
                hint={
                  fulfilment === "pickup"
                    ? "Facultative pour un retrait."
                    : "Celle où la commande est livrée : elle sert à la tournée."
                }
              />
              {warnAddress && (
                <Callout tone="warning" title="Sans adresse, pas de tournée">
                  La commande est enregistrée, mais sans adresse elle ne pourra
                  pas être ajoutée à la tournée.
                </Callout>
              )}
              <SelectField
                control={form.control}
                name="sold_by"
                id={LABELS.sold_by.id}
                label={LABELS.sold_by.label}
                required={false}
                options={memberOptions}
                hint="Le membre qui a pris la commande."
              />
            </fieldset>

            <FormField
              control={form.control}
              name="fulfilment"
              render={({ field }) => (
                <FormItem>
                  <fieldset className="space-y-2">
                    <legend className="text-[17px] leading-6 font-semibold">
                      Remise
                      <RequiredMark />
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {FULFILMENTS.map((value) => {
                        const Icon = FULFILMENT_ICONS[value];
                        const id = `order-fulfilment-${value}`;
                        return (
                          <label
                            key={value}
                            htmlFor={id}
                            className="border-input has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:outline-ring flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border px-3.5 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
                          >
                            <input
                              id={id}
                              type="radio"
                              name={field.name}
                              value={value}
                              checked={field.value === value}
                              onChange={() => field.onChange(value)}
                              onBlur={field.onBlur}
                              className="accent-primary size-4 shrink-0"
                            />
                            <Icon
                              className="text-primary size-4 shrink-0"
                              aria-hidden
                            />
                            <span className="min-w-0">
                              <span className="block text-[15px] leading-6 font-medium">
                                {FULFILMENT_LABELS[value]}
                              </span>
                              <span className="text-note text-muted-foreground block">
                                {value === "delivery"
                                  ? "Livrée lors de la tournée"
                                  : "L'acheteur vient la chercher"}
                              </span>
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

            <FormField
              control={form.control}
              name="quantities"
              render={() => (
                <FormItem>
                  <fieldset
                    id={QUANTITIES_ID}
                    tabIndex={-1}
                    className="space-y-4 rounded-md outline-none"
                  >
                    <legend className="text-[17px] leading-6 font-semibold">
                      Produits
                      <RequiredMark />
                    </legend>
                    {groups.length === 0 && (
                      <p className="text-detail text-muted-foreground">
                        Le catalogue de cette vente est vide : ajoutez des
                        produits dans « Catalogue ».
                      </p>
                    )}
                    {groups.map((group) => (
                      <div key={group.category} className="space-y-1">
                        <h3 className="text-note text-muted-foreground font-semibold tracking-wide uppercase">
                          {group.category}
                        </h3>
                        <ul className="divide-border border-border divide-y rounded-md border">
                          {group.products.map((product) => (
                            <li
                              key={product.id}
                              className="flex items-center justify-between gap-3 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="text-[15px] leading-6 font-medium break-words">
                                  {productLabel(product)}
                                </p>
                                <p className="text-note text-muted-foreground">
                                  {formatEuros(product.unit_price_cents)}
                                  {!product.is_available && " · plus proposé"}
                                </p>
                              </div>
                              <QuantityStepper
                                id={`order-qty-${product.id}`}
                                label={productLabel(product)}
                                value={quantities?.[product.id] ?? 0}
                                onChange={(n) => setQuantity(product.id, n)}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <p
                      className="flex items-baseline justify-between gap-3 text-[15px] leading-6"
                      aria-live="polite"
                    >
                      <span className="font-medium">Total de la commande</span>
                      <span className="text-section tabular-nums">
                        {formatEuros(totalCents)}
                      </span>
                    </p>
                  </fieldset>
                  <FormMessage />
                </FormItem>
              )}
            />

            <TextareaField
              control={form.control}
              name="notes"
              id={LABELS.notes.id}
              label={LABELS.notes.label}
              rows={2}
              placeholder="Code de la porte, horaires, demande particulière…"
            />
          </form>
        </Form>

        <aside
          className="border-border bg-card space-y-5 rounded-lg border p-4 lg:sticky lg:top-0"
          aria-labelledby="order-summary-heading"
        >
          <div>
            <h2
              id="order-summary-heading"
              className="text-[17px] leading-6 font-semibold"
            >
              Récapitulatif
            </h2>
            <p className="text-note text-muted-foreground mt-0.5">
              Se met à jour pendant la saisie.
            </p>
          </div>
          {lines.length === 0 ? (
            <p className="text-detail text-muted-foreground">
              Aucun produit pour le moment.
            </p>
          ) : (
            <ul className="divide-border divide-y text-[15px] leading-6">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="flex items-start justify-between gap-3 py-1.5"
                >
                  <span className="min-w-0">
                    <span className="block break-words">{line.label}</span>
                    <span className="text-note text-muted-foreground block">
                      {line.quantity} × {formatEuros(line.unit)}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatEuros(line.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <dl className="space-y-1 text-[15px] leading-6">
            <div className="flex justify-between gap-3">
              <dt className="font-medium">Total</dt>
              <dd className="font-semibold tabular-nums">
                {formatEuros(totalCents)}
              </dd>
            </div>
            {order && (
              <>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Payé</dt>
                  <dd className="tabular-nums">{formatEuros(paidCents)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">
                    {dueCents < 0 ? "Trop perçu" : "Reste à payer"}
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {formatEuros(Math.abs(dueCents))}
                  </dd>
                </div>
              </>
            )}
          </dl>

          {order ? (
            <section
              aria-labelledby="order-payments-heading"
              className="space-y-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3
                  id="order-payments-heading"
                  className="text-[15px] leading-6 font-semibold"
                >
                  Paiements
                </h3>
                <span className="text-note text-muted-foreground">
                  {BALANCE_LABELS[balanceStatus(totalCents, paidCents)]}
                </span>
              </div>
              {order.payments.length === 0 ? (
                <p className="text-detail text-muted-foreground">
                  Aucun paiement enregistré.
                </p>
              ) : (
                <ul className="divide-border divide-y">
                  {order.payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex items-center justify-between gap-2 py-1.5"
                    >
                      <span className="min-w-0 text-[15px] leading-6">
                        <span className="font-medium tabular-nums">
                          {formatEuros(payment.amount_cents)}
                        </span>
                        <span className="text-note text-muted-foreground block truncate">
                          {PAYMENT_METHOD_LABELS[
                            payment.method as PaymentMethod
                          ] ?? payment.method}
                          {" · "}
                          {format(parseISO(payment.paid_on), "d MMM yyyy", {
                            locale: fr,
                          })}
                          {payment.note && ` · ${payment.note}`}
                        </span>
                      </span>
                      {onDeletePayment && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-danger-foreground shrink-0"
                          onClick={() => onDeletePayment(payment.id)}
                          disabled={deletingPaymentId === payment.id}
                        >
                          <Trash2 aria-hidden />
                          <span className="sr-only">
                            Supprimer le paiement de{" "}
                            {formatEuros(payment.amount_cents)}
                          </span>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {onPay && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onPay}
                >
                  <Banknote aria-hidden />
                  Enregistrer un paiement
                </Button>
              )}
            </section>
          ) : (
            <p className="text-note text-muted-foreground">
              Les paiements se saisissent une fois la commande enregistrée.
            </p>
          )}
        </aside>
      </div>
    </FormDialog>
  );
}

/** « − » quantity « + » : 44 px buttons, the number also typed. */
export function QuantityStepper({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="outline"
        className="size-11 p-0"
        onClick={() => onChange(stepQuantity(value, -1))}
        disabled={value <= 0}
      >
        <Minus aria-hidden />
        <span className="sr-only">Un de moins : {label}</span>
      </Button>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label={`Quantité : ${label}`}
        value={String(value)}
        onChange={(event) => onChange(readQuantity(event.target.value))}
        onFocus={(event) => event.target.select()}
        className={cn(
          "h-11 w-14 px-1 text-center tabular-nums",
          value > 0 && "border-primary bg-primary-soft font-semibold",
        )}
      />
      <Button
        type="button"
        variant="outline"
        className="size-11 p-0"
        onClick={() => onChange(stepQuantity(value, 1))}
        disabled={value >= QUANTITY_MAX}
      >
        <Plus aria-hidden />
        <span className="sr-only">Un de plus : {label}</span>
      </Button>
    </div>
  );
}
