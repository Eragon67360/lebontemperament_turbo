// Run: npx -y deno test --node-modules-dir=none supabase/functions/_shared/delivery-sms_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  arrivalSms,
  codeLink,
  displayCode,
  invitationSms,
  isSingleSms,
  shortFrenchDate,
  toGsm,
} from "./delivery-sms.ts";

const SITE = "https://www.lebontemperament.com";
// Saturday 14 November 2026, 9:30 in Paris.
const DAY = new Date("2026-11-14T08:30:00Z");

Deno.test("codes and links", () => {
  assertEquals(displayCode("K7MP4XQ9"), "K7MP-4XQ9");
  assertEquals(
    codeLink(SITE + "/", "K7MP4XQ9"),
    "www.lebontemperament.com/l/K7MP-4XQ9",
  );
  assertEquals(
    codeLink(undefined, "K7MP4XQ9"),
    "www.lebontemperament.com/l/K7MP-4XQ9",
  );
});

Deno.test("short French date, Paris time", () => {
  assertEquals(shortFrenchDate(DAY), "sam. 14/11");
  // 23:30 UTC on Friday is already Saturday in Paris.
  assertEquals(shortFrenchDate(new Date("2026-11-13T23:30:00Z")), "sam. 14/11");
});

Deno.test("names are folded to the GSM alphabet", () => {
  assertEquals(toGsm("François Hélène Noël"), "Francois Hélène Noel");
  assertEquals(toGsm("L’Étoile «bis»"), 'L\'Étoile "bis"');
  assertEquals(toGsm("Zoé 🧀"), "Zoé ");
});

Deno.test("invitation fits one SMS", () => {
  const text = invitationSms({
    label: "Marie",
    deliveryDay: DAY,
    code: "K7MP4XQ9",
    siteUrl: SITE,
  });
  assertEquals(
    text,
    "Bonjour Marie, votre commande Le Bon Tempérament arrive le sam. 14/11. " +
      "Suivez-la et soyez prévenu : www.lebontemperament.com/l/K7MP-4XQ9 (code K7MP-4XQ9)",
  );
  assertEquals(isSingleSms(text), true);
});

Deno.test("a long or non-GSM name never costs a second SMS", () => {
  const long = invitationSms({
    label: "Marie-Christine de La Tour d'Auvergne",
    deliveryDay: DAY,
    code: "K7MP4XQ9",
    siteUrl: SITE,
  });
  assertEquals(long.startsWith("Bonjour, votre commande"), true);
  assertEquals(isSingleSms(long), true);

  const francois = invitationSms({
    label: "François",
    deliveryDay: DAY,
    code: "K7MP4XQ9",
    siteUrl: SITE,
  });
  assertEquals(francois.startsWith("Bonjour Francois, "), true);
  assertEquals(isSingleSms(francois), true);
});

Deno.test("arrival SMS fits one SMS", () => {
  const text = arrivalSms({ label: "Marie", code: "K7MP4XQ9", siteUrl: SITE });
  assertEquals(
    text,
    "Bonjour Marie, nous arrivons dans 5 minutes environ avec votre commande ! " +
      "Suivez-nous : www.lebontemperament.com/l/K7MP-4XQ9 - Félix & Thomas",
  );
  assertEquals(isSingleSms(text), true);
  assertEquals(
    isSingleSms(
      arrivalSms({
        label: "Marie-Christine de La Tour d'Auvergne",
        code: "K7MP4XQ9",
        siteUrl: SITE,
      }),
    ),
    true,
  );
});
