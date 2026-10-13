// « Réglages du site »: what each card shows, what each dialog opens with and
// what it sends. Pure and unit-tested (form.test.ts). The rules for a value
// are the website's own (`parseSiteSetting`, @repo/domain/utils/siteSettings):
// the dialogs run them before sending and show what they find, field by
// field, in plain French.
import type { SavedSetting } from "@/hooks/useSiteSettings";
import {
  type ContactSetting,
  DEFAULT_SITE_SETTINGS,
  DONATION_TIERS_MAX,
  type DonationsSetting,
  JOINING_FACT_KEYS,
  type JoiningFactKey,
  type JoiningSetting,
  type LegalNoticeSetting,
  parseSiteSetting,
  SITE_SETTING_KEYS,
  type SiteSettingKey,
  type SiteSettings,
  SOCIAL_NETWORK_LABELS,
  SOCIAL_NETWORKS,
  type SocialLinksSetting,
} from "@repo/domain/utils/siteSettings";

// --- What each card says -----------------------------------------------------

export type SettingInfo = {
  /** The card's title (an h2) and the dialogs' subject. */
  title: string;
  /** The title inside a sentence: « Les coordonnées du site reviendront… ». */
  what: string;
  /** The one help line under the title. */
  help: string;
  /** The title of the edit dialog. */
  dialogTitle: string;
  /** The one sentence under the edit dialog's title. */
  dialogDescription: string;
  /** The website page that shows the setting (« Voir sur le site »). */
  sitePage: string;
};

const APPEARS_SOON =
  "Les changements s'affichent sur le site dans les minutes qui suivent.";

/** In the order of the page: the order of `SITE_SETTING_KEYS`. */
export const SETTING_INFO: Record<SiteSettingKey, SettingInfo> = {
  contact: {
    title: "Coordonnées",
    what: "les coordonnées",
    help: "L'adresse e-mail qui reçoit les messages du formulaire de contact et l'adresse postale de l'association.",
    dialogTitle: "Modifier les coordonnées",
    dialogDescription: APPEARS_SOON,
    sitePage: "/contact",
  },
  social_links: {
    title: "Réseaux sociaux",
    what: "les réseaux sociaux",
    help: "Les liens vers les pages de l'association. Un réseau sans lien n'est pas affiché sur le site.",
    dialogTitle: "Modifier les réseaux sociaux",
    dialogDescription: `Laissez un champ vide pour ne pas afficher ce réseau. ${APPEARS_SOON}`,
    sitePage: "/",
  },
  donations: {
    title: "Dons",
    what: "les dons",
    help: "Le lien HelloAsso, les montants proposés sur la page Don et celui qui est sélectionné à l'ouverture.",
    dialogTitle: "Modifier les dons",
    dialogDescription: APPEARS_SOON,
    sitePage: "/don",
  },
  joining: {
    title: "Rejoindre",
    what: "les informations pour rejoindre",
    help: "Page Rejoindre et résumé pour les moteurs d'IA. Les réponses de la FAQ se modifient dans « Rejoindre et FAQ ».",
    dialogTitle: "Modifier les informations pour rejoindre",
    dialogDescription: APPEARS_SOON,
    sitePage: "/rejoindre",
  },
  legal_notice: {
    title: "Mentions légales",
    what: "les mentions légales",
    help: "La direction de la publication, le téléphone et les numéros d'identification de l'association.",
    dialogTitle: "Modifier les mentions légales",
    dialogDescription: APPEARS_SOON,
    sitePage: "/mentions-legales",
  },
};

/** Why « Modifier » is off when the signed-in admin may not change a setting. */
export function lockedReason(key: SiteSettingKey): string {
  return key === "contact"
    ? "Réservé aux superadmins : cette adresse reçoit les messages du formulaire de contact."
    : "Réservé aux superadmins.";
}

// --- Dates and amounts -------------------------------------------------------

// The association and its admins live in France: one clock for everyone, so
// « 12 octobre » is the same page whatever the browser's time zone.
const PARIS = "Europe/Paris";
const DAY_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  timeZone: PARIS,
  day: "numeric",
  month: "long",
  year: "numeric",
});
const TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  timeZone: PARIS,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hourCycle: "h23",
});

function validDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** « 12 octobre 2026 »; empty for something that is not a date. */
export function longDateFr(iso: string): string {
  const date = validDate(iso);
  return date ? DAY_FORMAT.format(date) : "";
}

/** « 12 octobre 2026 à 14 h 30 » (« 14 h » on the hour); empty for something that is not a date. */
export function dateTimeFr(iso: string): string {
  const date = validDate(iso);
  if (!date) return "";
  const parts = Object.fromEntries(
    TIME_FORMAT.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const hour = String(Number(parts.hour));
  const time =
    parts.minute === "00" ? `${hour} h` : `${hour} h ${parts.minute}`;
  return `${parts.day} ${parts.month} ${parts.year} à ${time}`;
}

/** « 2 000 € » with a non-breaking space before the euro sign and between thousands. */
export function amountLabel(amount: number): string {
  const digits = String(Math.trunc(amount)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    "\u00a0",
  );
  return `${digits}\u00a0€`;
}

/** A sentence cut at `max` characters, on one line. */
export function shorten(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

// --- Provenance ----------------------------------------------------------------

export const ORIGINAL_VALUES_LABEL = "Valeurs d'origine du site";

/**
 * « Modifié le 12 octobre 2026 par Marie Martin » for a saved setting,
 * « Valeurs d'origine du site » for one never saved (or saved but no longer
 * valid: the site then shows the original values).
 */
export function provenanceLabel(
  saved: SavedSetting | undefined,
  invalid: boolean,
): string {
  if (!saved || invalid) return ORIGINAL_VALUES_LABEL;
  const day = longDateFr(saved.updatedAt);
  const when = day ? `Modifié le ${day}` : "Modifié";
  return saved.updatedBy ? `${when} par ${saved.updatedBy}` : when;
}

// --- What the card shows (read-only) ---------------------------------------------

export type SettingFact = {
  label: string;
  /** One value, clamped to a few lines on the card. */
  text?: string;
  /** Makes `text` a link (new tab). */
  href?: string;
  /** Several short lines (the donation amounts). */
  items?: string[];
};

const JOINING_LABELS: Record<JoiningFactKey, string> = {
  intro: "Présentation",
  where: "Lieux",
  when: "Horaires",
  ages: "Âges",
  audition: "Audition",
  readingMusic: "Lecture de la musique",
  fee: "Cotisation",
  anyTime: "Inscription",
};

const JOINING_HINTS: Record<JoiningFactKey, string> = {
  intro: "Quelques phrases pour présenter l'ensemble.",
  where: "Où ont lieu les répétitions ?",
  when: "Quand ont lieu les répétitions ?",
  ages: "Qui peut nous rejoindre ?",
  audition: "Faut-il passer une audition ?",
  readingMusic: "Faut-il savoir lire la musique ?",
  fee: "Combien coûte l'inscription ?",
  anyTime: "Quand peut-on s'inscrire ?",
};

/** The values of a setting as a few labelled lines, for its card. */
export function settingFacts(
  key: SiteSettingKey,
  value: SiteSettings[SiteSettingKey],
): SettingFact[] {
  switch (key) {
    case "contact": {
      const contact = value as ContactSetting;
      return [
        { label: "Adresse e-mail", text: contact.email },
        {
          label: "Adresse",
          text: `${contact.street}, ${contact.postalCode} ${contact.city}`,
        },
      ];
    }
    case "social_links": {
      const { links } = value as SocialLinksSetting;
      return links.map((link) => ({
        label: SOCIAL_NETWORK_LABELS[link.network],
        text: link.url,
        href: link.url,
      }));
    }
    case "donations": {
      const donations = value as DonationsSetting;
      return [
        {
          label: "Lien HelloAsso",
          text: donations.helloassoUrl,
          href: donations.helloassoUrl,
        },
        {
          label: "Montants proposés",
          items: donations.tiers.map(
            (tier) =>
              `${amountLabel(tier.amount)} ${tier.emoji} ${tier.description}`,
          ),
        },
        {
          label: "Sélectionné à l'ouverture",
          text: amountLabel(donations.defaultAmount),
        },
      ];
    }
    case "joining": {
      const joining = value as JoiningSetting;
      return JOINING_FACT_KEYS.map((fact) => ({
        label: JOINING_LABELS[fact],
        text: joining[fact],
      }));
    }
    case "legal_notice": {
      const legal = value as LegalNoticeSetting;
      return [
        {
          label: "Direction de la publication",
          text: legal.publicationDirector,
        },
        { label: "Téléphone", text: legal.publisherPhone },
        { label: "SIRET", text: legal.siret },
        {
          label: "Registre des associations",
          text: legal.registry ?? "Non renseigné",
        },
      ];
    }
  }
}

// --- The history list ---------------------------------------------------------------

/** One line about a value, to tell the versions of the history apart. */
export function settingSummary(
  key: SiteSettingKey,
  value: SiteSettings[SiteSettingKey],
): string {
  switch (key) {
    case "contact": {
      const c = value as ContactSetting;
      return `${c.email} · ${c.street}, ${c.postalCode} ${c.city}`;
    }
    case "social_links": {
      const { links } = value as SocialLinksSetting;
      return links.length === 0
        ? "Aucun réseau affiché"
        : links.map((link) => SOCIAL_NETWORK_LABELS[link.network]).join(", ");
    }
    case "donations": {
      const d = value as DonationsSetting;
      const amounts = d.tiers.map((tier) => tier.amount);
      const count = amounts.length;
      const range =
        count === 1
          ? amountLabel(amounts[0] ?? 0)
          : `de ${amountLabel(Math.min(...amounts))} à ${amountLabel(Math.max(...amounts))}`;
      return `${count} ${count === 1 ? "montant" : "montants"}, ${range} · ${amountLabel(d.defaultAmount)} sélectionné à l'ouverture`;
    }
    case "joining":
      return `Présentation : ${shorten((value as JoiningSetting).intro, 90)}`;
    case "legal_notice": {
      const l = value as LegalNoticeSetting;
      return `${l.publicationDirector} · ${l.publisherPhone} · SIRET ${l.siret}`;
    }
  }
}

/** What differs between two versions of a setting, by the names the dialog uses. */
export function settingDifferences(
  key: SiteSettingKey,
  previous: SiteSettings[SiteSettingKey],
  current: SiteSettings[SiteSettingKey],
): string[] {
  if (key === "donations") {
    const a = previous as DonationsSetting;
    const b = current as DonationsSetting;
    const differences: string[] = [];
    if (a.helloassoUrl.trim() !== b.helloassoUrl.trim()) {
      differences.push("Lien HelloAsso");
    }
    if (JSON.stringify(a.tiers) !== JSON.stringify(b.tiers)) {
      differences.push("Montants");
    }
    if (a.defaultAmount !== b.defaultAmount) {
      differences.push("Montant sélectionné à l'ouverture");
    }
    return differences;
  }
  const textKey = key as TextSettingKey;
  const a = textValues(textKey, previous as SiteSettings[TextSettingKey]);
  const b = textValues(textKey, current as SiteSettings[TextSettingKey]);
  return settingFields(textKey)
    .filter(
      (field) => (a[field.key] ?? "").trim() !== (b[field.key] ?? "").trim(),
    )
    .map((field) => field.label);
}

/** « Identique à la version actuelle » or « Diffère de la version actuelle : Horaires, Cotisation ». */
export function differencesLabel(differences: string[]): string {
  return differences.length === 0
    ? "Identique à la version actuelle"
    : `Diffère de la version actuelle : ${differences.join(", ")}`;
}

/** « Version remplacée le 12 octobre 2026 à 14 h 30 par Marie Martin ». */
export function revisionHeading(
  changedAt: string,
  changedBy: string | null,
): string {
  const when = dateTimeFr(changedAt);
  if (!when) return "Ancienne version";
  return changedBy
    ? `Version remplacée le ${when} par ${changedBy}`
    : `Version remplacée le ${when}`;
}

// --- Forms made of text fields (everything but the donations) ---------------------

export type TextSettingKey = Exclude<SiteSettingKey, "donations">;
export const TEXT_SETTING_KEYS = SITE_SETTING_KEYS.filter(
  (key): key is TextSettingKey => key !== "donations",
);

export type SettingField = {
  /** The form's key: the name the rules use for this field (`email`, `links.instagram`…). */
  key: string;
  label: string;
  optional?: boolean;
  multiline?: boolean;
  hint?: string;
  placeholder?: string;
  type?: "text" | "email" | "url" | "tel";
  inputMode?: "numeric";
  autoComplete?: string;
};

const CONTACT_FIELDS: SettingField[] = [
  {
    key: "email",
    label: "Adresse e-mail",
    type: "email",
    autoComplete: "off",
    hint: "Les messages du formulaire de contact arrivent à cette adresse.",
  },
  {
    key: "street",
    label: "Adresse",
    autoComplete: "off",
    placeholder: "Numéro et nom de la rue",
  },
  {
    key: "postalCode",
    label: "Code postal",
    inputMode: "numeric",
    autoComplete: "off",
  },
  { key: "city", label: "Ville", autoComplete: "off" },
];

const SOCIAL_FIELDS: SettingField[] = SOCIAL_NETWORKS.map((network) => ({
  key: `links.${network}`,
  label: SOCIAL_NETWORK_LABELS[network],
  optional: true,
  type: "url",
  autoComplete: "off",
  placeholder: `https://www.${network}.com/…`,
}));

const JOINING_FIELDS: SettingField[] = JOINING_FACT_KEYS.map((fact) => ({
  key: fact,
  label: JOINING_LABELS[fact],
  multiline: true,
  hint: JOINING_HINTS[fact],
}));

const LEGAL_FIELDS: SettingField[] = [
  {
    key: "publicationDirector",
    label: "Direction de la publication",
    autoComplete: "off",
  },
  {
    key: "publisherPhone",
    label: "Téléphone",
    type: "tel",
    autoComplete: "off",
    hint: "Affiché uniquement sur les mentions légales",
  },
  {
    key: "siret",
    label: "SIRET",
    autoComplete: "off",
    hint: "14 chiffres, avec ou sans espaces.",
  },
  { key: "registry", label: "Registre des associations", optional: true },
];

const FIELDS: Record<TextSettingKey, SettingField[]> = {
  contact: CONTACT_FIELDS,
  social_links: SOCIAL_FIELDS,
  joining: JOINING_FIELDS,
  legal_notice: LEGAL_FIELDS,
};

export function settingFields(key: TextSettingKey): SettingField[] {
  return FIELDS[key];
}

/** What the inputs hold, by field key. */
export type TextValues = Record<string, string>;

/** The inputs' starting values for a setting. */
export function textValues(
  key: TextSettingKey,
  value: SiteSettings[TextSettingKey],
): TextValues {
  switch (key) {
    case "contact": {
      const c = value as ContactSetting;
      return {
        email: c.email,
        street: c.street,
        postalCode: c.postalCode,
        city: c.city,
      };
    }
    case "social_links": {
      const { links } = value as SocialLinksSetting;
      return Object.fromEntries(
        SOCIAL_NETWORKS.map((network) => [
          `links.${network}`,
          links.find((link) => link.network === network)?.url ?? "",
        ]),
      );
    }
    case "joining": {
      const joining = value as JoiningSetting;
      return Object.fromEntries(
        JOINING_FACT_KEYS.map((fact) => [fact, joining[fact]]),
      );
    }
    case "legal_notice": {
      const l = value as LegalNoticeSetting;
      return {
        publicationDirector: l.publicationDirector,
        publisherPhone: l.publisherPhone,
        siret: l.siret,
        registry: l.registry ?? "",
      };
    }
  }
}

/**
 * What the inputs say, in the shape the rules read: the social links keep
 * the filled networks in the site's order, an empty registry stays empty
 * (the rules turn it into « none »).
 */
export function textInput(key: TextSettingKey, values: TextValues): unknown {
  const get = (name: string) => values[name] ?? "";
  switch (key) {
    case "contact":
      return {
        email: get("email"),
        street: get("street"),
        postalCode: get("postalCode"),
        city: get("city"),
      };
    case "social_links":
      return {
        links: SOCIAL_NETWORKS.filter(
          (network) => get(`links.${network}`).trim() !== "",
        ).map((network) => ({ network, url: get(`links.${network}`) })),
      };
    case "joining":
      return Object.fromEntries(
        JOINING_FACT_KEYS.map((fact) => [fact, get(fact)]),
      );
    case "legal_notice":
      return {
        publicationDirector: get("publicationDirector"),
        publisherPhone: get("publisherPhone"),
        siret: get("siret"),
        registry: get("registry"),
      };
  }
}

export function isSameTextValues(a: TextValues, b: TextValues): boolean {
  const names = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...names].every((name) => (a[name] ?? "") === (b[name] ?? ""));
}

// --- Checking a form -------------------------------------------------------------------

/** One message per input, by the form's key for it. */
export type FormErrors = Record<string, string>;

export type FormCheck<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      errors: FormErrors;
      /** A problem that belongs to no input. */
      general: string | null;
    };

const MAX_ROUNDS = 40;

/**
 * Runs the website's rules on a form. The rules stop at the first problem,
 * so to show every field to fix at once the form is run again with each
 * faulty field replaced by something valid (`repair`) until nothing is left.
 * `errorKey` names the form's input for a rule's field (null: none).
 */
function validate<K extends SiteSettingKey, V>(
  key: K,
  values: V,
  build: (values: V) => unknown,
  errorKey: (field: string, values: V) => string | null,
  repair: (values: V, field: string) => V | null,
): FormCheck<SiteSettings[K]> {
  const errors: FormErrors = {};
  let current = values;
  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const result = parseSiteSetting(key, build(current));
    if (result.ok) {
      return round === 0
        ? { ok: true, value: result.value }
        : { ok: false, errors, general: null };
    }
    const inputKey =
      result.field === undefined ? null : errorKey(result.field, current);
    if (inputKey === null || inputKey in errors) {
      return { ok: false, errors, general: result.error };
    }
    errors[inputKey] = result.error;
    const repaired =
      result.field === undefined ? null : repair(current, result.field);
    if (repaired === null) return { ok: false, errors, general: null };
    current = repaired;
  }
  return { ok: false, errors, general: null };
}

/**
 * Checks a text form: the normalised value to send, or every input to fix.
 * A blank required input just says « À remplir. »; the website's rules then
 * run on the rest.
 */
export function checkTextForm(
  key: TextSettingKey,
  values: TextValues,
): FormCheck<SiteSettings[TextSettingKey]> {
  const fields = settingFields(key);
  const originals = textValues(key, DEFAULT_SITE_SETTINGS[key]);
  const blank = fields.filter(
    (field) => !field.optional && (values[field.key] ?? "").trim() === "",
  );
  const filled = { ...values };
  for (const field of blank) filled[field.key] = originals[field.key] ?? "";

  const checked = validate(
    key,
    filled,
    (current) => textInput(key, current),
    (field, current) => (field in current ? field : null),
    (current, field) => {
      const fallback = originals[field];
      return fallback === undefined || fallback === current[field]
        ? null
        : { ...current, [field]: fallback };
    },
  );
  if (blank.length === 0) return checked;

  const found: FormErrors = checked.ok ? {} : { ...checked.errors };
  for (const field of blank) found[field.key] = "À remplir.";
  const errors = Object.fromEntries(
    fields
      .filter((field) => field.key in found)
      .map((field) => [field.key, found[field.key] ?? ""]),
  );
  return { ok: false, errors, general: checked.ok ? null : checked.general };
}

/** The input a refused save is about (its `field`), or null when it has none. */
export function textErrorKey(values: TextValues, field: string): string | null {
  return field in values ? field : null;
}

// --- The donations form ---------------------------------------------------------------------

/** One amount of the form; `key` is its own, so it survives being moved. */
export type TierRow = {
  key: string;
  /** What the number input holds. */
  amount: string;
  emoji: string;
  description: string;
};

export type DonationsForm = {
  helloassoUrl: string;
  tiers: TierRow[];
  /** The `key` of the amount selected when the page opens. */
  defaultKey: string;
};

export function donationsForm(setting: DonationsSetting): DonationsForm {
  const tiers = setting.tiers.map((tier, index) => ({
    key: `tier-${index + 1}`,
    amount: String(tier.amount),
    emoji: tier.emoji,
    description: tier.description,
  }));
  const selected =
    tiers.find((tier) => Number(tier.amount) === setting.defaultAmount) ??
    tiers[0];
  return {
    helloassoUrl: setting.helloassoUrl,
    tiers,
    defaultKey: selected?.key ?? "",
  };
}

export const canAddTier = (form: DonationsForm) =>
  form.tiers.length < DONATION_TIERS_MAX;

/** A site needs at least one amount to propose. */
export const canRemoveTier = (form: DonationsForm) => form.tiers.length > 1;

function nextTierKey(tiers: readonly TierRow[]): string {
  const used = tiers.map((tier) => Number(tier.key.replace(/^tier-/, "")));
  return `tier-${Math.max(0, ...used.filter(Number.isFinite)) + 1}`;
}

/** A blank amount at the end; nothing at the maximum. */
export function addTier(form: DonationsForm): DonationsForm {
  if (!canAddTier(form)) return form;
  return {
    ...form,
    tiers: [
      ...form.tiers,
      { key: nextTierKey(form.tiers), amount: "", emoji: "", description: "" },
    ],
  };
}

export function moveTier(
  form: DonationsForm,
  key: string,
  direction: "up" | "down",
): DonationsForm {
  const from = form.tiers.findIndex((tier) => tier.key === key);
  const to = direction === "up" ? from - 1 : from + 1;
  const moved = form.tiers[from];
  const swapped = form.tiers[to];
  if (from < 0 || !moved || !swapped) return form;
  const tiers = [...form.tiers];
  tiers[from] = swapped;
  tiers[to] = moved;
  return { ...form, tiers };
}

/**
 * Takes an amount out (never the last one). When it was the one selected on
 * opening, the first remaining amount takes over.
 */
export function removeTier(form: DonationsForm, key: string): DonationsForm {
  if (!canRemoveTier(form) || !form.tiers.some((tier) => tier.key === key)) {
    return form;
  }
  const tiers = form.tiers.filter((tier) => tier.key !== key);
  return {
    ...form,
    tiers,
    defaultKey:
      form.defaultKey === key ? (tiers[0]?.key ?? "") : form.defaultKey,
  };
}

/** « 20 € » for a valid amount, « Montant 3 » while it is blank or wrong. */
export function tierName(row: TierRow, index: number): string {
  const amount = Number(row.amount);
  return row.amount.trim() !== "" && Number.isInteger(amount) && amount > 0
    ? amountLabel(amount)
    : `Montant ${index + 1}`;
}

export function isSameDonationsForm(a: DonationsForm, b: DonationsForm) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const toAmount = (text: string) =>
  text.trim() === "" ? Number.NaN : Number(text);

/** What the donations form says, in the shape the rules read. */
export function donationsInput(form: DonationsForm): unknown {
  const selected = form.tiers.find((tier) => tier.key === form.defaultKey);
  return {
    helloassoUrl: form.helloassoUrl,
    tiers: form.tiers.map((tier) => ({
      amount: toAmount(tier.amount),
      emoji: tier.emoji,
      description: tier.description,
    })),
    defaultAmount: selected ? toAmount(selected.amount) : null,
  };
}

export type TierPart = "amount" | "emoji" | "description";

/** The form's key for one input of an amount's row. */
export const tierErrorKey = (rowKey: string, part: TierPart) =>
  `tier:${rowKey}:${part}`;

const TIER_FIELD = /^tiers\.(\d+)(?:\.(amount|emoji|description))?$/;

/** The input a rule's field (`tiers.2.amount`, `helloassoUrl`…) is about, or null. */
export function donationsErrorKey(
  form: DonationsForm,
  field: string,
): string | null {
  if (
    field === "helloassoUrl" ||
    field === "defaultAmount" ||
    field === "tiers"
  ) {
    return field;
  }
  const match = TIER_FIELD.exec(field);
  const row =
    match?.[1] === undefined ? undefined : form.tiers[Number(match[1])];
  if (!match || !row) return null;
  return tierErrorKey(row.key, (match[2] as TierPart | undefined) ?? "amount");
}

/** What the summary calls an input: « Lien HelloAsso », « Montant 2 », « Emoji du montant 3 »… */
export function donationsErrorLabel(
  form: DonationsForm,
  errorKey: string,
): string {
  if (errorKey === "helloassoUrl") return "Lien HelloAsso";
  if (errorKey === "tiers") return "Montants";
  if (errorKey === "defaultAmount") return "Montant sélectionné à l'ouverture";
  const [, rowKey, part] = errorKey.split(":");
  const index = form.tiers.findIndex((tier) => tier.key === rowKey);
  const number = index + 1;
  if (part === "emoji") return `Emoji du montant ${number}`;
  if (part === "description") return `Description du montant ${number}`;
  return `Montant ${number}`;
}

function repairDonations(
  form: DonationsForm,
  field: string,
): DonationsForm | null {
  if (field === "helloassoUrl") {
    return {
      ...form,
      helloassoUrl: DEFAULT_SITE_SETTINGS.donations.helloassoUrl,
    };
  }
  if (field === "defaultAmount") {
    const first = form.tiers[0];
    return first && first.key !== form.defaultKey
      ? { ...form, defaultKey: first.key }
      : null;
  }
  const match = TIER_FIELD.exec(field);
  const index = match?.[1] === undefined ? -1 : Number(match[1]);
  const row = form.tiers[index];
  if (!match || !row) return null;
  const part = (match[2] as TierPart | undefined) ?? "amount";
  let patch: Partial<TierRow>;
  if (part === "amount") {
    const taken = new Set(
      form.tiers
        .filter((_, i) => i !== index)
        .map((tier) => Number(tier.amount)),
    );
    let free = 1;
    while (taken.has(free)) free += 1;
    patch = { amount: String(free) };
  } else if (part === "emoji") {
    patch = { emoji: "🎵" };
  } else {
    patch = { description: "-" };
  }
  const tiers = form.tiers.map((tier, i) =>
    i === index ? { ...tier, ...patch } : tier,
  );
  return { ...form, tiers };
}

/** Checks the donations form: the normalised value to send, or every input to fix. */
export function checkDonationsForm(
  form: DonationsForm,
): FormCheck<DonationsSetting> {
  return validate(
    "donations",
    form,
    donationsInput,
    (field, current) => donationsErrorKey(current, field),
    repairDonations,
  );
}
