import {
  GROUP_TYPES,
  LlmExtractionSchema,
  type GoogleCalendarEvent,
  type LlmExtraction,
} from "./types.ts";
import { isAllDayEvent } from "./datetime.ts";
import { applyPlaceRules, knownPlacesPrompt } from "./place-rules.ts";

const OPENAI_CHAT_COMPLETIONS_URL =
  "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";
export const LLM_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;

const systemPrompt = `Tu es un extracteur de données pour un chœur francophone (Le Bon Temperament).
À partir d'un événement Google Calendar, tu dois D'ABORD déterminer si l'événement
est une RÉPÉTITION, puis extraire name, place et group_type.

Règle de classification (is_rehearsal):
- is_rehearsal = true UNIQUEMENT pour une répétition (travail musical de préparation).
  Indices: "répétition", "répét", "raccord", "filage", "atelier", "italienne",
  "mise en place", "travail des pupitres", "Dimanche BT" (souvent journée entière).
- is_rehearsal = false pour tout le reste, notamment:
  - les CONCERTS, représentations, spectacles, auditions publiques, prestations.
  - les sorties, réunions, assemblées générales (AG), apéros, repas, événements
    administratifs ou sociaux.
  En cas de doute entre "concert" et "répétition", choisis false.

Règles d'extraction (toujours remplir name, place et group_type, même si is_rehearsal = false):
- Réponds en JSON valide conforme au schéma fourni.
- name: titre court en français, sans date ni heure. Ex: "Répétition générale", "Répétition hommes".
- place: lieu physique, court, SANS le numéro de salle. Utilise location si présent, sinon description, sinon "À confirmer".
- address: adresse postale COMPLÈTE du lieu (numéro, rue, code postal, commune) pour l'application de cartes.
  - Recopie l'adresse si elle figure dans location ou description (sans le numéro de salle).
  - Sinon, ne donne une adresse que pour un lieu public que tu connais avec certitude (ex. Conservatoire de Strasbourg).
  - Si location ne contient qu'un village ou un lieu que tu ne connais pas avec certitude, mets "". N'invente JAMAIS un numéro ni une rue.
- room: numéro ou nom de salle À L'INTÉRIEUR du bâtiment (ex. "Salle 12", "Salle B104"), tel qu'écrit dans summary, location ou description; "" s'il n'y en a pas.
  Un lieu nommé (« Salle des fêtes », « Salle Sainte-Cécile ») n'est PAS une salle au sens de room: il reste dans place.
- group_type: une des 6 valeurs enum. Indices:
  - "Orchestre"      → orchestre, instruments
  - "Hommes"         → hommes, ténors, basses
  - "Femmes"         → femmes, sopranos, altos
  - "Jeunes/Enfants" → jeunes, enfants
  - "Choeur complet" → chœur complet, mixte complet, "Dimanche BT"
  - "Tous"           → tous, général, ou si ambigu
- Lieux habituels du chœur (à appliquer quand location est vide ou ne donne que le village, sans numéro de rue):
${knownPlacesPrompt()}
  Si location contient déjà une adresse complète, garde-la.
- Ne devine pas une date ni une heure.
- Sois déterministe: même entrée → même sortie.

EXAMPLES (à remplacer par de vrais événements une fois fournis par l'équipe):

Exemple 1 (répétition):
  summary: "Répétition Hommes - Église St-Pierre"
  description: ""
  location: "Église Saint-Pierre, Paris"
  → { "is_rehearsal": true, "name": "Répétition Hommes", "place": "Église Saint-Pierre, Paris", "address": "", "room": "", "group_type": "Hommes" }

Exemple 2 (répétition):
  summary: "Répétition générale orchestre + chœur"
  description: "Salle paroissiale, accès cour"
  location: ""
  → { "is_rehearsal": true, "name": "Répétition générale", "place": "Salle paroissiale", "address": "", "room": "", "group_type": "Choeur complet" }

Exemple 3 (répétition):
  summary: "Atelier jeunes choristes"
  description: ""
  location: "Salle Sainte-Cécile"
  → { "is_rehearsal": true, "name": "Atelier jeunes choristes", "place": "Salle Sainte-Cécile", "address": "", "room": "", "group_type": "Jeunes/Enfants" }

Exemple 4 (concert → exclu):
  summary: "Concert de Noël"
  description: "Entrée libre"
  location: "Cathédrale"
  → { "is_rehearsal": false, "name": "Concert de Noël", "place": "Cathédrale", "address": "", "room": "", "group_type": "Tous" }

Exemple 5 (réunion → exclu):
  summary: "Assemblée générale annuelle"
  description: ""
  location: "Salle paroissiale"
  → { "is_rehearsal": false, "name": "Assemblée générale annuelle", "place": "Salle paroissiale", "address": "", "room": "", "group_type": "Tous" }

Exemple 6 (Dimanche BT, journée entière → répétition):
  summary: "Dimanche BT à Église Saint-Pierre"
  description: ""
  location: "Église Saint-Pierre"
  start/end: journée entière (all-day)
  → { "is_rehearsal": true, "name": "Dimanche BT", "place": "Église Saint-Pierre", "address": "", "room": "", "group_type": "Choeur complet" }

Exemple 7 (orchestre au Conservatoire, avec salle):
  summary: "Répétition orchestre"
  description: ""
  location: "Conservatoire de Strasbourg, salle 12"
  → { "is_rehearsal": true, "name": "Répétition orchestre", "place": "Conservatoire de Strasbourg", "address": "Conservatoire de Strasbourg, 1 place Dauphine, 67000 Strasbourg", "room": "Salle 12", "group_type": "Orchestre" }

Exemple 8 (village seul, lieu habituel):
  summary: "Répétition femmes"
  description: ""
  location: "Nordheim"
  → { "is_rehearsal": true, "name": "Répétition femmes", "place": "Salle des fêtes, Nordheim", "address": "Salle des fêtes, place de la Mairie, 67520 Nordheim", "room": "", "group_type": "Femmes" }`;

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

function userPrompt(event: GoogleCalendarEvent): string {
  const allDay = isAllDayEvent(event.start);
  const startLabel = allDay
    ? `${event.start?.date ?? ""} (journée entière, Europe/Paris)`
    : `${event.start?.dateTime ?? ""} (Europe/Paris)`;
  const endLabel = allDay
    ? `${event.end?.date ?? ""} (journée entière, Europe/Paris)`
    : `${event.end?.dateTime ?? ""} (Europe/Paris)`;

  return [
    `summary: ${event.summary ?? ""}`,
    `description: ${event.description ?? ""}`,
    `location: ${event.location ?? ""}`,
    `all_day: ${allDay}`,
    `start: ${startLabel}`,
    `end: ${endLabel}`,
  ].join("\n");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callOpenAI(
  apiKey: string,
  event: GoogleCalendarEvent,
  timeoutMs: number,
): Promise<unknown> {
  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    // Covers the connection and the body read, so a stalled call cannot hang.
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      seed: 42,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt(event) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "rehearsal_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              is_rehearsal: {
                type: "boolean",
                description:
                  "true uniquement si l'événement est une répétition; false pour les concerts, réunions, sorties, etc.",
              },
              name: {
                type: "string",
                description: "Intitulé court de la répétition en français",
              },
              place: {
                type: "string",
                description:
                  "Lieu physique (ex: Église Saint-Pierre, Salle paroissiale)",
              },
              address: {
                type: "string",
                description:
                  "Adresse postale complète pour la carte (numéro, rue, code postal, commune); chaîne vide si inconnue",
              },
              room: {
                type: "string",
                description:
                  "Salle à l'intérieur du bâtiment (ex: Salle 12); chaîne vide s'il n'y en a pas",
              },
              group_type: {
                type: "string",
                enum: GROUP_TYPES,
              },
            },
            required: [
              "is_rehearsal",
              "name",
              "place",
              "address",
              "room",
              "group_type",
            ],
            additionalProperties: false,
          },
        },
      },
      max_tokens: 400,
    }),
  });

  const body = (await response.json()) as ChatCompletionResponse;
  if (!response.ok) {
    throw new Error(
      body.error?.message ?? `OpenAI request failed: ${response.status}`,
    );
  }

  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response did not include message content.");
  }

  return JSON.parse(content);
}

function logLlm(event: string, data: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      source: "llm",
      event,
      ...data,
    }),
  );
}

export interface ExtractOptions {
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

/**
 * A « Dimanche BT » is the full choir's rehearsal day, not the orchestra's:
 * always « Choeur complet », whatever the LLM answered. A « Répétition extra »
 * is the full choir's too, unless the title names another group (then the
 * LLM's answer stands; it only turns the ambiguous « Tous » into the choir).
 */
export function applyGroupRules(
  event: GoogleCalendarEvent,
  result: LlmExtraction,
): LlmExtraction {
  if (result.is_rehearsal && /\bdimanche\s+bt\b/i.test(event.summary ?? "")) {
    return { ...result, group_type: "Choeur complet" };
  }
  if (
    result.is_rehearsal &&
    result.group_type === "Tous" &&
    /\bextra\b/i.test(event.summary ?? "")
  ) {
    return { ...result, group_type: "Choeur complet" };
  }
  return result;
}

export async function extractRehearsalFields(
  apiKey: string,
  event: GoogleCalendarEvent,
  options: ExtractOptions = {},
): Promise<LlmExtraction> {
  const timeoutMs = options.timeoutMs ?? LLM_TIMEOUT_MS;
  const wait = options.sleep ?? sleep;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      logLlm("request", {
        event_id: event.id,
        attempt: attempt + 1,
        summary: event.summary ?? "",
      });

      const parsed = await callOpenAI(apiKey, event, timeoutMs);
      const result = applyPlaceRules(
        event,
        applyGroupRules(event, LlmExtractionSchema.parse(parsed)),
      );

      logLlm("classified", {
        event_id: event.id,
        summary: event.summary ?? "",
        is_rehearsal: result.is_rehearsal,
        name: result.name,
        group_type: result.group_type,
        has_address: result.address !== "",
        room: result.room,
      });

      return result;
    } catch (error) {
      lastError = isTimeout(error)
        ? new Error(`OpenAI request timed out after ${timeoutMs} ms.`)
        : error;
      logLlm("attempt_failed", {
        event_id: event.id,
        attempt: attempt + 1,
        timed_out: isTimeout(error),
        message:
          lastError instanceof Error ? lastError.message : String(lastError),
      });

      if (attempt < MAX_ATTEMPTS - 1) {
        await wait(500 * 2 ** attempt);
      }
    }
  }

  logLlm("failed", {
    event_id: event.id,
    message: lastError instanceof Error ? lastError.message : String(lastError),
  });

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
