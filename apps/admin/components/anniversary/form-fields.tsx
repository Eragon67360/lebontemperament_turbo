"use client";

import {
  assetHint,
  AssetUploader,
  type AssetKind,
} from "@/components/anniversary/AssetUploader";
import { IconPicker } from "@/components/anniversary/IconPicker";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label, OptionalMark, RequiredMark } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { IconName } from "@/types/anniversary";
import * as React from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

type Common<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  /** The element id, also the target of the error summary's link. */
  id: string;
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
};

function Mark({ required }: { required?: boolean }) {
  return required ? <RequiredMark /> : <OptionalMark />;
}

export function TextField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  required,
  hint,
  placeholder,
  disabled,
  type = "text",
  inputMode,
  maxLength,
}: Common<T> & {
  type?: "text" | "url";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={id}>
            {label}
            <Mark required={required} />
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              id={id}
              type={type}
              inputMode={inputMode}
              maxLength={maxLength}
              placeholder={placeholder}
              disabled={disabled}
              aria-required={required || undefined}
              value={field.value ?? ""}
            />
          </FormControl>
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** A year typed as text (`inputMode="numeric"`); the schema turns it into a number. */
export function YearField<T extends FieldValues>(
  props: Omit<Common<T>, "placeholder"> & { placeholder?: string },
) {
  return (
    <TextField
      {...props}
      inputMode="numeric"
      maxLength={4}
      placeholder={props.placeholder ?? "1998"}
    />
  );
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  required,
  hint,
  placeholder,
  disabled,
  rows = 3,
}: Common<T> & { rows?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={id}>
            {label}
            <Mark required={required} />
          </FormLabel>
          <FormControl>
            <Textarea
              {...field}
              id={id}
              rows={rows}
              placeholder={placeholder}
              disabled={disabled}
              aria-required={required || undefined}
              value={field.value ?? ""}
              className="min-h-0"
            />
          </FormControl>
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  required = true,
  hint,
  placeholder = "Choisir…",
  disabled,
  options,
}: Common<T> & { options: readonly { value: string; label: string }[] }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={id}>
            {label}
            <Mark required={required} />
          </FormLabel>
          <Select
            name={field.name}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger
                id={id}
                ref={field.ref}
                aria-required={required || undefined}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** A labelled switch in a bordered row: « Visible sur le site ». */
export function SwitchField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  hint,
  disabled,
}: Omit<Common<T>, "required" | "placeholder">) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="border-border flex items-center justify-between gap-4 space-y-0 rounded-md border p-4">
          <div className="min-w-0 space-y-0.5">
            <FormLabel htmlFor={id}>{label}</FormLabel>
            {hint && <FormDescription>{hint}</FormDescription>}
          </div>
          <FormControl>
            <Switch
              id={id}
              ref={field.ref}
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export function IconField<T extends FieldValues>({
  control,
  name,
  id,
  label = "Icône",
  disabled,
}: Omit<Common<T>, "required" | "placeholder" | "hint" | "label"> & {
  label?: string;
}) {
  const labelId = `${id}-label`;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <Label id={labelId} asChild>
            <span>
              {label}
              <RequiredMark />
            </span>
          </Label>
          <IconPickerControl
            id={id}
            labelId={labelId}
            value={field.value as IconName | ""}
            onChange={field.onChange}
            disabled={disabled}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function IconPickerControl({
  id,
  labelId,
  value,
  onChange,
  disabled,
}: {
  id: string;
  labelId: string;
  value: IconName | "";
  onChange: (icon: IconName) => void;
  disabled?: boolean;
}) {
  const { error, formMessageId } = useFormField();
  return (
    <IconPicker
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      aria-labelledby={labelId}
      aria-describedby={error ? formMessageId : undefined}
      aria-invalid={!!error}
    />
  );
}

/** An image, audio or document upload bound to the field holding its public_id. */
export function AssetField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  kind,
  folder,
  required = true,
  hint,
  disabled,
  onFile,
}: Omit<Common<T>, "placeholder"> & {
  kind: AssetKind;
  folder: string;
  /** Called with the chosen file once it is uploaded (e.g. to read its duration). */
  onFile?: (file: File) => void;
}) {
  const labelId = `${id}-label`;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <Label id={labelId} htmlFor={`${id}-input`}>
            {label}
            <Mark required={required} />
          </Label>
          <AssetUploaderControl
            id={id}
            labelId={labelId}
            kind={kind}
            folder={folder}
            value={(field.value as string) ?? ""}
            onChange={(publicId, file) => {
              field.onChange(publicId);
              onFile?.(file);
            }}
            onRemove={() => field.onChange("")}
            disabled={disabled}
          />
          <FormDescription>{hint ?? assetHint(kind)}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function AssetUploaderControl({
  labelId,
  ...props
}: {
  id: string;
  labelId: string;
  kind: AssetKind;
  folder: string;
  value: string;
  onChange: (publicId: string, file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const { error, formDescriptionId, formMessageId } = useFormField();
  return (
    <AssetUploader
      {...props}
      aria-labelledby={labelId}
      aria-describedby={
        error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId
      }
      aria-invalid={!!error}
    />
  );
}
