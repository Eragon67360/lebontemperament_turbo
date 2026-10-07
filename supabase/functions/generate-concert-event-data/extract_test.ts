import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";

import {
  buildRequestBody,
  posterUrl,
  sanitize,
  userPrompt,
  type ConcertInput,
} from "./extract.ts";

const concert: ConcertInput = {
  name: "Stabat Mater",
  place: "Strasbourg-Koenigshoffen · Église Saint-Paul",
  date: "2027-03-14",
  time: "17:00:00",
  additional_informations: "Entrée libre, plateau",
  related_link: null,
  affiche:
    "https://example.supabase.co/storage/v1/object/public/concert-posters/a.jpg",
  tour_name: null,
};

const raw = {
  venue_name: "Église Saint-Paul",
  street_address: null,
  street_address_source: null,
  postal_code: "67200",
  city: "Strasbourg",
  country: "fr",
  is_free: true,
  price: 12,
};

Deno.test(
  "sanitize keeps plausible values and drops a price on a free concert",
  () => {
    assertEquals(sanitize(raw), {
      venue_name: "Église Saint-Paul",
      street_address: null,
      postal_code: "67200",
      city: "Strasbourg",
      country: "FR",
      is_free: true,
      price: null,
    });
  },
);

Deno.test(
  "sanitize drops a malformed French postal code and a bad country",
  () => {
    const out = sanitize({ ...raw, postal_code: "672", country: "France" });
    assertEquals(out.postal_code, null);
    assertEquals(out.country, null);
  },
);

Deno.test("sanitize reads a price as paid and rejects absurd prices", () => {
  assertEquals(sanitize({ ...raw, is_free: null, price: 15 }).is_free, false);
  assertEquals(sanitize({ ...raw, is_free: false, price: 15.499 }).price, 15.5);
  assertEquals(sanitize({ ...raw, is_free: false, price: -3 }).price, null);
  assertEquals(sanitize({ ...raw, is_free: false, price: 5000 }).price, null);
});

Deno.test("sanitize turns blank strings into null", () => {
  assertEquals(
    sanitize({ ...raw, venue_name: "  ", city: "" }).venue_name,
    null,
  );
});

Deno.test(
  "a street address needs a source, and typed text must contain it",
  () => {
    const street = { ...raw, street_address: "16 rue Martin Bucer" };
    // Remembered by the model, not read anywhere: dropped.
    assertEquals(sanitize(street).street_address, null);
    // Read on the poster: kept.
    assertEquals(
      sanitize({ ...street, street_address_source: "affiche" }).street_address,
      "16 rue Martin Bucer",
    );
    // Claimed from the typed text: kept only if the text has it.
    const typed = { ...street, street_address_source: "saisie" as const };
    assertEquals(sanitize(typed, "Église Sainte-Aurélie").street_address, null);
    assertEquals(
      sanitize(typed, "Église Sainte-Aurélie, 16 Rue Martin-Bucer")
        .street_address,
      "16 rue Martin Bucer",
    );
  },
);

Deno.test("only https posters are sent", () => {
  assertEquals(posterUrl("http://example.com/a.jpg"), null);
  assertEquals(posterUrl("not a url"), null);
  assertEquals(posterUrl(null), null);
});

Deno.test("the request carries the poster as an image, or text alone", () => {
  const withPoster = buildRequestBody(concert, "m", true) as {
    messages: Array<{ content: unknown }>;
  };
  const content = withPoster.messages[1]!.content as Array<{ type: string }>;
  assertEquals(
    content.map((part) => part.type),
    ["text", "image_url"],
  );

  const without = buildRequestBody(concert, "m", false) as {
    messages: Array<{ content: unknown }>;
  };
  assertEquals(typeof without.messages[1]!.content, "string");
  assertEquals(
    (without.messages[1]!.content as string).includes("affiche: aucune"),
    true,
  );
});

Deno.test("the prompt carries what the admin typed", () => {
  const text = userPrompt(concert);
  assertEquals(text.includes("lieu: Strasbourg-Koenigshoffen"), true);
  assertEquals(text.includes("2027-03-14 17:00"), true);
  assertEquals(text.includes("Entrée libre, plateau"), true);
});
