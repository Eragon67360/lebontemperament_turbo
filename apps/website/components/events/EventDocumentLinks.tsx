import type { EventDocumentLink } from "@repo/domain/types/events";
import { IoDocumentTextOutline, IoDownloadOutline } from "react-icons/io5";

/**
 * The files attached to an event (bulletin de réservation, programme…), one
 * tap away on its card: the name members read, then « PDF · 120 ko ». A PDF
 * opens in a new tab; Word and Excel files download.
 */
export function EventDocumentLinks({
  documents,
  eventTitle,
  className = "",
}: {
  documents: EventDocumentLink[];
  eventTitle: string;
  className?: string;
}) {
  if (documents.length === 0) return null;
  return (
    <ul
      className={`space-y-2 ${className}`}
      aria-label={`Documents de « ${eventTitle} »`}
    >
      {documents.map((document) => {
        const meta = document.size
          ? `${document.kind} · ${document.size}`
          : document.kind;
        const opens = document.kind === "PDF";
        return (
          <li key={document.id}>
            <a
              href={document.url}
              target={opens ? "_blank" : undefined}
              rel={opens ? "noopener noreferrer" : undefined}
              download={opens ? undefined : true}
              className="border-primary/25 bg-primary/5 hover:bg-primary/10 focus-visible:outline-primary group flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <IoDocumentTextOutline
                className="text-primary size-5 shrink-0"
                aria-hidden="true"
              />
              <span className="min-w-0 grow">
                <span className="text-foreground block text-sm font-medium break-words">
                  {document.label}
                </span>
                <span className="text-muted block text-xs">
                  {meta}
                  {opens && <span className="sr-only"> (nouvel onglet)</span>}
                </span>
              </span>
              <IoDownloadOutline
                className="text-primary-text size-5 shrink-0"
                aria-hidden="true"
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
