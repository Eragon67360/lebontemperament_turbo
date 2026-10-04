"use client";

// The three Drive-index screens of « Partitions et documents »: the
// programmes (with the sync), a programme's groups, a group's documents.
// They share one query (useDriveIndex) and build the tree in memory.
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useDriveIndex } from "@/hooks/useDriveIndex";
import { driveItemUrl, syncStatus } from "@/utils/drive/format";
import {
  buildDriveTree,
  childrenOf,
  documentsByFolder,
  folderStats,
  isBelow,
  isFolder,
  rootSections,
  type DriveTree,
} from "@/utils/drive/tree";
import RouteNames from "@/utils/routes";
import { DRIVE_ROOT_SLUG } from "@repo/domain/utils/drive";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  FolderOpen,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import {
  DocumentRow,
  DriveSyncStatusLine,
  FolderRow,
  IndexList,
} from "./DriveIndexRows";
import { DriveSyncSection } from "./DriveSyncSection";

const ROOT = RouteNames.DASHBOARD.MEMBERS.TRAVAIL_ROOT;

function useDriveTree() {
  const query = useDriveIndex();
  const tree = useMemo<DriveTree | null>(
    () => (query.data ? buildDriveTree(query.data.nodes) : null),
    [query.data],
  );
  return { query, tree };
}

const INDEX_ERROR =
  "L'index Drive n'a pas pu être chargé. Réessayez dans un instant.";

/** The landing page's content: the sync, then every programme by root folder. */
export function DriveIndexOverview() {
  const { query, tree } = useDriveTree();
  const sections = useMemo(
    () =>
      tree && query.data
        ? rootSections(tree, query.data.roots, DRIVE_ROOT_SLUG)
        : [],
    [tree, query.data],
  );

  return (
    <>
      <DriveSyncSection
        status={
          query.data ? (
            <DriveSyncStatusLine status={syncStatus(query.data.applies)} />
          ) : query.isLoading ? (
            <Skeleton className="h-7 w-72 max-w-full" />
          ) : null
        }
      />

      <section aria-labelledby="programmes-heading" className="space-y-4">
        <div className="space-y-1">
          <h2 id="programmes-heading" className="text-section">
            Programmes
          </h2>
          <p className="text-detail text-muted-foreground">
            Les dossiers de chaque espace du Drive, tels que les membres les
            retrouvent sur le site et l&apos;application.
          </p>
        </div>

        {query.data?.truncated && (
          <Callout tone="warning" title="Index incomplet">
            L&apos;index compte plus de documents que cette page ne peut en lire
            : une partie n&apos;est pas affichée.
          </Callout>
        )}

        <DataState
          isLoading={query.isLoading}
          isError={query.isError}
          isEmpty={sections.length === 0}
          onRetry={() => query.refetch()}
          errorDescription={INDEX_ERROR}
          skeleton={
            <ListSkeleton rows={4} label="Chargement des programmes…" />
          }
          empty={
            <EmptyState
              icon={FolderOpen}
              title="L'index Drive est vide"
              description="Lancez « Synchroniser depuis Drive » : les programmes apparaîtront ici une fois les changements appliqués."
            />
          }
        >
          <div className="space-y-8">
            {sections.map((section) => {
              const headingId = `drive-root-${section.root.root_slug}`;
              const empty =
                section.programmes.length === 0 &&
                section.documents.length === 0;
              return (
                <section
                  key={section.root.drive_id}
                  aria-labelledby={headingId}
                  className="space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3
                      id={headingId}
                      className="text-[17px] leading-6 font-semibold"
                    >
                      {section.label}
                    </h3>
                    <p className="text-note text-muted-foreground">
                      {section.programmes.length} programme
                      {section.programmes.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  {empty ? (
                    <p className="text-detail text-muted-foreground">
                      Ce dossier Drive est vide.
                    </p>
                  ) : (
                    <IndexList label={`Programmes : ${section.label}`}>
                      {section.programmes.map((programme) => (
                        <FolderRow
                          key={programme.drive_id}
                          node={programme}
                          href={`${ROOT}/${programme.drive_id}`}
                          stats={folderStats(tree!, programme.drive_id)}
                        />
                      ))}
                      {section.documents.map((document) => (
                        <DocumentRow key={document.drive_id} node={document} />
                      ))}
                    </IndexList>
                  )}
                </section>
              );
            })}
          </div>
        </DataState>
      </section>
    </>
  );
}

function BackToProgrammes() {
  return (
    <Button variant="outline" asChild>
      <Link href={ROOT}>
        <ArrowLeft aria-hidden />
        Retour aux programmes
      </Link>
    </Button>
  );
}

function OpenFolderInDrive({ id, name }: { id: string; name: string }) {
  return (
    <Button variant="outline" asChild>
      <a
        href={driveItemUrl({ drive_id: id, kind: "folder" })}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink aria-hidden />
        <span>
          Ouvrir dans Drive
          <span className="sr-only"> : {name} (nouvel onglet)</span>
        </span>
      </a>
    </Button>
  );
}

/** Loading and error frames shared by the programme and group pages. */
function IndexPageFrame({
  query,
  title,
  children,
}: {
  query: ReturnType<typeof useDriveIndex>;
  title: string;
  children: () => ReactNode;
}) {
  if (query.isError || query.isLoading) {
    return (
      <PageShell title={title}>
        <DataState
          isLoading={query.isLoading}
          isError={query.isError}
          onRetry={() => query.refetch()}
          errorDescription={INDEX_ERROR}
          skeleton={<ListSkeleton rows={4} label="Chargement…" />}
        >
          {null}
        </DataState>
      </PageShell>
    );
  }
  return <>{children()}</>;
}

function NotInIndex({ what }: { what: "programme" | "groupe" }) {
  return (
    <PageShell
      title={
        what === "programme" ? "Programme introuvable" : "Groupe introuvable"
      }
    >
      <EmptyState
        icon={FolderOpen}
        title={`Ce ${what} n'est pas dans l'index`}
        description="Il a peut-être été renommé, déplacé ou retiré du Drive depuis la dernière synchronisation."
        action={<BackToProgrammes />}
      />
    </PageShell>
  );
}

/** /dashboard/members/travail/<Drive folder ID>: a programme's groups and its own documents. */
export function DriveProgramView({ programId }: { programId: string }) {
  const { query, tree } = useDriveTree();

  return (
    <IndexPageFrame query={query} title="Programme">
      {() => {
        const programme = tree?.byId.get(programId);
        if (!tree || !programme || !isFolder(programme)) {
          return <NotInIndex what="programme" />;
        }
        const children = childrenOf(tree, programId);
        const groups = children.filter(isFolder);
        const documents = children.filter((child) => !isFolder(child));

        return (
          <PageShell
            title={programme.name}
            description="Les groupes et les documents de ce programme, tels que la dernière synchronisation les a lus dans Drive."
            headerAction={
              <OpenFolderInDrive
                id={programme.drive_id}
                name={programme.name}
              />
            }
            contentClassName="space-y-8"
          >
            <section aria-labelledby="groups-heading" className="space-y-3">
              <h2 id="groups-heading" className="text-section">
                Groupes
              </h2>
              {groups.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Aucun groupe"
                  description="Ce programme n'a pas encore de sous-dossier dans Drive."
                  className="py-8"
                />
              ) : (
                <IndexList label="Groupes">
                  {groups.map((group) => (
                    <FolderRow
                      key={group.drive_id}
                      node={group}
                      href={`${ROOT}/${programId}/${group.drive_id}`}
                      stats={folderStats(tree, group.drive_id)}
                    />
                  ))}
                </IndexList>
              )}
            </section>

            {documents.length > 0 && (
              <section
                aria-labelledby="programme-documents-heading"
                className="space-y-3"
              >
                <h2 id="programme-documents-heading" className="text-section">
                  Documents du programme
                </h2>
                <IndexList label="Documents du programme">
                  {documents.map((document) => (
                    <DocumentRow key={document.drive_id} node={document} />
                  ))}
                </IndexList>
              </section>
            )}
          </PageShell>
        );
      }}
    </IndexPageFrame>
  );
}

/** /dashboard/members/travail/<programme>/<group>: every document of the group, folder by folder. */
export function DriveGroupView({
  programId,
  groupId,
}: {
  programId: string;
  groupId: string;
}) {
  const { query, tree } = useDriveTree();

  return (
    <IndexPageFrame query={query} title="Groupe">
      {() => {
        const group = tree?.byId.get(groupId);
        const programme = tree?.byId.get(programId);
        if (
          !tree ||
          !group ||
          !programme ||
          !isFolder(group) ||
          !isBelow(tree, programId, groupId)
        ) {
          return <NotInIndex what="groupe" />;
        }
        const folders = documentsByFolder(tree, groupId);

        return (
          <PageShell
            title={group.name}
            description={`Les documents du groupe, dans le programme « ${programme.name} ».`}
            headerAction={
              <OpenFolderInDrive id={group.drive_id} name={group.name} />
            }
            contentClassName="space-y-8"
          >
            {folders.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Aucun document"
                description="Ce groupe n'a encore aucun fichier dans Drive."
              />
            ) : (
              folders.map(({ folder, trail, documents }) => {
                const headingId = `folder-${folder.drive_id}`;
                const label = trail.length ? trail.join(" / ") : "Documents";
                return (
                  <section
                    key={folder.drive_id}
                    aria-labelledby={headingId}
                    className="space-y-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 id={headingId} className="text-section break-words">
                        {label}
                      </h2>
                      <p className="text-note text-muted-foreground">
                        {documents.length} document
                        {documents.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <IndexList label={label}>
                      {documents.map((document) => (
                        <DocumentRow key={document.drive_id} node={document} />
                      ))}
                    </IndexList>
                  </section>
                );
              })
            )}
          </PageShell>
        );
      }}
    </IndexPageFrame>
  );
}
