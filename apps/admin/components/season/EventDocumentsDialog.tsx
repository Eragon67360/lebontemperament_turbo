"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import {
  refetchEventDocuments,
  useCreateEventDocument,
  useDeleteEventDocument,
  useRenameEventDocument,
} from "@/hooks/useEventDocuments";
import { EVENT_DOCUMENTS_BUCKET } from "@/utils/events/bucket";
import {
  eventFileProblem,
  uploadEventFile,
  type UploadedEventFile,
} from "@/utils/events/upload";
import { settleFailedSave, UNSETTLED_SAVE_HINT } from "@/utils/failedSave";
import { createClient } from "@/utils/supabase/client";
import type { Event, EventDocument } from "@repo/domain/types/events";
import { fileSizeLabel } from "@repo/domain/utils/documents";
import {
  EVENT_DOCUMENT_ACCEPT,
  EVENT_DOCUMENT_LABEL_MAX,
  eventDocumentDefaultLabel,
  eventDocumentKind,
  eventDocumentUrl,
} from "@repo/domain/utils/eventDocuments";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Loader2,
  Paperclip,
  Pencil,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const KIND_ICONS = {
  PDF: FileText,
  Word: FileText,
  Excel: FileSpreadsheet,
} as const;

/** « PDF · 120 ko ». */
export function eventDocumentMeta(document: EventDocument): string {
  const size = fileSizeLabel(document.size_bytes);
  const kind = eventDocumentKind(document.mime_type);
  return size ? `${kind} · ${size}` : kind;
}

function fileUrl(document: EventDocument): string {
  return eventDocumentUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", document);
}

function attachFailure(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Le fichier n'a pas pu être joint.";
}

/** One attached file: open it, rename it, remove it. */
function DocumentItem({
  document,
  onRemove,
}: {
  document: EventDocument;
  onRemove: () => void;
}) {
  const rename = useRenameEventDocument();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(document.label);
  const Icon = KIND_ICONS[eventDocumentKind(document.mime_type)];
  const inputId = `event-document-label-${document.id}`;

  const save = async () => {
    const next = label.trim();
    if (!next || next === document.label) {
      setLabel(document.label);
      setEditing(false);
      return;
    }
    try {
      await rename.mutateAsync({ id: document.id, label: next });
      toast.success(`Renommé en « ${next} »`);
      setEditing(false);
    } catch (error) {
      toast.error("Le nom n'a pas pu être changé", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <li className="flex items-start gap-3 rounded-lg border p-3">
      <Icon
        className="text-muted-foreground mt-0.5 size-5 shrink-0"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        {editing ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <Label htmlFor={inputId} className="sr-only">
              Nom affiché
            </Label>
            <Input
              id={inputId}
              value={label}
              maxLength={EVENT_DOCUMENT_LABEL_MAX}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              variant="outline"
              disabled={rename.isPending}
              aria-label="Enregistrer le nom"
            >
              {rename.isPending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Check aria-hidden />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => {
                setLabel(document.label);
                setEditing(false);
              }}
              aria-label="Annuler"
            >
              <X aria-hidden />
            </Button>
          </form>
        ) : (
          <>
            <p className="text-body font-medium break-words">
              {document.label}
            </p>
            <p className="text-note text-muted-foreground break-all">
              {eventDocumentMeta(document)} · {document.file_name}
            </p>
          </>
        )}
        {!editing && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={fileUrl(document)} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden />
                Ouvrir
                <span className="sr-only">
                  {" "}
                  « {document.label} » (nouvel onglet)
                </span>
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil aria-hidden />
              Renommer
              <span className="sr-only"> « {document.label} »</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-danger-foreground"
              onClick={onRemove}
            >
              <Trash2 aria-hidden />
              Retirer
              <span className="sr-only"> « {document.label} »</span>
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * « Documents de « Vente de fromages » »: the files members download from
 * the event (bulletin de réservation, programme…), and the form to attach
 * one. Each change is saved at once; the website and the app show it at
 * their next refresh.
 */
export function EventDocumentsDialog({
  open,
  onOpenChange,
  event,
  documents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  documents: EventDocument[];
}) {
  const queryClient = useQueryClient();
  const create = useCreateEventDocument();
  const remove = useDeleteEventDocument();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState<EventDocument | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const reset = () => {
    setFile(null);
    setLabel("");
    setProblem(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const pick = (selected: File | undefined) => {
    if (!selected) return;
    const why = eventFileProblem(selected);
    setProblem(why ? `${selected.name} : ${why}` : null);
    setFile(why ? null : selected);
    if (!why && label.trim() === "") {
      setLabel(eventDocumentDefaultLabel(selected.name));
    }
  };

  /**
   * Saves the row for a file just uploaded: null once it is saved, else why
   * not. The request can fail after the row was saved (its answer lost on
   * the way back), so a failure is settled against the server's list before
   * the file is removed: a row that exists is a success, an upload without
   * a row is removed, and when the list can't be read the file stays.
   */
  const saveDocument = async (
    eventId: string,
    uploaded: UploadedEventFile,
    name: string,
  ): Promise<string | null> => {
    try {
      await create.mutateAsync({
        event_id: eventId,
        label: name,
        file_name: uploaded.fileName,
        storage_key: uploaded.storageKey,
        mime_type: uploaded.mimeType,
      });
      return null;
    } catch (error) {
      const outcome = await settleFailedSave({
        storageKey: uploaded.storageKey,
        readSavedKeys: async () =>
          (await refetchEventDocuments(queryClient)).map(
            (document) => document.storage_key,
          ),
        removeFile: () =>
          createClient()
            .storage.from(EVENT_DOCUMENTS_BUCKET)
            .remove([uploaded.storageKey]),
      });
      if (outcome === "saved") return null;
      const why = attachFailure(error);
      return outcome === "unknown"
        ? `${why.replace(/\.?$/, ".")} ${UNSETTLED_SAVE_HINT}`
        : why;
    }
  };

  const attach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (!file) {
      setProblem("Choisissez le fichier à joindre.");
      return;
    }
    const name = label.trim() || eventDocumentDefaultLabel(file.name);
    setUploading(true);
    try {
      const uploaded = await uploadEventFile(file, event.id);
      const why = await saveDocument(event.id, uploaded, name);
      if (why) {
        setProblem(why);
        return;
      }
      toast.success(`« ${name} » joint à « ${event.title} »`);
      reset();
    } catch (error) {
      setProblem(attachFailure(error));
    } finally {
      setUploading(false);
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      toast.success(`« ${removing.label} » retiré`);
      setConfirmOpen(false);
    } catch (error) {
      toast.error("Le document n'a pas pu être retiré", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const fileFieldId = "event-document-file";
  const labelFieldId = "event-document-label";
  const problemId = "event-document-problem";

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (uploading) return;
          if (!next) reset();
          onOpenChange(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Documents de « {event?.title ?? ""} »</DialogTitle>
            <DialogDescription>
              Un bulletin de réservation, un programme, un tableau…
              {event?.is_public
                ? " L'événement est public : tout le monde peut les télécharger depuis le site, et les membres depuis l'appli."
                : " Les membres les téléchargent depuis leur espace et l'appli."}
            </DialogDescription>
          </DialogHeader>

          {documents.length > 0 ? (
            <ul className="space-y-2" aria-label="Documents joints">
              {documents.map((document) => (
                <DocumentItem
                  key={document.id}
                  document={document}
                  onRemove={() => {
                    setRemoving(document);
                    setConfirmOpen(true);
                  }}
                />
              ))}
            </ul>
          ) : (
            <p className="text-note text-muted-foreground">
              Aucun document pour l&apos;instant.
            </p>
          )}

          <form
            onSubmit={attach}
            noValidate
            className="bg-muted/40 grid gap-4 rounded-lg border p-4"
          >
            <h3 className="text-body font-semibold">Joindre un document</h3>
            <div className="grid gap-2">
              <Label htmlFor={fileFieldId}>
                Fichier
                <RequiredMark />
              </Label>
              {/* The browser's own picker speaks the browser's language:
                  a French button opens the hidden input instead. */}
              <input
                id={fileFieldId}
                ref={inputRef}
                type="file"
                accept={EVENT_DOCUMENT_ACCEPT}
                className="sr-only"
                tabIndex={-1}
                aria-invalid={Boolean(problem) || undefined}
                aria-describedby={problem ? problemId : undefined}
                onChange={(e) => pick(e.target.files?.[0])}
                disabled={uploading}
              />
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload aria-hidden />
                  {file ? "Choisir un autre fichier" : "Choisir un fichier"}
                </Button>
                <span className="text-note text-muted-foreground min-w-0 break-all">
                  {file ? file.name : "Aucun fichier choisi"}
                </span>
              </div>
              <p className="text-note text-muted-foreground">
                PDF, Word ou Excel, 20&nbsp;Mo maximum.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={labelFieldId}>Nom affiché</Label>
              <Input
                id={labelFieldId}
                value={label}
                maxLength={EVENT_DOCUMENT_LABEL_MAX}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Bulletin de réservation"
                disabled={uploading}
              />
              <p className="text-note text-muted-foreground">
                Ce que les membres lisent sur le bouton de téléchargement.
              </p>
            </div>
            {problem && (
              <p
                id={problemId}
                role="alert"
                className="text-detail text-danger-foreground font-medium"
              >
                {problem}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={uploading || !file}>
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    Envoi du fichier…
                  </>
                ) : (
                  <>
                    <Paperclip aria-hidden />
                    Joindre
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!next && !remove.isPending) setConfirmOpen(false);
        }}
        onConfirm={confirmRemove}
        title={`Retirer « ${removing?.label ?? ""} » ?`}
        description="Le fichier disparaît de l'événement sur le site et dans l'appli. Cette action ne peut pas être annulée."
        confirmLabel="Retirer"
        isLoading={remove.isPending}
      />
    </>
  );
}
