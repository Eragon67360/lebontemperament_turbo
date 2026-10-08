"use client";

import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  ErrorSummary,
  type ErrorSummaryItem,
} from "@/components/ui/error-summary";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label, OptionalMark, RequiredMark } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

export type CAFormValues = {
  title: string;
  date: Date;
  file: File | null;
};

const FORM_ID = "ca-form";
const TITLE_ID = "ca-title";
const DATE_ID = "ca-date";

type FieldErrors = { title?: string; date?: string };

/**
 * « Ajouter un compte rendu »: title, meeting day and the PDF, in a
 * `FormDialog`. `onSubmit` uploads and saves; when it throws, the dialog
 * stays open with what was typed.
 */
export function CADialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CAFormValues) => Promise<void>;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>();
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleOpenChange = (next: boolean) => {
    // Closing (saved or abandoned) leaves an empty form for next time.
    if (!next) {
      setTitle("");
      setDate(undefined);
      setFile(null);
      setErrors({});
    }
    onOpenChange(next);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!title.trim()) nextErrors.title = "Donnez un titre au compte rendu.";
    if (!date) nextErrors.date = "Choisissez la date de la réunion.";
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.date || !date) return;

    try {
      await onSubmit({ title, date, file });
      handleOpenChange(false);
    } catch {
      // The page has said what failed; the form keeps what was typed.
    }
  };

  const summary: ErrorSummaryItem[] = [];
  if (errors.title)
    summary.push({ fieldId: TITLE_ID, label: "Titre", message: errors.title });
  if (errors.date)
    summary.push({
      fieldId: DATE_ID,
      label: "Date de la réunion",
      message: errors.date,
    });

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Nouveau compte rendu"
      description="Ajoutez le compte rendu d'une réunion du conseil d'administration."
      formId={FORM_ID}
      isDirty={title !== "" || date !== undefined || file !== null}
      isPending={isPending}
      submitLabel="Ajouter le compte rendu"
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        noValidate
        className="grid gap-5"
      >
        <ErrorSummary errors={summary} />

        <div className="grid gap-2">
          <Label htmlFor={TITLE_ID}>
            Titre
            <RequiredMark />
          </Label>
          <Input
            id={TITLE_ID}
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Par exemple : Réunion du 25 mai 2025"
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
          <Label htmlFor={DATE_ID}>
            Date de la réunion
            <RequiredMark />
          </Label>
          <Popover modal>
            <PopoverTrigger asChild>
              <Button
                id={DATE_ID}
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground",
                )}
                aria-invalid={Boolean(errors.date) || undefined}
                aria-describedby={errors.date ? `${DATE_ID}-error` : undefined}
              >
                <CalendarIcon aria-hidden />
                {date
                  ? format(date, "PPP", { locale: fr })
                  : "Choisir une date…"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                autoFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
          {errors.date && (
            <p
              id={`${DATE_ID}-error`}
              className="text-detail text-danger-foreground font-medium"
            >
              {errors.date}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label>
            Fichier PDF
            <OptionalMark />
          </Label>
          <FileUpload
            onFileSelect={(selected) => setFile(selected)}
            onFileClear={() => setFile(null)}
            value={file}
            currentImageUrl={null}
            mode="pdf"
          />
        </div>
      </form>
    </FormDialog>
  );
}
