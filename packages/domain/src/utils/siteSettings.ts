// Site settings (public.site_settings, edited in the admin under Concerts et
// site public › « Réglages du site »): one row per key, its value a JSON
// object checked by `parseSiteSetting`. The website reads them with
// `readSiteSettings`, which falls back to DEFAULT_SITE_SETTINGS per key while
// a row is missing or invalid, so the site always shows something sensible.
// The table only checks that a value is a small JSON object
// (supabase/migrations/20261012232052_site_settings.sql); the rules live here,
// shared by the admin's routes and the website.

export const SITE_SETTING_KEYS = [
  "contact",
  "social_links",
  "donations",
  "joining",
  "legal_notice",
] as const;
export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];

/**
 * Keys only a superadmin may change: the mailbox receives the contact forms
 * and the members' personal-data requests, so moving it is not an admin's
 * call (same rule as changing a member's email).
 */
export const SUPERADMIN_SETTING_KEYS: readonly SiteSettingKey[] = ["contact"];

export const SOCIAL_NETWORKS = [
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const SOCIAL_NETWORK_LABELS: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
};

/** The hosts each network's link may point to (https only). */
const SOCIAL_HOSTS: Record<SocialNetwork, readonly string[]> = {
  facebook: ["www.facebook.com", "facebook.com", "m.facebook.com"],
  instagram: ["www.instagram.com", "instagram.com"],
  youtube: ["www.youtube.com", "youtube.com", "m.youtube.com"],
  tiktok: ["www.tiktok.com", "tiktok.com"],
};

const HELLOASSO_HOSTS = ["www.helloasso.com", "helloasso.com"];

export type ContactSetting = {
  /** The public mailbox: shown on the site, receives the contact forms. */
  email: string;
  /** The registered office. */
  street: string;
  postalCode: string;
  city: string;
};

export type SocialLink = { network: SocialNetwork; url: string };
export type SocialLinksSetting = { links: SocialLink[] };

export type DonationTier = {
  amount: number;
  emoji: string;
  description: string;
};
export type DonationsSetting = {
  helloassoUrl: string;
  tiers: DonationTier[];
  /** The tier selected when /don opens; one of the tiers' amounts. */
  defaultAmount: number;
};

export const JOINING_FACT_KEYS = [
  "intro",
  "where",
  "when",
  "ages",
  "audition",
  "readingMusic",
  "fee",
  "anyTime",
] as const;
export type JoiningFactKey = (typeof JOINING_FACT_KEYS)[number];
export type JoiningSetting = Record<JoiningFactKey, string>;

export type LegalNoticeSetting = {
  publicationDirector: string;
  /** Shown on the legal notice only (LCEN); nowhere else on the site (#329). */
  publisherPhone: string;
  siret: string;
  /** The entry in the register of associations, once the board gives it. */
  registry: string | null;
};

export type SiteSettings = {
  contact: ContactSetting;
  social_links: SocialLinksSetting;
  donations: DonationsSetting;
  joining: JoiningSetting;
  legal_notice: LegalNoticeSetting;
};

export const CONTACT_EMAIL_MAX = 120;
export const CONTACT_STREET_MAX = 120;
export const CONTACT_CITY_MAX = 80;
export const SOCIAL_URL_MAX = 300;
export const HELLOASSO_URL_MAX = 300;
export const DONATION_TIERS_MAX = 10;
export const DONATION_AMOUNT_MAX = 100000;
export const DONATION_EMOJI_MAX = 16;
export const DONATION_DESCRIPTION_MAX = 300;
export const JOINING_FACT_MAX = 1500;
export const LEGAL_NAME_MAX = 120;
export const LEGAL_PHONE_MAX = 30;
export const LEGAL_REGISTRY_MAX = 200;

/** What the site showed before the admin managed these (the fallback). */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  contact: {
    email: "lebontemperament@gmail.com",
    street: "3 Rue Clemenceau",
    postalCode: "67700",
    city: "Saverne",
  },
  social_links: {
    links: [
      {
        network: "facebook",
        url: "https://www.facebook.com/p/Le-Bon-Temp%C3%A9rament-100063069588507/",
      },
      {
        network: "instagram",
        url: "https://www.instagram.com/lebontemperament_/",
      },
      { network: "youtube", url: "https://www.youtube.com/@lebontemperament" },
      { network: "tiktok", url: "https://www.tiktok.com/@lebontemperament" },
    ],
  },
  donations: {
    helloassoUrl:
      "https://www.helloasso.com/associations/le-bon-temperament/formulaires/2",
    tiers: [
      {
        amount: 5,
        emoji: "🥤",
        description:
          "Achat de « housses anti-bruit » pour les gourdes en métal qui tombent pendant (presque toutes) les répétitions et hérissent la cheffe de chœur !",
      },
      {
        amount: 10,
        emoji: "💡",
        description:
          "Une lampe de pupitre pour nos petits yeux, fragiles, fatigués ou un peu vieux, dans les lieux de concert souvent très beaux… mais sombres.",
      },
      {
        amount: 15,
        emoji: "🗂️",
        description:
          "Une jolie pochette noire rigide pour bien ranger toutes les partitions du chœur et de l’orchestre pendant les concerts.",
      },
      {
        amount: 20,
        emoji: "📖",
        description:
          "Une partition reliée de nos œuvres principales, avec plein de pages qui tombent pendant les concerts et perturbent les musiciens…",
      },
      {
        amount: 30,
        emoji: "🎼",
        description:
          "Un pupitre de concert pour nos talentueux musiciens, qui ont besoin de leurs mains pour tenir leurs instruments plutôt que leurs partitions.",
      },
      {
        amount: 200,
        emoji: "🏛️",
        description:
          "La location d’un lieu de concert pour accueillir notre très grand ensemble de presque 100 choristes et musiciens… et son public nombreux.",
      },
      {
        amount: 2000,
        emoji: "🥁",
        description:
          "Des timbales pour notre incroyable percussionniste : nous aimerions acheter, plutôt que louer, cet instrument essentiel.",
      },
    ],
    defaultAmount: 20,
  },
  // Given by the owner on 2026-10-06 (#334), checked against the rehearsals
  // of the 2026-2027 season.
  joining: {
    intro:
      "Le Bon Tempérament est un ensemble vocal et instrumental associatif, fondé en 1987 à Saverne (Bas-Rhin), avec des chœurs pour tous les âges et, depuis 2023, un orchestre symphonique. Il accueille les chanteurs et les instrumentistes de tous niveaux, sans audition et sans obligation de lire la musique. Le chœur d’adultes répète principalement à Wangen et à Nordheim : le mercredi soir pour les femmes, le samedi matin pour les hommes et un dimanche par mois pour le chœur complet ; l’orchestre répète le jeudi soir au Conservatoire de Strasbourg. Vous pouvez nous rejoindre à tout moment de l’année, en commençant par une répétition d’essai.",
    where:
      "Les répétitions ont lieu en plusieurs endroits du Bas-Rhin : principalement à Wangen et à Nordheim pour le chœur d’adultes, et au Conservatoire de Strasbourg pour l’orchestre. Nous vous indiquons le lieu de votre répétition d’essai quand vous nous contactez ; les membres retrouvent ensuite chaque répétition dans leur agenda.",
    when: "Pour le chœur d’adultes, en général : le mercredi de 20 h 30 à 22 h pour les pupitres de femmes et le samedi de 10 h à 11 h 30 pour les pupitres d’hommes, toutes les deux semaines ; le dimanche de 9 h 30 à 16 h, environ une fois par mois, pour le chœur complet. L’orchestre répète le jeudi de 19 h 45 à 21 h 45. Les chœurs d’enfants et de jeunes ont leurs propres horaires : demandez-les-nous.",
    ages: "Tous les âges sont les bienvenus, des enfants aux seniors : le chœur des tout-jeunes, le chœur de jeunes, le chœur d’adultes et l’orchestre mêlent les générations.",
    audition:
      "Il n’y a pas d’audition. Vous venez à une répétition d’essai, puis c’est vous qui décidez si vous restez.",
    readingMusic:
      "Non, il n’est pas nécessaire de savoir lire la musique pour chanter dans le chœur. L’important est l’envie de chanter ensemble.",
    fee: "La cotisation est d’environ 40 € par an pour un adulte qui travaille, partitions comprises. Une commission de solidarité aide les membres qui en ont besoin.",
    anyTime:
      "Vous pouvez nous rejoindre à tout moment de l’année, il n’y a pas de date limite d’inscription.",
  },
  legal_notice: {
    publicationDirector: "Sophie Bellard",
    publisherPhone: "+33 6 89 68 74 82",
    siret: "499 664 654 00013",
    registry: null,
  },
};

export type SiteSettingResult<K extends SiteSettingKey> =
  | { ok: true; value: SiteSettings[K] }
  | {
      ok: false;
      /** One plain French sentence for the admin. */
      error: string;
      /** The field it is about: `email`, `links.instagram`, `tiers.2.amount`… */
      field?: string;
    };

type Failure = { ok: false; error: string; field?: string };
const fail = (error: string, field?: string): Failure => ({
  ok: false,
  error,
  ...(field ? { field } : {}),
});

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  typeof raw === "object" && raw !== null && !Array.isArray(raw);

/** Refuses fields other than `allowed`, so a typo never sits unnoticed. */
function unknownField(
  raw: Record<string, unknown>,
  allowed: readonly string[],
): Failure | null {
  const extra = Object.keys(raw).find((name) => !allowed.includes(name));
  return extra ? fail(`Champ inconnu : ${extra}`, extra) : null;
}

/** A trimmed, non-empty string of at most `max` characters, or a failure. */
function text(
  raw: unknown,
  field: string,
  label: string,
  max: number,
): string | Failure {
  if (typeof raw !== "string" || raw.trim() === "") {
    return fail(`${label} : à remplir.`, field);
  }
  const value = raw.trim();
  if (value.length > max) {
    return fail(`${label} : ${max} caractères au plus.`, field);
  }
  return value;
}

const failed = (value: unknown): value is Failure =>
  isRecord(value) && value.ok === false;

/** An https address on one of `hosts`, or null. */
function httpsUrlOn(raw: string, hosts: readonly string[]): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    return null;
  }
  return hosts.includes(url.hostname.toLowerCase()) ? raw : null;
}

const EMAIL_PATTERN = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/i;
const POSTAL_CODE_PATTERN = /^\d{5}$/;
const PHONE_PATTERN = /^\+?[0-9][0-9 .()-]{5,28}[0-9]$/;
const SIRET_PATTERN = /^\d{14}$/;

function parseContact(raw: unknown): SiteSettingResult<"contact"> {
  if (!isRecord(raw)) return fail("Les coordonnées sont incomplètes.");
  const extra = unknownField(raw, ["email", "street", "postalCode", "city"]);
  if (extra) return extra;

  const email = text(raw.email, "email", "L'adresse e-mail", CONTACT_EMAIL_MAX);
  if (failed(email)) return email;
  if (!EMAIL_PATTERN.test(email)) {
    return fail("L'adresse e-mail n'est pas valide.", "email");
  }
  const street = text(raw.street, "street", "L'adresse", CONTACT_STREET_MAX);
  if (failed(street)) return street;
  const postalCode = text(raw.postalCode, "postalCode", "Le code postal", 5);
  if (failed(postalCode)) return postalCode;
  if (!POSTAL_CODE_PATTERN.test(postalCode)) {
    return fail("Le code postal a cinq chiffres.", "postalCode");
  }
  const city = text(raw.city, "city", "La ville", CONTACT_CITY_MAX);
  if (failed(city)) return city;

  return { ok: true, value: { email, street, postalCode, city } };
}

function parseSocialLinks(raw: unknown): SiteSettingResult<"social_links"> {
  if (!isRecord(raw) || !Array.isArray(raw.links)) {
    return fail("La liste des réseaux sociaux est illisible.");
  }
  const extra = unknownField(raw, ["links"]);
  if (extra) return extra;

  const links: SocialLink[] = [];
  for (const item of raw.links) {
    if (!isRecord(item)) return fail("Un réseau social est illisible.");
    const extraField = unknownField(item, ["network", "url"]);
    if (extraField) return extraField;
    const network = item.network;
    if (!SOCIAL_NETWORKS.includes(network as SocialNetwork)) {
      return fail("Réseau social inconnu.");
    }
    const name = network as SocialNetwork;
    const label = SOCIAL_NETWORK_LABELS[name];
    if (links.some((link) => link.network === name)) {
      return fail(`${label} est en double.`, `links.${name}`);
    }
    const url = text(
      item.url,
      `links.${name}`,
      `Le lien ${label}`,
      SOCIAL_URL_MAX,
    );
    if (failed(url)) return url;
    if (!httpsUrlOn(url, SOCIAL_HOSTS[name])) {
      return fail(
        `Le lien ${label} doit commencer par https://${SOCIAL_HOSTS[name][0]}/`,
        `links.${name}`,
      );
    }
    links.push({ network: name, url });
  }
  return { ok: true, value: { links } };
}

function parseDonations(raw: unknown): SiteSettingResult<"donations"> {
  if (!isRecord(raw)) return fail("Les dons sont illisibles.");
  const extra = unknownField(raw, ["helloassoUrl", "tiers", "defaultAmount"]);
  if (extra) return extra;

  const helloassoUrl = text(
    raw.helloassoUrl,
    "helloassoUrl",
    "Le lien HelloAsso",
    HELLOASSO_URL_MAX,
  );
  if (failed(helloassoUrl)) return helloassoUrl;
  if (!httpsUrlOn(helloassoUrl, HELLOASSO_HOSTS)) {
    return fail(
      "Le lien HelloAsso doit commencer par https://www.helloasso.com/",
      "helloassoUrl",
    );
  }

  if (!Array.isArray(raw.tiers) || raw.tiers.length === 0) {
    return fail("Il faut au moins un montant.", "tiers");
  }
  if (raw.tiers.length > DONATION_TIERS_MAX) {
    return fail(`${DONATION_TIERS_MAX} montants au plus.`, "tiers");
  }
  const tiers: DonationTier[] = [];
  for (const [index, item] of raw.tiers.entries()) {
    const at = `tiers.${index}`;
    if (!isRecord(item)) return fail("Un montant est illisible.", at);
    const extraField = unknownField(item, ["amount", "emoji", "description"]);
    if (extraField) return extraField;
    const amount = item.amount;
    if (
      typeof amount !== "number" ||
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > DONATION_AMOUNT_MAX
    ) {
      return fail(
        `Un montant est un nombre entier d'euros, de 1 à ${DONATION_AMOUNT_MAX.toLocaleString("fr-FR")}.`,
        `${at}.amount`,
      );
    }
    if (tiers.some((tier) => tier.amount === amount)) {
      return fail(`Le montant ${amount} € est en double.`, `${at}.amount`);
    }
    const emoji = text(
      item.emoji,
      `${at}.emoji`,
      "L'emoji",
      DONATION_EMOJI_MAX,
    );
    if (failed(emoji)) return emoji;
    const description = text(
      item.description,
      `${at}.description`,
      "La description",
      DONATION_DESCRIPTION_MAX,
    );
    if (failed(description)) return description;
    tiers.push({ amount, emoji, description });
  }

  const defaultAmount = raw.defaultAmount;
  if (!tiers.some((tier) => tier.amount === defaultAmount)) {
    return fail(
      "Le montant choisi à l'ouverture doit être l'un des montants.",
      "defaultAmount",
    );
  }
  return {
    ok: true,
    value: { helloassoUrl, tiers, defaultAmount: defaultAmount as number },
  };
}

const JOINING_LABELS: Record<JoiningFactKey, string> = {
  intro: "La présentation",
  where: "Les lieux",
  when: "Les horaires",
  ages: "Les âges",
  audition: "L'audition",
  readingMusic: "La lecture de la musique",
  fee: "La cotisation",
  anyTime: "L'inscription",
};

function parseJoining(raw: unknown): SiteSettingResult<"joining"> {
  if (!isRecord(raw))
    return fail("Les informations Rejoindre sont illisibles.");
  const extra = unknownField(raw, JOINING_FACT_KEYS);
  if (extra) return extra;

  const value = {} as JoiningSetting;
  for (const key of JOINING_FACT_KEYS) {
    const fact = text(raw[key], key, JOINING_LABELS[key], JOINING_FACT_MAX);
    if (failed(fact)) return fact;
    value[key] = fact;
  }
  return { ok: true, value };
}

function parseLegalNotice(raw: unknown): SiteSettingResult<"legal_notice"> {
  if (!isRecord(raw)) return fail("Les mentions légales sont illisibles.");
  const extra = unknownField(raw, [
    "publicationDirector",
    "publisherPhone",
    "siret",
    "registry",
  ]);
  if (extra) return extra;

  const publicationDirector = text(
    raw.publicationDirector,
    "publicationDirector",
    "Le nom de la direction de la publication",
    LEGAL_NAME_MAX,
  );
  if (failed(publicationDirector)) return publicationDirector;
  const publisherPhone = text(
    raw.publisherPhone,
    "publisherPhone",
    "Le téléphone",
    LEGAL_PHONE_MAX,
  );
  if (failed(publisherPhone)) return publisherPhone;
  if (!PHONE_PATTERN.test(publisherPhone)) {
    return fail(
      "Le téléphone ne contient que des chiffres, des espaces et éventuellement +33.",
      "publisherPhone",
    );
  }
  const siret = text(raw.siret, "siret", "Le SIRET", 20);
  if (failed(siret)) return siret;
  if (!SIRET_PATTERN.test(siret.replace(/\s/g, ""))) {
    return fail("Le SIRET a 14 chiffres.", "siret");
  }
  let registry: string | null = null;
  if (raw.registry !== null && raw.registry !== undefined) {
    if (typeof raw.registry !== "string") {
      return fail("Le registre est illisible.", "registry");
    }
    const trimmed = raw.registry.trim();
    if (trimmed.length > LEGAL_REGISTRY_MAX) {
      return fail(
        `Le registre : ${LEGAL_REGISTRY_MAX} caractères au plus.`,
        "registry",
      );
    }
    registry = trimmed === "" ? null : trimmed;
  }
  return {
    ok: true,
    value: { publicationDirector, publisherPhone, siret, registry },
  };
}

const PARSERS: {
  [K in SiteSettingKey]: (raw: unknown) => SiteSettingResult<K>;
} = {
  contact: parseContact,
  social_links: parseSocialLinks,
  donations: parseDonations,
  joining: parseJoining,
  legal_notice: parseLegalNotice,
};

export function isSiteSettingKey(key: unknown): key is SiteSettingKey {
  return SITE_SETTING_KEYS.includes(key as SiteSettingKey);
}

/**
 * Checks a setting's value: the normalised value (strings trimmed, an empty
 * registry as null), or the first problem in plain French.
 */
export function parseSiteSetting<K extends SiteSettingKey>(
  key: K,
  raw: unknown,
): SiteSettingResult<K> {
  return PARSERS[key](raw);
}

/**
 * Every setting from the table's rows, each key falling back to its default
 * when its row is missing or no longer valid (`invalid` names those).
 */
export function readSiteSettings(
  rows: readonly { key: string; value: unknown }[],
): { settings: SiteSettings; invalid: SiteSettingKey[] } {
  const settings: SiteSettings = { ...DEFAULT_SITE_SETTINGS };
  const invalid: SiteSettingKey[] = [];
  for (const row of rows) {
    if (!isSiteSettingKey(row.key)) continue;
    const key = row.key;
    const parsed = parseSiteSetting(key, row.value);
    if (parsed.ok) {
      (settings as Record<SiteSettingKey, unknown>)[key] = parsed.value;
    } else {
      invalid.push(key);
    }
  }
  return { settings, invalid };
}

/** The registered office on one line, as the legal notice and llms.txt show it. */
export function contactAddressLine(contact: ContactSetting): string {
  return `${contact.street}, ${contact.postalCode} ${contact.city}, France`;
}
