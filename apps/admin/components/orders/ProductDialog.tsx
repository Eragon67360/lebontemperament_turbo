"use client";

import { SwitchField, TextField } from "@/components/anniversary/form-fields";
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
  productFormDefaults,
  productFormSchema,
  productFormToBody,
  type ProductFormValues,
} from "@/utils/orders/form";
import type { SaleProduct } from "@/utils/orders/types";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ProductInput } from "@repo/domain/utils/orders";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const FORM_ID = "product-form";

const LABELS = {
  category: { label: "Catégorie", id: "product-category" },
  name: { label: "Nom du produit", id: "product-name" },
  variant: { label: "Précision", id: "product-variant" },
  supplier: { label: "Fournisseur", id: "product-supplier" },
  price: { label: "Prix", id: "product-price" },
  is_available: { label: "Disponible", id: "product-available" },
};

/** The server's field names, back to the form's. */
const FIELD_OF: Record<string, keyof ProductFormValues> = {
  category: "category",
  name: "name",
  variant: "variant",
  supplier: "supplier",
  unit_price_cents: "price",
  is_available: "is_available",
};

export interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The product being edited; none for a creation. */
  product?: SaleProduct | null;
  /** The category a new product starts in (the list it was added from). */
  category?: string;
  /** Existing categories and suppliers, offered as you type. */
  categories: readonly string[];
  suppliers: readonly string[];
  onSubmit: (body: ProductInput) => Promise<void>;
  isPending: boolean;
}

/**
 * « Ajouter un produit » / « Modifier « … » » in the catalogue: category,
 * name and precision (weight, flavour), supplier, price in euros and whether
 * new orders may pick it.
 */
export function ProductDialog({
  open,
  onOpenChange,
  product,
  category,
  categories,
  suppliers,
  onSubmit,
  isPending,
}: ProductDialogProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: productFormDefaults(product ?? null, category),
    shouldFocusError: false,
  });

  useResetOnChange([open], () => setSaveError(null));
  useEffect(() => {
    if (open) form.reset(productFormDefaults(product ?? null, category));
    // Reset on open and when the subject changes, not when the list refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id, form]);

  const submit = async (values: ProductFormValues) => {
    setSaveError(null);
    try {
      await onSubmit(productFormToBody(values));
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
      title={product ? `Modifier « ${product.name} »` : "Ajouter un produit"}
      description={
        product
          ? "Le nouveau prix s'applique aux commandes déjà saisies comme aux suivantes."
          : "Le produit apparaît dans les nouvelles commandes dès qu'il est enregistré."
      }
      formId={FORM_ID}
      isDirty={form.formState.isDirty}
      isPending={isPending}
      submitLabel={product ? "Enregistrer" : "Ajouter"}
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
          <datalist id="product-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <datalist id="product-suppliers">
            {suppliers.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <ListedTextField
            form={form}
            name="category"
            list="product-categories"
            required
            hint="Les produits sont regroupés par catégorie : « Fromages et charcuterie », « Saucissons »."
          />
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <TextField
              control={form.control}
              name="name"
              id={LABELS.name.id}
              label={LABELS.name.label}
              required
              placeholder="Comté fruité"
            />
            <TextField
              control={form.control}
              name="variant"
              id={LABELS.variant.id}
              label={LABELS.variant.label}
              placeholder="500 g"
              hint="Poids, parfum ou taille, affiché après le nom."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <ListedTextField
              form={form}
              name="supplier"
              list="product-suppliers"
              hint="Pour les totaux à commander à chaque fournisseur."
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor={LABELS.price.id}>
                    {LABELS.price.label}
                    <RequiredMark />
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        id={LABELS.price.id}
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="11,00"
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
                  <FormDescription>À l&apos;unité.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <SwitchField
            control={form.control}
            name="is_available"
            id={LABELS.is_available.id}
            label={LABELS.is_available.label}
            hint="Décoché, le produit n'est plus proposé dans les nouvelles commandes ; celles qui l'ont déjà le gardent."
          />
        </form>
      </Form>
    </FormDialog>
  );
}

/** A text field with a `datalist` of existing values (category, supplier). */
function ListedTextField({
  form,
  name,
  list,
  required,
  hint,
}: {
  form: ReturnType<typeof useForm<ProductFormValues>>;
  name: "category" | "supplier";
  list: string;
  required?: boolean;
  hint: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={LABELS[name].id}>
            {LABELS[name].label}
            {required ? (
              <RequiredMark />
            ) : (
              <span className="text-muted-foreground ml-1.5 text-sm font-normal">
                (facultatif)
              </span>
            )}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              id={LABELS[name].id}
              list={list}
              autoComplete="off"
              aria-required={required || undefined}
            />
          </FormControl>
          <FormDescription>{hint}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
