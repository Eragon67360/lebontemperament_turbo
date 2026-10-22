"use client";

import { Button } from "@/components/ui/button";
import type { DocumentChange } from "@/hooks/useOrders";
import { fileSizeLabel } from "@repo/domain/utils/documents";
import {
  ORDER_DOCUMENT_ACCEPT,
  orderDocumentDetails,
  orderDocumentKind,
  orderDocumentMimeType,
  orderDocumentProblem,
} from "@repo/domain/utils/orderDocuments";
import {
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import { useId, useRef, useState } from "react";

const KIND_ICONS = {
  PDF: FileText,
  Photo: FileImage,
  Word: FileText,
  Excel: FileSpreadsheet,
} as const;

export type CurrentOrderDocument = {
  name: string;
  mimeType: string;
  sizeBytes: number | null;
  /** « Ouvrir »: the route that redirects to a one-minute link. */
  href: string;
};

/**
 * « Bon de commande »: the order form the buyer handed in (a scan, a photo,
 * a PDF, Word or Excel). Choosing a file only prepares the change; it is
 * sent when the order is saved (« replace »), as is « Retirer »
 * (« remove »). The current file opens through the admin's route.
 */
export function OrderDocumentField({
  current,
  change,
  onChange,
  linkedName,
}: {
  current: CurrentOrderDocument | null;
  change: DocumentChange;
  onChange: (change: DocumentChange) => void;
  /** The linked member's name: they will be able to download it. */
  linkedName: string | null;
}) {
  const inputId = useId();
  const problemId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const pick = (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    const found = orderDocumentProblem(file);
    setProblem(found);
    if (!found) onChange({ type: "replace", file });
  };

  const shown =
    change.type === "replace"
      ? {
          name: change.file.name,
          details: [
            orderDocumentKind(orderDocumentMimeType(change.file.name) ?? ""),
            fileSizeLabel(change.file.size),
          ]
            .filter(Boolean)
            .join(" · "),
          kind: orderDocumentKind(
            orderDocumentMimeType(change.file.name) ?? "",
          ),
          pending: "Sera joint à l'enregistrement",
        }
      : current && change.type === "keep"
        ? {
            name: current.name,
            details: orderDocumentDetails({
              mime_type: current.mimeType,
              size_bytes: current.sizeBytes,
            }),
            kind: orderDocumentKind(current.mimeType),
            pending: null,
          }
        : null;
  const Icon = shown ? KIND_ICONS[shown.kind] : Paperclip;

  return (
    <fieldset className="space-y-2" aria-describedby={`${inputId}-hint`}>
      <legend className="text-[17px] leading-6 font-semibold">
        Bon de commande
      </legend>
      {/* The native picker would speak English: a French button opens it. */}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ORDER_DOCUMENT_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label="Fichier du bon de commande"
        aria-invalid={Boolean(problem) || undefined}
        aria-describedby={problem ? problemId : undefined}
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {shown ? (
        <div className="border-border bg-card flex flex-wrap items-center gap-3 rounded-md border px-3.5 py-2.5">
          <Icon className="text-primary size-5 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] leading-6 font-medium break-all">
              {shown.name}
            </p>
            <p className="text-note text-muted-foreground">
              {shown.details}
              {shown.pending && ` · ${shown.pending}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {current && change.type === "keep" && (
              <Button asChild variant="ghost" size="sm">
                <a href={current.href} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden />
                  Ouvrir
                </a>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Upload aria-hidden />
              Remplacer
            </Button>
            {change.type === "replace" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange({ type: "keep" })}
              >
                <Undo2 aria-hidden />
                Annuler
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-danger-foreground"
                onClick={() => onChange({ type: "remove" })}
              >
                <Trash2 aria-hidden />
                Retirer
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip aria-hidden />
            Joindre le bon de commande
          </Button>
          {change.type === "remove" && current && (
            <span className="text-note text-muted-foreground">
              « {current.name} » sera retiré à l&apos;enregistrement ·{" "}
              <button
                type="button"
                className="text-foreground underline underline-offset-2 hover:no-underline"
                onClick={() => onChange({ type: "keep" })}
              >
                Garder
              </button>
            </span>
          )}
        </div>
      )}
      {problem && (
        <p
          id={problemId}
          role="alert"
          className="text-detail text-danger-foreground"
        >
          {problem}
        </p>
      )}
      <p id={`${inputId}-hint`} className="text-note text-muted-foreground">
        Le bon remis par l&apos;acheteur : PDF, photo, Word ou Excel, 10&nbsp;Mo
        au plus.{" "}
        {linkedName
          ? `${linkedName} pourra le télécharger depuis son espace membre.`
          : "Lié à un membre, il pourra le télécharger depuis son espace membre."}
      </p>
    </fieldset>
  );
}
