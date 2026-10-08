// Texts of the two SMS a delivery recipient can get (#593): the invitation,
// sent ahead of delivery day, and the « 5 minutes » text on the day, only
// for people who never opened the delivery in the app. Everything else is a
// push (delivery-messages.ts).
//
// Each text must fit one SMS: at most 160 characters from the GSM 03.38
// alphabet. A single character outside it (ç, ê, ’, «, an emoji) switches
// the whole text to UCS-2, 70 characters per segment, so names are folded
// to that alphabet and dropped when the text would not fit.

const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM = new Set(GSM_BASIC);

export const SMS_MAX = 160;

const REPLACEMENTS: Record<string, string> = {
  "’": "'",
  "‘": "'",
  "«": '"',
  "»": '"',
  "“": '"',
  "”": '"',
  "–": "-",
  "—": "-",
  " ": " ",
  " ": " ",
};

/** Folds text to the GSM alphabet: ç → c, ê → e, ’ → ', others dropped. */
export function toGsm(text: string): string {
  let out = "";
  for (const ch of text) {
    if (GSM.has(ch)) {
      out += ch;
    } else if (REPLACEMENTS[ch]) {
      out += REPLACEMENTS[ch];
    } else {
      const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (base.length > 0 && [...base].every((c) => GSM.has(c))) out += base;
    }
  }
  return out;
}

export function isSingleSms(text: string): boolean {
  return text.length <= SMS_MAX && [...text].every((c) => GSM.has(c));
}

/** `K7MP4XQ9` → `K7MP-4XQ9`. */
export function displayCode(code: string): string {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

/** The link's host and path without `https://`, which costs 8 characters. */
export function codeLink(siteUrl: string | undefined, code: string): string {
  const host =
    (siteUrl ?? "").replace(/^https?:\/\//, "").replace(/\/+$/, "") ||
    "www.lebontemperament.com";
  return `${host}/l/${displayCode(code)}`;
}

const WEEKDAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

/** « sam. 14/11 », Paris time. */
export function shortFrenchDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    get("weekday"),
  );
  return `${WEEKDAYS[weekday]} ${get("day")}/${get("month")}`;
}

/** « Bonjour Marie, … », or « Bonjour, … » when the name makes it too long. */
function greeted(label: string, rest: string): string {
  const name = toGsm(label).replace(/\s+/g, " ").trim();
  const withName = `Bonjour ${name}, ${rest}`;
  if (name && isSingleSms(withName)) return withName;
  return `Bonjour, ${rest}`;
}

export function invitationSms(opts: {
  label: string;
  deliveryDay: Date;
  code: string;
  siteUrl?: string;
}): string {
  const { label, deliveryDay, code, siteUrl } = opts;
  return greeted(
    label,
    `votre commande Le Bon Tempérament arrive le ${shortFrenchDate(deliveryDay)}. ` +
      `Suivez-la et soyez prévenu : ${codeLink(siteUrl, code)} (code ${displayCode(code)})`,
  );
}

export function arrivalSms(opts: {
  label: string;
  code: string;
  siteUrl?: string;
}): string {
  const { label, code, siteUrl } = opts;
  return greeted(
    label,
    "nous arrivons dans 5 minutes environ avec votre commande ! " +
      `Suivez-nous : ${codeLink(siteUrl, code)} - Félix & Thomas`,
  );
}
