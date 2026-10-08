"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { AnnouncementDialog } from "@/components/announcements/AnnouncementDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { DataState, ListSkeleton } from "@/components/ui/data-state";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  type AnnouncementInput,
  type SiteAnnouncement,
  useAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
} from "@/hooks/useAnnouncements";
import { NotInstalledError } from "@/hooks/useDocuments";
import { WEBSITE_URL } from "@/lib/website";
import {
  type AnnouncementForm,
  formFromAnnouncement,
  PLACEMENT_LABELS,
} from "@/utils/announcements/form";
import {
  ANNOUNCEMENT_PLACEMENTS,
  announcementPhase,
  type AnnouncementPlacement,
  isExternalLink,
} from "@repo/domain/utils/announcements";
import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  EyeOff,
  Megaphone,
  Pencil,
  Plus,
  Send,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "Réessayez dans un instant.";

const PAGE_TITLE = "Annonces";
const PAGE_DESCRIPTION =
  "Les boutons sous le titre de l'accueil et la carte de la campagne de dons. Chacune s'affiche entre ses dates, une fois publiée.";

const SECTION_TITLES: Record<AnnouncementPlacement, string> = {
  home: "Accueil",
  donation_popover: "Campagne de dons",
};

const shortDate = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

function windowLabel(a: SiteAnnouncement): string {
  if (a.starts_on && a.ends_on)
    return `Du ${shortDate(a.starts_on)} au ${shortDate(a.ends_on)}`;
  if (a.starts_on) return `À partir du ${shortDate(a.starts_on)}`;
  if (a.ends_on) return `Jusqu'au ${shortDate(a.ends_on)}`;
  return "Sans date de fin";
}

function StatusFor({ announcement }: { announcement: SiteAnnouncement }) {
  if (announcement.status === "archived")
    return <StatusBadge tone="neutral">Archivée</StatusBadge>;
  if (announcement.status === "draft")
    return <StatusBadge tone="neutral">Brouillon</StatusBadge>;
  const phase = announcementPhase(announcement);
  if (phase === "scheduled")
    return <StatusBadge tone="info">Programmée</StatusBadge>;
  if (phase === "ended")
    return <StatusBadge tone="warning">Terminée</StatusBadge>;
  return <StatusBadge tone="success">Sur le site</StatusBadge>;
}

export default function AnnouncementsPage() {
  const { data, isLoading, isError, error, refetch } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SiteAnnouncement | null>(null);
  const [initial, setInitial] = useState<AnnouncementForm>(() =>
    formFromAnnouncement(null),
  );
  const [deleting, setDeleting] = useState<SiteAnnouncement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canDelete = data?.canDelete ?? false;
  const byPlacement = useMemo(() => {
    const all = data?.announcements ?? [];
    return ANNOUNCEMENT_PLACEMENTS.map((placement) => ({
      placement,
      current: all.filter(
        (a) => a.placement === placement && a.status !== "archived",
      ),
    }));
  }, [data]);
  const archived = useMemo(
    () => (data?.announcements ?? []).filter((a) => a.status === "archived"),
    [data],
  );
  const [showArchived, setShowArchived] = useState(false);

  const openNew = (placement: AnnouncementPlacement = "home") => {
    setEditing(null);
    setInitial(formFromAnnouncement(null, placement));
    setDialogOpen(true);
  };
  const openEdit = (announcement: SiteAnnouncement) => {
    setEditing(announcement);
    setInitial(formFromAnnouncement(announcement));
    setDialogOpen(true);
  };

  const handleSubmit = async (values: AnnouncementInput) => {
    try {
      if (editing) {
        await updateAnnouncement.mutateAsync({ id: editing.id, ...values });
        toast.success(`« ${values.title} » enregistrée`);
      } else {
        await createAnnouncement.mutateAsync(values);
        toast.success(
          values.status === "published"
            ? `« ${values.title} » publiée`
            : `« ${values.title} » créée en brouillon`,
        );
      }
    } catch (err) {
      toast.error("L'annonce n'a pas pu être enregistrée", {
        description: errorText(err),
      });
      throw err;
    }
  };

  const setStatus = async (
    announcement: SiteAnnouncement,
    status: SiteAnnouncement["status"],
  ) => {
    const done = {
      published: "publiée",
      draft: "repassée en brouillon",
      archived: "archivée",
    }[status];
    try {
      await updateAnnouncement.mutateAsync({ id: announcement.id, status });
      toast.success(`« ${announcement.title} » ${done}`);
    } catch (err) {
      toast.error("Le changement n'a pas pu être enregistré", {
        description: errorText(err),
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteAnnouncement.mutateAsync(deleting.id);
      toast.success(`« ${deleting.title} » supprimée`);
      setConfirmOpen(false);
    } catch (err) {
      toast.error("La suppression a échoué", { description: errorText(err) });
    }
  };

  if (error instanceof NotInstalledError) {
    return (
      <PageShell
        className="py-4 sm:py-6"
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
      >
        <Callout tone="warning" title="Pas encore installé">
          Cette page attend une mise à jour de la base de données. En attendant,
          le site garde la carte de la campagne de dons actuelle.
        </Callout>
      </PageShell>
    );
  }

  const busy = updateAnnouncement.isPending || deleteAnnouncement.isPending;

  const row = (announcement: SiteAnnouncement) => {
    const link = isExternalLink(announcement.link_url)
      ? announcement.link_url
      : `${WEBSITE_URL}${announcement.link_url}`;
    return (
      <li key={announcement.id}>
        <Card className="flex items-start gap-4 p-4">
          <div
            className="bg-primary-soft text-primary-text grid size-12 shrink-0 place-items-center rounded-md"
            aria-hidden
          >
            <Megaphone className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-body min-w-0 font-semibold break-words">
                  {announcement.title}
                </h3>
                <StatusFor announcement={announcement} />
              </div>
              {announcement.body && (
                <p className="text-note text-muted-foreground">
                  {announcement.body}
                </p>
              )}
              <p className="text-note text-muted-foreground">
                {windowLabel(announcement)} · mène à {announcement.link_url}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(announcement)}
                disabled={busy}
              >
                <Pencil aria-hidden />
                Modifier
                <span className="sr-only"> « {announcement.title} »</span>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href={link} target="_blank" rel="noopener noreferrer">
                  Ouvrir le lien
                  <span className="sr-only"> (nouvel onglet)</span>
                  <ExternalLink aria-hidden />
                </a>
              </Button>
            </div>
          </div>
          <RowActionsMenu
            name={announcement.title}
            subject="l'annonce"
            onDelete={
              canDelete
                ? () => {
                    setDeleting(announcement);
                    setConfirmOpen(true);
                  }
                : undefined
            }
            disabled={busy}
            className="-mt-1 -mr-1 shrink-0"
          >
            {announcement.status === "published" ? (
              <DropdownMenuItem
                onSelect={() => setStatus(announcement, "draft")}
              >
                <EyeOff aria-hidden />
                Repasser en brouillon
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => setStatus(announcement, "published")}
              >
                <Send aria-hidden />
                Publier
              </DropdownMenuItem>
            )}
            {announcement.status === "archived" ? (
              <DropdownMenuItem
                onSelect={() => setStatus(announcement, "draft")}
              >
                <ArchiveRestore aria-hidden />
                Sortir des archives
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => setStatus(announcement, "archived")}
              >
                <Archive aria-hidden />
                Archiver
              </DropdownMenuItem>
            )}
          </RowActionsMenu>
        </Card>
      </li>
    );
  };

  return (
    <PageShell
      className="py-4 sm:py-6"
      title={PAGE_TITLE}
      description={PAGE_DESCRIPTION}
      headerAction={
        <Button
          className="w-full sm:w-auto"
          onClick={() => openNew()}
          disabled={isLoading}
        >
          <Plus aria-hidden />
          Nouvelle annonce
        </Button>
      }
    >
      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={false}
        onRetry={() => refetch()}
        errorDescription="Les annonces n'ont pas pu être chargées."
        skeleton={<ListSkeleton rows={3} label="Chargement des annonces…" />}
      >
        <div className="space-y-8">
          {byPlacement.map(({ placement, current }) => (
            <section
              key={placement}
              aria-labelledby={`section-${placement}`}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 id={`section-${placement}`} className="text-section">
                    {SECTION_TITLES[placement]}
                  </h2>
                  <p className="text-note text-muted-foreground">
                    {PLACEMENT_LABELS[placement]}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openNew(placement)}
                  disabled={isLoading}
                >
                  <Plus aria-hidden />
                  Ajouter
                  <span className="sr-only">
                    {" "}
                    une annonce « {SECTION_TITLES[placement]} »
                  </span>
                </Button>
              </div>
              {current.length === 0 ? (
                <p className="text-note text-muted-foreground">
                  Aucune annonce pour l&apos;instant.
                </p>
              ) : (
                <ul className="space-y-3">{current.map(row)}</ul>
              )}
            </section>
          ))}

          {archived.length > 0 && (
            <section aria-labelledby="archived-heading" className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="archived-heading" className="text-section">
                  Archivées
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
        </div>
      </DataState>

      <AnnouncementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        isPending={createAnnouncement.isPending || updateAnnouncement.isPending}
        initial={initial}
        editing={Boolean(editing)}
      />

      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!next && !deleteAnnouncement.isPending) setConfirmOpen(false);
        }}
        onConfirm={confirmDelete}
        title={`Supprimer « ${deleting?.title ?? ""} » ?`}
        description="Elle disparaît pour de bon. Pour la retirer du site sans la perdre, archivez-la."
        isLoading={deleteAnnouncement.isPending}
      />
    </PageShell>
  );
}
