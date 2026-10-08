// Texts of the delivery-day pushes (#593): the phones a recipient linked to
// their delivery in the app get these, with `{ type: "delivery", id }` so a
// tap opens the delivery. Kept short: the lock screen shows two lines.
import type { TokenMessage } from "./fcm.ts";

/** Round to the nearest quarter hour, then ±15 min: 09:29 → 09:15–09:45. */
export function roundedWindow(scheduledAt: Date): { start: Date; end: Date } {
  const quarterMs = 15 * 60 * 1000;
  const rounded = Math.round(scheduledAt.getTime() / quarterMs) * quarterMs;
  return {
    start: new Date(rounded - quarterMs),
    end: new Date(rounded + quarterMs),
  };
}

/** « 9 h 15 », « 14 h », Paris time. */
export function frenchClock(date: Date): string {
  const [h, m] = date
    .toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Paris",
    })
    .split(":");
  const hours = String(Number(h));
  return m === "00" ? `${hours} h` : `${hours} h ${m}`;
}

export type DeliveryPushKind = "started" | "next" | "arriving" | "delivered";

const TITLE = "Votre livraison";

export function deliveryMessage(
  kind: DeliveryPushKind,
  recipientId: string,
  scheduledAt?: Date | null,
): TokenMessage {
  let body: string;
  switch (kind) {
    case "started": {
      if (scheduledAt) {
        const { start, end } = roundedWindow(scheduledAt);
        body = `Notre tournée a commencé : passage prévu entre ${frenchClock(start)} et ${frenchClock(end)}.`;
      } else {
        body = "Notre tournée a commencé : suivez-la dans l’appli.";
      }
      break;
    }
    case "next":
      body = "Vous êtes les prochains : nous sommes en route vers vous !";
      break;
    case "arriving":
      body = "Nous arrivons dans environ 5 minutes.";
      break;
    case "delivered":
      body = "Livrée ! Merci pour votre commande.";
      break;
  }
  return {
    title: TITLE,
    body,
    // One notification per recipient on the phone: each step replaces the last.
    tag: `delivery_${recipientId}`,
    data: { type: "delivery", id: recipientId },
  };
}
