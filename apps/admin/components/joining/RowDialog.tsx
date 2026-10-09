"use client";

import {
  ErrorSummary,
  type ErrorSummaryItem,
} from "@/components/ui/error-summary";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label, OptionalMark, RequiredMark } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export type RowField<K extends string> = {
  key: K;
  label: string;
  max: number;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
  help?: string;
};

export type RowValues<K extends string> = Record<K, string>;

/**
 * A short text form in a dialog (« Rejoindre et FAQ »: a rehearsal time, a
 * question): one input per field, required and length checks, plus the
 * caller's own `validate`. `onSubmit` gets trimmed values; when it throws,
 * the dialog stays open with what was typed.
 */
export function RowDialog<K extends string>({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  title,
  description,
  submitLabel,
  fields,
  initial,
  validate,
  formId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RowValues<K>) => Promise<void>;
  isPending: boolean;
  title: string;
  description: string;
  submitLabel: string;
  fields: RowField<K>[];
  initial: RowValues<K>;
  validate?: (values: RowValues<K>) => Partial<Record<K, string>>;
  formId: string;
}) {
  const [values, setValues] = useState<RowValues<K>>(initial);
  const [errors, setErrors] = useState<Partial<Record<K, string>>>({});
  const [openedWith, setOpenedWith] = useState<RowValues<K> | null>(null);

  // Each opening starts from `initial`.
  const current = open ? initial : null;
  if (current !== openedWith) {
    setOpenedWith(current);
    if (current) {
      setValues(current);
      setErrors({});
    }
  }

  const id = (key: K) => `${formId}-${key}`;
  const isDirty = fields.some((f) => values[f.key] !== initial[f.key]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = Object.fromEntries(
      fields.map((f) => [f.key, values[f.key].trim()]),
    ) as RowValues<K>;
    const next: Partial<Record<K, string>> = {};
    for (const f of fields) {
      if (f.required && !trimmed[f.key]) next[f.key] = "À remplir.";
      else if (trimmed[f.key].length > f.max)
        next[f.key] = `${f.max} caractères au plus.`;
    }
    Object.assign(next, validate?.(trimmed) ?? {});
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    try {
      await onSubmit(trimmed);
      onOpenChange(false);
    } catch {
      // The page has said what failed; the form keeps what was typed.
    }
  };

  const summary: ErrorSummaryItem[] = fields
    .filter((f) => errors[f.key])
    .map((f) => ({
      fieldId: id(f.key),
      label: f.label,
      message: errors[f.key] ?? "",
    }));

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      formId={formId}
      isDirty={isDirty}
      isPending={isPending}
      submitLabel={submitLabel}
    >
      <form
        id={formId}
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-5"
      >
        <ErrorSummary errors={summary} />
        {fields.map((f) => {
          const error = errors[f.key];
          const props = {
            id: id(f.key),
            value: values[f.key],
            maxLength: f.max,
            placeholder: f.placeholder,
            "aria-invalid": Boolean(error) || undefined,
            "aria-describedby": error ? `${id(f.key)}-error` : undefined,
          };
          return (
            <div key={f.key} className="grid gap-2">
              <Label htmlFor={id(f.key)}>
                {f.label}
                {f.required ? <RequiredMark /> : <OptionalMark />}
              </Label>
              {f.multiline ? (
                <Textarea
                  {...props}
                  rows={5}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.key]: e.target.value }))
                  }
                />
              ) : (
                <Input
                  {...props}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.key]: e.target.value }))
                  }
                />
              )}
              {f.help && (
                <p className="text-note text-muted-foreground">{f.help}</p>
              )}
              {error && (
                <p
                  id={`${id(f.key)}-error`}
                  className="text-detail text-danger-foreground font-medium"
                >
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </form>
    </FormDialog>
  );
}
