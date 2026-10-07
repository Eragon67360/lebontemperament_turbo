// schema.org MusicEvent for one upcoming concert, as Google's event results
// read it (#328): a top-level node per concert, the start time with the
// Paris offset, the venue's postal address, free entry or the price, and the
// poster. The address and price come from the columns the AI fills when a
// concert is saved (generate-concert-event-data); a concert without them
// falls back to its `place` text, split into venue and town when possible.
import type { Concert } from "../types/concerts";

export type ConcertEventSource = Pick<
  Concert,
  | "id"
  | "name"
  | "place"
  | "date"
  | "time"
  | "context"
  | "additional_informations"
  | "affiche"
  | "related_link"
  | "venue_name"
  | "street_address"
  | "postal_code"
  | "city"
  | "country"
  | "is_free"
  | "price"
>;

type NodeRef = { "@type": string; "@id": string; name: string };

export type ConcertEventOptions = {
  /** Site origin without a trailing slash, e.g. https://www.lebontemperament.com */
  baseUrl: string;
  organizer: NodeRef;
  performer: NodeRef;
  /** Used when the concert has no poster and its tour has none either. */
  defaultImage: string;
  /** The tour's poster, when the concert belongs to a tour. */
  tourPoster?: string | null;
};

const PARIS_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * The Paris UTC offset (« +01:00 » in winter, « +02:00 » in summer) in force
 * at that local date and time. Concerts never start during the 02:00–03:00
 * change-over hour, so the first guess is always right.
 */
export function parisOffset(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  const asUtc = Date.UTC(y, m - 1, d, hh, mm);
  const parts = Object.fromEntries(
    PARIS_PARTS.formatToParts(new Date(asUtc)).map((p) => [p.type, p.value]),
  );
  const wall = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  );
  const minutes = Math.round((wall - asUtc) / 60000);
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** « 2027-03-14T17:00:00+01:00 » from the concert's local date and time. */
export function parisStartDate(date: string, time: string): string {
  const hhmmss = time.length === 5 ? `${time}:00` : time.slice(0, 8);
  return `${date}T${hhmmss}${parisOffset(date, time)}`;
}

const VENUE_WORDS =
  /^(é|e)glise|^abbatiale|^cath(é|e)drale|^basilique|^coll(é|e)giale|^chapelle|^temple|^salle|^mac\b|^th(é|e)(â|a)tre|^auditorium|^conservatoire|^centre|^espace|^maison|^couvent|^palais|^op(é|e)ra|^cit(é|e) /i;

const SEPARATORS = [" · ", " – ", " — ", " - ", ", "];

/**
 * Splits the admin's free-text place into venue and town. The agenda has
 * used « Ville · Salle », « Salle - Ville » and « Salle, Ville »; the side
 * that starts like a venue (« Église », « Salle », « MAC »…) is the venue.
 * Without a separator, the whole text is the venue and the town is unknown.
 */
export function splitPlace(place: string): {
  venue: string;
  city: string | null;
} {
  const text = place.replace(/\s+/g, " ").trim();
  for (const separator of SEPARATORS) {
    const index = text.indexOf(separator);
    if (index <= 0) continue;
    const left = text.slice(0, index).trim();
    const right = text.slice(index + separator.length).trim();
    if (!left || !right) continue;
    if (VENUE_WORDS.test(right) && !VENUE_WORDS.test(left)) {
      return { venue: right, city: left };
    }
    if (VENUE_WORDS.test(left)) return { venue: left, city: right };
    // « Ville · Salle » is how the admin writes it today.
    return separator === " · "
      ? { venue: right, city: left }
      : { venue: left, city: right };
  }
  return { venue: text, city: null };
}

const CONTEXT_DESCRIPTIONS: Record<string, string> = {
  orchestre: "Concert de l'orchestre du Bon Tempérament",
  choeur: "Concert du chœur du Bon Tempérament",
  orchestre_et_choeur: "Concert du chœur et de l'orchestre du Bon Tempérament",
};

function description(concert: ConcertEventSource, town: string): string {
  const typed = concert.additional_informations?.trim();
  if (typed) return typed;
  const lead =
    CONTEXT_DESCRIPTIONS[concert.context] ?? "Concert du Bon Tempérament";
  return `${lead}, ${town}.`;
}

const OFFER_STATUS = "https://schema.org/InStock";

export function concertEventJsonLd(
  concert: ConcertEventSource,
  options: ConcertEventOptions,
): Record<string, unknown> {
  const parsed = splitPlace(concert.place);
  const venue = concert.venue_name?.trim() || parsed.venue;
  const city = concert.city?.trim() || parsed.city;
  const pageUrl = `${options.baseUrl}/concerts`;
  const ticketUrl = concert.related_link?.trim() || pageUrl;

  const address = city
    ? {
        "@type": "PostalAddress",
        ...(concert.street_address
          ? { streetAddress: concert.street_address }
          : {}),
        addressLocality: city,
        ...(concert.postal_code ? { postalCode: concert.postal_code } : {}),
        addressCountry: concert.country || "FR",
      }
    : concert.place.trim();

  const price = concert.price === null ? null : Number(concert.price);
  const offers =
    concert.is_free === true
      ? {
          "@type": "Offer",
          price: 0,
          priceCurrency: "EUR",
          availability: OFFER_STATUS,
          url: ticketUrl,
        }
      : price !== null && Number.isFinite(price) && price > 0
        ? {
            "@type": "Offer",
            price,
            priceCurrency: "EUR",
            availability: OFFER_STATUS,
            url: ticketUrl,
          }
        : undefined;

  const image = concert.affiche || options.tourPoster || options.defaultImage;

  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    "@id": `${pageUrl}#concert-${concert.id}`,
    name: concert.name?.trim() || `Concert à ${city ?? concert.place}`,
    url: pageUrl,
    startDate: parisStartDate(concert.date, concert.time),
    description: description(concert, city ?? concert.place),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: venue, address },
    image: [image],
    ...(concert.is_free === true ? { isAccessibleForFree: true } : {}),
    ...(offers ? { offers } : {}),
    organizer: options.organizer,
    performer: options.performer,
  };
}
