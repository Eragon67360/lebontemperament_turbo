// Presentational pieces of « Partitions et documents » (no queries, no
// hooks): a folder row (programme or group), a document row and the index's
// freshness line. Static renders in travail.test.tsx.
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  describeFolderContents,
  driveItemUrl,
  fileTypeLabel,
  formatFileSize,
  formatModifiedDate,
  type SyncStatus,
} from "@/utils/drive/format";
import type { DriveIndexNode, FolderStats } from "@/utils/drive/tree";
import { formatRunDate } from "@/utils/driveSync";
import {
  ChevronRight,
  ExternalLink,
  File,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  Music,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const STATUS_WORD: Record<SyncStatus["tone"], string> = {
  success: "À jour",
  warning: "En cours",
  danger: "Échec",
  info: "Jamais synchronisé",
};

/** « À jour · Index mis à jour le 04/10/2026 03:31 », with the sentence that explains it. */
export function DriveSyncStatusLine({ status }: { status: SyncStatus }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <StatusBadge tone={status.tone} className="w-fit">
        {STATUS_WORD[status.tone]}
      </StatusBadge>
      <p className="text-detail text-muted-foreground">
        {status.label}
        {status.appliedAt && (
          <>
            {" "}
            Dernière mise à jour réussie :{" "}
            <span className="text-foreground">
              {formatRunDate(status.appliedAt)}
            </span>
            .
          </>
        )}
      </p>
    </div>
  );
}

function OpenInDrive({ node }: { node: DriveIndexNode }) {
  return (
    <Button variant="ghost" size="sm" asChild className="shrink-0">
      <a href={driveItemUrl(node)} target="_blank" rel="noopener noreferrer">
        <ExternalLink aria-hidden />
        <span>
          Ouvrir dans Drive
          <span className="sr-only"> : {node.name} (nouvel onglet)</span>
        </span>
      </a>
    </Button>
  );
}

/**
 * A programme or a group: its name links to the next level; the facts say
 * what is inside. « Ouvrir dans Drive » works for whoever the folder is
 * shared with.
 */
export function FolderRow({
  node,
  href,
  stats,
}: {
  node: DriveIndexNode;
  href: string;
  stats: FolderStats;
}) {
  const modified = formatModifiedDate(stats.lastModified);
  return (
    <li className="flex min-h-(--row-h) flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className="bg-primary-soft text-primary-text grid size-10 shrink-0 place-items-center rounded-md"
          aria-hidden
        >
          <Folder className="size-5" />
        </div>
        <div className="min-w-0">
          <Link
            href={href}
            className="text-foreground hover:text-primary-text inline-flex min-h-6 items-center gap-1 font-medium break-words underline-offset-4 hover:underline"
          >
            {node.name}
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          </Link>
          <p className="text-note text-muted-foreground">
            {describeFolderContents(stats)}
            {modified && ` · dernier document modifié le ${modified}`}
          </p>
        </div>
      </div>
      <OpenInDrive node={node} />
    </li>
  );
}

const ICON_CLASS = "text-foreground-faint size-5 shrink-0";

/** The document's icon by family: score, audio, image, video, sheet, text, other. */
function DocumentIcon({ node }: { node: DriveIndexNode }) {
  const mime = node.mime_type ?? "";
  const type = fileTypeLabel(node.mime_type, node.name);
  if (["MuseScore", "MusicXML", "Sibelius", "MIDI"].includes(type)) {
    return <Music className={ICON_CLASS} aria-hidden />;
  }
  if (mime.startsWith("audio/") || type.startsWith("Audio")) {
    return <FileAudio className={ICON_CLASS} aria-hidden />;
  }
  if (mime.startsWith("image/")) {
    return <FileImage className={ICON_CLASS} aria-hidden />;
  }
  if (mime.startsWith("video/")) {
    return <FileVideo className={ICON_CLASS} aria-hidden />;
  }
  if (type === "Excel" || type === "Feuille Google") {
    return <FileSpreadsheet className={ICON_CLASS} aria-hidden />;
  }
  if (["PDF", "Word", "Document Google", "Texte"].includes(type)) {
    return <FileText className={ICON_CLASS} aria-hidden />;
  }
  return <File className={ICON_CLASS} aria-hidden />;
}

/** A document: name, then type · size · modified date, and « Ouvrir dans Drive ». */
export function DocumentRow({ node }: { node: DriveIndexNode }) {
  const facts = [
    fileTypeLabel(node.mime_type, node.name),
    formatFileSize(node.size),
    formatModifiedDate(node.modified_time)
      ? `modifié le ${formatModifiedDate(node.modified_time)}`
      : null,
  ].filter((fact): fact is string => !!fact);

  return (
    <li className="flex min-h-(--row-h) flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <DocumentIcon node={node} />
        <div className="min-w-0">
          <p className="text-foreground font-medium break-words">{node.name}</p>
          <p className="text-note text-muted-foreground">{facts.join(" · ")}</p>
        </div>
      </div>
      <OpenInDrive node={node} />
    </li>
  );
}

/** The bordered list that holds folder or document rows. */
export function IndexList({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <ul
      aria-label={label}
      className="border-border bg-card divide-border divide-y rounded-lg border shadow-sm"
    >
      {children}
    </ul>
  );
}
