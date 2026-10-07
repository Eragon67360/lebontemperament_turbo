import assert from "node:assert/strict";
import {
  concertEventJsonLd,
  parisOffset,
  parisStartDate,
  splitPlace,
  type ConcertEventSource,
} from "./concertEvent";

// --- Paris offset: winter +01:00, summer +02:00, around both change-overs.
assert.equal(parisOffset("2027-01-15", "20:00:00"), "+01:00");
assert.equal(parisOffset("2027-07-14", "20:30"), "+02:00");
assert.equal(parisOffset("2027-03-27", "20:00"), "+01:00"); // day before summer time
assert.equal(parisOffset("2027-03-28", "17:00"), "+02:00"); // summer time from 28 March 2027
assert.equal(parisOffset("2026-10-24", "20:00"), "+02:00");
assert.equal(parisOffset("2026-10-25", "17:00"), "+01:00"); // winter time from 25 Oct 2026
assert.equal(
  parisStartDate("2027-03-14", "17:00:00"),
  "2027-03-14T17:00:00+01:00",
);
assert.equal(
  parisStartDate("2027-06-20", "20:30"),
  "2027-06-20T20:30:00+02:00",
);

// --- Places as the agenda has written them.
assert.deepEqual(splitPlace("Strasbourg-Koenigshoffen · Église Saint-Paul"), {
  venue: "Église Saint-Paul",
  city: "Strasbourg-Koenigshoffen",
});
assert.deepEqual(
  splitPlace("Abbatiale Saint-Pierre-et-Saint-Paul - Neuwiller-lès-Saverne"),
  {
    venue: "Abbatiale Saint-Pierre-et-Saint-Paul",
    city: "Neuwiller-lès-Saverne",
  },
);
assert.deepEqual(splitPlace("Église St Paul Koenigshoffen - Strasbourg"), {
  venue: "Église St Paul Koenigshoffen",
  city: "Strasbourg",
});
assert.deepEqual(splitPlace("Eglise Saint-Paul, Strasbourg"), {
  venue: "Eglise Saint-Paul",
  city: "Strasbourg",
});
assert.deepEqual(splitPlace("MAC Robert Lieb - Bischwiller "), {
  venue: "MAC Robert Lieb",
  city: "Bischwiller",
});
assert.deepEqual(splitPlace("Eglise Sainte-Aurélie"), {
  venue: "Eglise Sainte-Aurélie",
  city: null,
});

// --- The JSON-LD itself.
const base = "https://www.lebontemperament.com";
const options = {
  baseUrl: base,
  organizer: {
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: "Le Bon Tempérament",
  },
  performer: {
    "@type": "MusicGroup",
    "@id": `${base}/#organization`,
    name: "Le Bon Tempérament",
  },
  defaultImage: "https://example.com/og.png",
};

const concert: ConcertEventSource = {
  id: "11111111-2222-3333-4444-555555555555",
  name: "Stabat Mater",
  place: "Strasbourg-Koenigshoffen · Église Saint-Paul",
  date: "2027-03-14",
  time: "17:00:00",
  context: "orchestre_et_choeur",
  additional_informations: "Karl Jenkins, Stabat Mater.",
  affiche: "https://example.com/poster.jpg",
  related_link: "https://tickets.example.com/stabat",
  venue_name: "Église Saint-Paul",
  street_address: null,
  postal_code: "67200",
  city: "Strasbourg",
  country: "FR",
  is_free: false,
  price: 15,
};

// Snapshot of a complete, paid concert.
assert.deepEqual(concertEventJsonLd(concert, options), {
  "@context": "https://schema.org",
  "@type": "MusicEvent",
  "@id": `${base}/concerts#concert-11111111-2222-3333-4444-555555555555`,
  name: "Stabat Mater",
  url: `${base}/concerts`,
  startDate: "2027-03-14T17:00:00+01:00",
  description: "Karl Jenkins, Stabat Mater.",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: "Église Saint-Paul",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Strasbourg",
      postalCode: "67200",
      addressCountry: "FR",
    },
  },
  image: ["https://example.com/poster.jpg"],
  offers: {
    "@type": "Offer",
    price: 15,
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    url: "https://tickets.example.com/stabat",
  },
  organizer: options.organizer,
  performer: options.performer,
});

// Free entry: isAccessibleForFree and a zero-price offer on the agenda page.
const free = concertEventJsonLd(
  { ...concert, is_free: true, price: null, related_link: null },
  options,
);
assert.equal(free.isAccessibleForFree, true);
assert.deepEqual(free.offers, {
  "@type": "Offer",
  price: 0,
  priceCurrency: "EUR",
  availability: "https://schema.org/InStock",
  url: `${base}/concerts`,
});

// Not filled yet: the place is split, no offer is invented, the tour's
// poster stands in, and the description says who plays.
const bare = concertEventJsonLd(
  {
    ...concert,
    name: null,
    place: "Abbatiale Saint-Pierre-et-Saint-Paul - Neuwiller-lès-Saverne",
    additional_informations: "",
    affiche: null,
    context: "choeur",
    venue_name: null,
    postal_code: null,
    city: null,
    country: null,
    is_free: null,
    price: null,
  },
  { ...options, tourPoster: "https://example.com/tour.jpg" },
);
assert.equal(bare.name, "Concert à Neuwiller-lès-Saverne");
assert.deepEqual(bare.location, {
  "@type": "Place",
  name: "Abbatiale Saint-Pierre-et-Saint-Paul",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Neuwiller-lès-Saverne",
    addressCountry: "FR",
  },
});
assert.equal(bare.offers, undefined);
assert.equal(bare.isAccessibleForFree, undefined);
assert.deepEqual(bare.image, ["https://example.com/tour.jpg"]);
assert.equal(
  bare.description,
  "Concert du chœur du Bon Tempérament, Neuwiller-lès-Saverne.",
);

// No town anywhere: the address is the place text, never a made-up town.
const unknown = concertEventJsonLd(
  { ...concert, place: "Eglise Sainte-Aurélie", venue_name: null, city: null },
  { ...options },
);
assert.deepEqual(unknown.location, {
  "@type": "Place",
  name: "Eglise Sainte-Aurélie",
  address: "Eglise Sainte-Aurélie",
});

// A street address is used when the AI found one on the poster.
const street = concertEventJsonLd(
  { ...concert, street_address: "1 rue de l'Église" },
  options,
) as { location: { address: { streetAddress?: string } } };
assert.equal(street.location.address.streetAddress, "1 rue de l'Église");

console.log("concertEvent.test.ts: ok");
