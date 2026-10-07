// Asks OpenAI for the event data Google needs (venue, address, free or
// price) from what the admin typed and from the poster, then keeps only
// plausible values. The model is told to answer null rather than guess; the
// checks below drop what it got wrong anyway (a malformed postal code, a
// negative price, a price on a free concert).
import { z } from "npm:zod@3.25.76";

const OPENAI_CHAT_COMPLETIONS_URL =
  "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
export const LLM_TIMEOUT_MS = 30_000;

export interface ConcertInput {
  name: string | null;
  place: string;
  date: string;
  time: string;
  additional_informations: string | null;
  related_link: string | null;
  affiche: string | null;
  tour_name: string | null;
}

export interface EventData {
  venue_name: string | null;
  street_address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  is_free: boolean | null;
  price: number | null;
}

const nullableString = z.string().nullable();

export const STREET_SOURCES = ["saisie", "affiche"] as const;

export const LlmEventDataSchema = z.object({
  venue_name: nullableString,
  street_address: nullableString,
  street_address_source: z.enum(STREET_SOURCES).nullable(),
  postal_code: nullableString,
  city: nullableString,
  country: nullableString,
  is_free: z.boolean().nullable(),
  price: z.number().nullable(),
});

export const systemPrompt = `Tu prépares les données d'événement (schema.org MusicEvent) d'un concert du Bon Tempérament, chœur et orchestre amateur basé en Alsace (région de Saverne et Strasbourg), pour que Google affiche le concert dans ses résultats.

Tu reçois ce que l'administrateur a saisi (titre, lieu, informations complémentaires, lien) et parfois l'affiche du concert en image. Réponds en JSON conforme au schéma.

Règles, dans l'ordre d'importance :
1. N'invente rien. Une valeur fausse sur Google est pire qu'une valeur absente : en cas de doute, réponds null.
2. venue_name : le nom de la salle ou de l'église, sans la ville. Ex. « Église Saint-Paul », « Abbatiale Saint-Pierre-et-Saint-Paul », « MAC Robert Lieb ».
3. city : la commune où se trouve la salle, avec son orthographe officielle (ex. « Neuwiller-lès-Saverne »). Pour un quartier, donne la commune (« Strasbourg » pour Koenigshoffen). Si le lieu ne nomme pas la commune, déduis-la seulement si la salle est connue et unique (sinon null).
4. postal_code : le code postal de la commune, seulement s'il est écrit dans les données ou sur l'affiche, ou si la commune n'a qu'un seul code postal que tu connais avec certitude. Sinon null (Strasbourg, par exemple, en a plusieurs).
5. street_address : le numéro et la rue, UNIQUEMENT s'ils sont écrits dans les données saisies ou sur l'affiche. Ne les déduis jamais de ta mémoire. street_address_source dit où tu les as lus : « saisie » (titre, lieu, informations), « affiche », ou null quand street_address est null.
6. country : code ISO à deux lettres en majuscules (« FR », « DE »…). « FR » quand la commune est en France.
7. is_free : true si l'entrée est libre ou gratuite, y compris « entrée libre, plateau » ou « libre participation » ; false si un tarif ou une billetterie payante est indiqué ; null si rien ne le dit.
8. price : quand l'entrée est payante, le plein tarif adulte en euros (nombre, ex. 15). null si gratuit ou si aucun montant n'est indiqué.`;

export function userPrompt(concert: ConcertInput): string {
  return [
    `titre: ${concert.name ?? ""}`,
    `lieu: ${concert.place}`,
    `date: ${concert.date} ${concert.time.slice(0, 5)} (Europe/Paris)`,
    `tournée: ${concert.tour_name ?? ""}`,
    `informations complémentaires: ${concert.additional_informations ?? ""}`,
    `lien: ${concert.related_link ?? ""}`,
    concert.affiche ? "affiche: jointe en image" : "affiche: aucune",
  ].join("\n");
}

const nullable = (type: string, description: string) => ({
  type: [type, "null"],
  description,
});

const RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "concert_event_data",
    strict: true,
    schema: {
      type: "object",
      properties: {
        venue_name: nullable("string", "Nom de la salle, sans la ville"),
        street_address: nullable(
          "string",
          "Numéro et rue, seulement s'ils sont écrits",
        ),
        street_address_source: {
          type: ["string", "null"],
          enum: [...STREET_SOURCES, null],
          description: "Où le numéro et la rue sont écrits",
        },
        postal_code: nullable("string", "Code postal"),
        city: nullable("string", "Commune"),
        country: nullable("string", "Code pays ISO à deux lettres"),
        is_free: nullable("boolean", "Entrée libre ou gratuite"),
        price: nullable("number", "Plein tarif adulte en euros"),
      },
      required: [
        "venue_name",
        "street_address",
        "street_address_source",
        "postal_code",
        "city",
        "country",
        "is_free",
        "price",
      ],
      additionalProperties: false,
    },
  },
};

/** Only posters served over https are sent; OpenAI downloads them itself. */
export function posterUrl(affiche: string | null): string | null {
  if (!affiche) return null;
  try {
    const url = new URL(affiche);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function buildRequestBody(
  concert: ConcertInput,
  model: string,
  withPoster: boolean,
): Record<string, unknown> {
  const poster = withPoster ? posterUrl(concert.affiche) : null;
  const text = userPrompt({ ...concert, affiche: poster });
  return {
    model,
    temperature: 0,
    seed: 42,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: poster
          ? [
              { type: "text", text },
              { type: "image_url", image_url: { url: poster, detail: "high" } },
            ]
          : text,
      },
    ],
    response_format: RESPONSE_FORMAT,
    max_tokens: 300,
  };
}

const clean = (value: string | null, max = 200): string | null => {
  const trimmed = value?.replace(/\s+/g, " ").trim() ?? "";
  return trimmed && trimmed.length <= max ? trimmed : null;
};

const normalized = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * A street address is kept only when the model says where it read it, and,
 * when that is the admin's own text, only when the text really contains it:
 * an address recalled from the model's memory never reaches Google.
 */
export function trustedStreet(
  street: string | null,
  source: (typeof STREET_SOURCES)[number] | null,
  typed: string,
): string | null {
  if (!street || !source) return null;
  if (source === "affiche") return street;
  return normalized(typed).includes(normalized(street)) ? street : null;
}

/**
 * Keeps what is plausible; anything else becomes null. `typed` is what the
 * admin wrote (title, place, informations), to check a street address read
 * from it.
 */
export function sanitize(
  raw: z.infer<typeof LlmEventDataSchema>,
  typed = "",
): EventData {
  const country = clean(raw.country)?.toUpperCase() ?? null;
  const validCountry = country && /^[A-Z]{2}$/.test(country) ? country : null;

  const postal = clean(raw.postal_code)?.replace(/\s/g, "") ?? null;
  // France and Germany both use five digits, and nearly every concert is in
  // France: without a valid country, five digits too. Elsewhere a short code.
  const validPostal =
    postal &&
    (validCountry === null || validCountry === "FR" || validCountry === "DE"
      ? /^\d{5}$/.test(postal)
      : /^[A-Z0-9-]{3,10}$/i.test(postal))
      ? postal
      : null;

  const isFree = raw.is_free;
  const price =
    isFree !== true &&
    typeof raw.price === "number" &&
    Number.isFinite(raw.price) &&
    raw.price > 0 &&
    raw.price <= 1000
      ? Math.round(raw.price * 100) / 100
      : null;

  return {
    venue_name: clean(raw.venue_name),
    street_address: trustedStreet(
      clean(raw.street_address),
      raw.street_address_source,
      typed,
    ),
    postal_code: validPostal,
    city: clean(raw.city, 100),
    country: validCountry,
    // A price means paid even when the model left is_free empty.
    is_free: isFree ?? (price !== null ? false : null),
    price,
  };
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string; code?: string };
}

export class OpenAiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function callOpenAI(
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<unknown> {
  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as ChatCompletionResponse;
  if (!response.ok) {
    throw new OpenAiError(
      payload.error?.message ?? `OpenAI request failed: ${response.status}`,
      response.status,
    );
  }
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI response did not include content.");
  return JSON.parse(content);
}

export interface ExtractOptions {
  model?: string;
  timeoutMs?: number;
}

/**
 * One call with the poster when there is one. If OpenAI refuses the request
 * (400: typically a poster it cannot download or read), one more call
 * without it, so a broken image never blocks the address and the price
 * written in the text.
 */
export async function extractEventData(
  apiKey: string,
  concert: ConcertInput,
  options: ExtractOptions = {},
): Promise<{ data: EventData; usedPoster: boolean }> {
  const model = options.model ?? DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? LLM_TIMEOUT_MS;
  const hasPoster = posterUrl(concert.affiche) !== null;
  const typed = [
    concert.name,
    concert.place,
    concert.additional_informations,
  ].join(" ");

  try {
    const raw = await callOpenAI(
      apiKey,
      buildRequestBody(concert, model, hasPoster),
      timeoutMs,
    );
    return {
      data: sanitize(LlmEventDataSchema.parse(raw), typed),
      usedPoster: hasPoster,
    };
  } catch (error) {
    if (!(hasPoster && error instanceof OpenAiError && error.status === 400)) {
      throw error;
    }
    const raw = await callOpenAI(
      apiKey,
      buildRequestBody(concert, model, false),
      timeoutMs,
    );
    return {
      data: sanitize(LlmEventDataSchema.parse(raw), typed),
      usedPoster: false,
    };
  }
}
