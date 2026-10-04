import { cn } from "@/lib/utils";
import {
  concertTitle,
  excerpt,
  formatLongDateFr,
  formatTimeFr,
} from "@/utils/concerts/schedule";
import { format } from "date-fns";

export type ConcertPreviewValues = {
  name: string;
  place: string;
  /** The form's Date, or null while none is chosen. */
  date: Date | null;
  /** "20:30" as the time input emits it. */
  time: string;
  additional_informations: string;
  related_link: string;
  /** A stored poster URL or a local object URL of the chosen file. */
  posterUrl: string | null;
};

/** The « Informations et réservation » button shows only for a real address. */
export function isReservationLink(link: string): boolean {
  try {
    const url = new URL(link);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * A small likeness of the concert card the public site shows (direction
 * B's « Aperçu sur le site public »): it updates as the admin types and
 * keeps missing pieces honest (« Lieu manquant », « Date à choisir »).
 */
export function ConcertPreview({
  values,
  className,
}: {
  values: ConcertPreviewValues;
  className?: string;
}) {
  const title = concertTitle({ name: values.name, place: values.place });
  const dateText = values.date
    ? formatLongDateFr(format(values.date, "yyyy-MM-dd"))
    : null;
  const timeText = formatTimeFr(values.time);
  const info = excerpt(values.additional_informations, 160);

  return (
    <div
      className={cn(
        "border-border bg-card overflow-hidden rounded-lg border",
        className,
      )}
      data-testid="concert-preview"
    >
      <div className="bg-surface-sunken relative aspect-[3/2] w-full">
        {values.posterUrl ? (
          // A local object URL of the chosen file cannot go through the
          // image optimiser; the preview is tiny and never shipped.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={values.posterUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <p className="text-muted-foreground text-detail absolute inset-0 grid place-items-center px-4 text-center">
            Pas d&apos;affiche pour le moment
          </p>
        )}
      </div>
      <div className="space-y-1 p-4">
        <p className="text-note text-primary-text font-semibold tracking-wide uppercase">
          {dateText ?? (
            <span className="text-danger-foreground normal-case">
              Date à choisir
            </span>
          )}
          {timeText && ` · ${timeText}`}
        </p>
        <p className="text-[17px] leading-6 font-semibold break-words">
          {title}
        </p>
        <p className="text-detail text-muted-foreground">
          {values.place.trim() ? (
            values.place
          ) : (
            <span className="text-danger-foreground font-medium">
              Lieu manquant
            </span>
          )}
        </p>
        {info && <p className="text-detail pt-1 break-words">{info}</p>}
        {isReservationLink(values.related_link) && (
          <span
            aria-hidden
            className="bg-primary-strong text-primary-foreground text-detail mt-3 inline-flex h-9 items-center rounded-md px-3 font-medium"
          >
            Informations et réservation
          </span>
        )}
      </div>
    </div>
  );
}
