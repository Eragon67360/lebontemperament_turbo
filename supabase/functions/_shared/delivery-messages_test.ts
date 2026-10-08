// Run: npx -y deno test --node-modules-dir=none supabase/functions/_shared/delivery-messages_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  deliveryMessage,
  frenchClock,
  roundedWindow,
} from "./delivery-messages.ts";

Deno.test("the window is the nearest quarter hour ±15 min", () => {
  const { start, end } = roundedWindow(new Date("2026-11-14T08:29:00Z"));
  assertEquals(start.toISOString(), "2026-11-14T08:15:00.000Z");
  assertEquals(end.toISOString(), "2026-11-14T08:45:00.000Z");
});

Deno.test("times read the French way, in Paris", () => {
  assertEquals(frenchClock(new Date("2026-11-14T08:15:00Z")), "9 h 15");
  assertEquals(frenchClock(new Date("2026-07-14T12:00:00Z")), "14 h");
});

Deno.test("the round-started push gives the window", () => {
  const msg = deliveryMessage(
    "started",
    "r1",
    new Date("2026-11-14T08:29:00Z"),
  );
  assertEquals(msg.title, "Votre livraison");
  assertEquals(
    msg.body,
    "Notre tournée a commencé : passage prévu entre 9 h 15 et 9 h 45.",
  );
  assertEquals(msg.data, { type: "delivery", id: "r1" });
  assertEquals(msg.tag, "delivery_r1");
});

Deno.test("every step has a short text", () => {
  assertEquals(
    deliveryMessage("started", "r1").body,
    "Notre tournée a commencé : suivez-la dans l’appli.",
  );
  for (const kind of ["next", "arriving", "delivered"] as const) {
    const body = deliveryMessage(kind, "r1").body;
    assertEquals([body, body.length < 80], [body, true]);
  }
});
