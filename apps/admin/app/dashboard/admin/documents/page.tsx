"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import {
  CollectionDialog,
  type CollectionFormValues,
} from "@/components/documents/CollectionDialog";
import {
  DocumentDialog,
  type DocumentFormValues,
} from "@/components/documents/DocumentDialog";
import { DocumentRow } from "@/components/documents/DocumentRow";
import { HistoryDialog } from "@/components/documents/HistoryDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  NotInstalledError,
  useCreateCollection,
  useCreateDocument,
  useDeleteCollection,
  useDeleteDocument,
  useDocuments,
  useUpdateCollection,
  useUpdateDocument,
} from "@/hooks/useDocuments";
import { cn } from "@/lib/utils";
import { WEBSITE_URL } from "@/lib/website";
import { uploadDocumentPdf } from "@/utils/documents/upload";
import { createClient } from "@/utils/supabase/client";
import type {
  DocumentCollection,
  SiteDocument,
} from "@repo/domain/types/documents";
import {
  documentPath,
  fileSizeLabel,
  sortDocuments,
} from "@repo/domain/utils/documents";
import { FileText, FolderPlus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const ALL = "all";

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "Réessayez dans un instant.";

export default function DocumentsPage() {
  const { data, isLoading, isError, error, refetch } = useDocuments();
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();

  const collections = useMemo(() => data?.collections ?? [], [data]);
  const documents = useMemo(() => data?.documents ?? [], [data]);
  const canDelete = data?.canDelete ?? false;

  const [filter, setFilter] = useState<string>(ALL);
  const [showArchived, setShowArchived] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SiteDocument | null>(null);
  const [saving, setSaving] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyOf, setHistoryOf] = useState<SiteDocument | null>(null);

  const [deleting, setDeleting] = useState<SiteDocument | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [collectionOpen, setCollectionOpen] = useState(false);
  const [editingCollection, setEditingCollection] =
    useState<DocumentCollection | null>(null);
  const [removingCollection, setRemovingCollection] =
    useState<DocumentCollection | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);

  const byId = useMemo(
    () => new Map(collections.map((c) => [c.id, c])),
    [collections],
  );
  const visibleCollections =
    filter === ALL ? collections : collections.filter((c) => c.id === filter);
  const published = documents.filter((d) => d.status === "published");
  const archived = sortDocuments(
    documents.filter(
      (d) =>
        d.status === "archived" &&
        (filter === ALL || d.collection_id === filter),
    ),
  );
  const totalBytes = documents.reduce((sum, d) => sum + (d.size_bytes ?? 0), 0);

  /** Where « Ouvrir le PDF » leads: the website's address, or the file itself once archived. */
  const fileUrl = (document: SiteDocument) => {
    const collection = byId.get(document.collection_id);
    if (document.status === "published" && collection) {
      return `${WEBSITE_URL}${documentPath(collection.slug, document.file_name)}`;
    }
    return createClient()
      .storage.from("site-media")
      .getPublicUrl(document.storage_key).data.publicUrl;
  };

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleSave = async (values: DocumentFormValues) => {
    setSaving(true);
    try {
      const collection = byId.get(values.collection_id);
      if (!collection) throw new Error("Collection inconnue");
      const upload = values.file
        ? await uploadDocumentPdf(values.file, collection.slug)
        : null;

      if (editing) {
        await updateDocument.mutateAsync({
          id: editing.id,
          title: values.title,
          document_date: values.document_date,
          date_precision: values.date_precision,
          visibility: values.visibility,
          ...(upload ? { storage_key: upload.storageKey } : {}),
        });
        toast.success(`« ${values.title} » enregistré`);
      } else {
        if (!upload) throw new Error("Ajoutez le PDF.");
        await createDocument.mutateAsync({
          collection_id: values.collection_id,
          title: values.title,
          file_name: upload.fileName,
          storage_key: upload.storageKey,
          document_date: values.document_date,
          date_precision: values.date_precision,
          visibility: values.visibility,
        });
        toast.success(`« ${values.title} » ajouté`, {
          description: `Visible dans l'espace membres, rubrique « ${collection.label} ».`,
        });
      }
    } catch (error) {
      toast.error(
        editing
          ? "Le document n'a pas pu être enregistré"
          : "Le document n'a pas pu être ajouté",
        { description: errorText(error) },
      );
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (
    document: SiteDocument,
    status: "published" | "archived",
  ) => {
    setBusyId(document.id);
    try {
      await updateDocument.mutateAsync({ id: document.id, status });
      if (status === "archived") {
        toast.success(`« ${document.title} » archivé`, {
          description:
            "Il n'apparaît plus sur le site. Vous pouvez le remettre en ligne.",
          action: {
            label: "Annuler",
            onClick: () => void setStatus(document, "published"),
          },
        });
      } else {
        toast.success(`« ${document.title} » remis en ligne`);
      }
    } catch (error) {
      toast.error("Le changement n'a pas pu être enregistré", {
        description: errorText(error),
      });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteDocument.mutateAsync(deleting.id);
      toast.success(`« ${deleting.title} » supprimé`);
      setConfirmOpen(false);
    } catch (error) {
      toast.error("La suppression a échoué", { description: errorText(error) });
    }
  };

  const handleCollection = async (values: CollectionFormValues) => {
    try {
      if (editingCollection) {
        await updateCollection.mutateAsync({
          id: editingCollection.id,
          label: values.label,
          description: values.description,
        });
        toast.success("Collection renommée");
      } else {
        await createCollection.mutateAsync(values);
        toast.success(`Collection « ${values.label} » créée`);
      }
    } catch (error) {
      toast.error("La collection n'a pas pu être enregistrée", {
        description: errorText(error),
      });
      throw error;
    }
  };

  const confirmRemoveCollection = async () => {
    if (!removingCollection) return;
    try {
      await deleteCollection.mutateAsync(removingCollection.id);
      toast.success(`Collection « ${removingCollection.label} » supprimée`);
      if (filter === removingCollection.id) setFilter(ALL);
      setRemoveOpen(false);
    } catch (error) {
      toast.error("La collection n'a pas pu être supprimée", {
        description: errorText(error),
      });
    }
  };

  const row = (document: SiteDocument) => (
    <li key={document.id} className="list-none">
      <DocumentRow
        document={document}
        collectionLabel={byId.get(document.collection_id)?.label ?? ""}
        fileUrl={fileUrl(document)}
        busy={busyId === document.id}
        onEdit={() => {
          setEditing(document);
          setDialogOpen(true);
        }}
        onHistory={() => {
          setHistoryOf(document);
          setHistoryOpen(true);
        }}
        onArchive={() => setStatus(document, "archived")}
        onRestore={() => setStatus(document, "published")}
        onDelete={
          canDelete
            ? () => {
                setDeleting(document);
                setConfirmOpen(true);
              }
            : undefined
        }
      />
    </li>
  );

  if (error instanceof NotInstalledError) {
    return (
      <PageShell
        className="py-4 sm:py-6"
        title="Documents de l'association"
        description="Comptes rendus d'AG, gazettes et autres PDF de l'espace membres."
      >
        <Callout tone="warning" title="Pas encore installé">
          Cette page attend une mise à jour de la base de données. En attendant,
          l&apos;espace membres affiche les mêmes documents qu&apos;avant.
        </Callout>
      </PageShell>
    );
  }

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Documents de l'association"
      description="Comptes rendus d'AG, gazettes et autres PDF de l'espace membres. Archiver un document le retire du site sans le perdre."
      headerAction={
        <Button
          className="w-full sm:w-auto"
          onClick={openAdd}
          disabled={collections.length === 0}
        >
          <Plus aria-hidden />
          Ajouter un document
        </Button>
      }
    >
      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={false}
        onRetry={() => refetch()}
        errorDescription="Les documents n'ont pas pu être chargés."
        skeleton={<ListSkeleton rows={4} label="Chargement des documents…" />}
      >
        <div className="space-y-8">
          <div
            role="group"
            aria-label="Afficher une collection"
            className="flex flex-wrap gap-2"
          >
            {[{ id: ALL, label: "Toutes" }, ...collections].map((c) => (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={filter === c.id ? "default" : "outline"}
                aria-pressed={filter === c.id}
                onClick={() => setFilter(c.id)}
              >
                {c.label}
              </Button>
            ))}
          </div>

          {visibleCollections.map((collection) => {
            const items = sortDocuments(
              published.filter((d) => d.collection_id === collection.id),
            );
            const headingId = `collection-${collection.slug}`;
            return (
              <section
                key={collection.id}
                aria-labelledby={headingId}
                className="space-y-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id={headingId} className="text-section">
                    {collection.label}
                  </h2>
                  <p className="text-note text-muted-foreground">
                    {items.length === 0
                      ? "Aucun document en ligne"
                      : items.length === 1
                        ? "1 document en ligne"
                        : `${items.length} documents en ligne`}
                  </p>
                </div>
                {items.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="Rien dans cette collection"
                    description="Les documents ajoutés ici apparaissent dans l'espace membres."
                    className="py-6"
                    action={
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditing(null);
                          setFilter(collection.id);
                          setDialogOpen(true);
                        }}
                      >
                        <Plus aria-hidden />
                        Ajouter un document
                      </Button>
                    }
                  />
                ) : (
                  <ul className="space-y-3">{items.map(row)}</ul>
                )}
              </section>
            );
          })}

          {archived.length > 0 && (
            <section aria-labelledby="archived-heading" className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="archived-heading" className="text-section">
                  Archivés
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-expanded={showArchived}
                  aria-controls="archived-list"
                  onClick={() => setShowArchived((v) => !v)}
                >
                  {showArchived ? "Masquer" : `Afficher (${archived.length})`}
                </Button>
              </div>
              {showArchived && (
                <ul id="archived-list" className="space-y-3">
                  {archived.map(row)}
                </ul>
              )}
            </section>
          )}

          <section aria-labelledby="collections-heading" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="collections-heading" className="text-section">
                Collections
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCollection(null);
                  setCollectionOpen(true);
                }}
              >
                <FolderPlus aria-hidden />
                Nouvelle collection
              </Button>
            </div>
            <Card className="divide-border divide-y p-0">
              {collections.map((collection) => {
                const count = documents.filter(
                  (d) => d.collection_id === collection.id,
                ).length;
                return (
                  <div
                    key={collection.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-body font-medium">
                        {collection.label}
                      </p>
                      <p className="text-note text-muted-foreground">
                        {[
                          collection.description,
                          count === 1 ? "1 document" : `${count} documents`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCollection(collection);
                          setCollectionOpen(true);
                        }}
                      >
                        Renommer
                        <span className="sr-only"> « {collection.label} »</span>
                      </Button>
                      {count === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger-foreground"
                          onClick={() => {
                            setRemovingCollection(collection);
                            setRemoveOpen(true);
                          }}
                        >
                          Supprimer
                          <span className="sr-only">
                            {" "}
                            « {collection.label} »
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
            <p
              className={cn(
                "text-note text-muted-foreground",
                documents.length === 0 && "hidden",
              )}
            >
              {documents.length} documents, {fileSizeLabel(totalBytes)} au total
              (l&apos;offre gratuite de stockage compte 1 Go pour tout le site).
            </p>
          </section>
        </div>
      </DataState>

      <DocumentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSave}
        isPending={saving}
        collections={collections}
        document={editing}
        defaultCollectionId={filter === ALL ? undefined : filter}
      />

      <HistoryDialog
        document={historyOf}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />

      <CollectionDialog
        open={collectionOpen}
        onOpenChange={setCollectionOpen}
        onSubmit={handleCollection}
        isPending={createCollection.isPending || updateCollection.isPending}
        collection={editingCollection}
      />

      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!next && !deleteDocument.isPending) setConfirmOpen(false);
        }}
        onConfirm={confirmDelete}
        title={`Supprimer « ${deleting?.title ?? ""} » ?`}
        description="Le document et son fichier sont supprimés pour de bon, et son lien ne marche plus. Pour seulement le retirer du site, archivez-le."
        confirmLabel="Supprimer définitivement"
        isLoading={deleteDocument.isPending}
      />

      <DeleteConfirmDialog
        open={removeOpen}
        onOpenChange={(next) => {
          if (!next && !deleteCollection.isPending) setRemoveOpen(false);
        }}
        onConfirm={confirmRemoveCollection}
        title={`Supprimer la collection « ${removingCollection?.label ?? ""} » ?`}
        description="Elle est vide : sa rubrique disparaît de l'espace membres."
        isLoading={deleteCollection.isPending}
      />
    </PageShell>
  );
}
