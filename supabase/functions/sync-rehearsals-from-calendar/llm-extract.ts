import {
  GROUP_TYPES,
  LlmExtractionSchema,
  type GoogleCalendarEvent,
  type LlmExtraction,
} from "./types.ts";
import { isAllDayEvent } from "./datetime.ts";

const OPENAI_CHAT_COMPLETIONS_URL =
  "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

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
- place: lieu physique. Utilise location si présent, sinon description, sinon "À confirmer".
- group_type: une des 6 valeurs enum. Indices:
  - "Orchestre"      → orchestre, instruments
  - "Hommes"         → hommes, ténors, basses
  - "Femmes"         → femmes, sopranos, altos
  - "Jeunes/Enfants" → jeunes, enfants
  - "Choeur complet" → chœur complet, mixte complet
  - "Tous"           → tous, général, ou si ambigu
- Ne devine pas une date ni une heure.
- Sois déterministe: même entrée → même sortie.

EXAMPLES (à remplacer par de vrais événements une fois fournis par l'équipe):

Exemple 1 (répétition):
  summary: "Répétition Hommes - Église St-Pierre"
  description: ""
  location: "Église Saint-Pierre, Paris"
  → { "is_rehearsal": true, "name": "Répétition Hommes", "place": "Église Saint-Pierre, Paris", "group_type": "Hommes" }

Exemple 2 (répétition):
  summary: "Répétition générale orchestre + chœur"
  description: "Salle paroissiale, accès cour"
  location: ""
  → { "is_rehearsal": true, "name": "Répétition générale", "place": "Salle paroissiale", "group_type": "Choeur complet" }

Exemple 3 (répétition):
  summary: "Atelier jeunes choristes"
  description: ""
  location: "Salle Sainte-Cécile"
  → { "is_rehearsal": true, "name": "Atelier jeunes choristes", "place": "Salle Sainte-Cécile", "group_type": "Jeunes/Enfants" }

Exemple 4 (concert → exclu):
  summary: "Concert de Noël"
  description: "Entrée libre"
  location: "Cathédrale"
  → { "is_rehearsal": false, "name": "Concert de Noël", "place": "Cathédrale", "group_type": "Tous" }

Exemple 5 (réunion → exclu):
  summary: "Assemblée générale annuelle"
  description: ""
  location: "Salle paroissiale"
  → { "is_rehearsal": false, "name": "Assemblée générale annuelle", "place": "Salle paroissiale", "group_type": "Tous" }

Exemple 6 (Dimanche BT, journée entière → répétition):
  summary: "Dimanche BT à Église Saint-Pierre"
  description: ""
  location: "Église Saint-Pierre"
  start/end: journée entière (all-day)
  → { "is_rehearsal": true, "name": "Dimanche BT", "place": "Église Saint-Pierre", "group_type": "Tous" }`;

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
): Promise<unknown> {
  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
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
              group_type: {
                type: "string",
                enum: GROUP_TYPES,
              },
            },
            required: ["is_rehearsal", "name", "place", "group_type"],
            additionalProperties: false,
          },
        },
      },
      max_tokens: 300,
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

export async function extractRehearsalFields(
  apiKey: string,
  event: GoogleCalendarEvent,
): Promise<LlmExtraction> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      logLlm("request", {
        event_id: event.id,
        attempt: attempt + 1,
        summary: event.summary ?? "",
      });

      const parsed = await callOpenAI(apiKey, event);
      const result = LlmExtractionSchema.parse(parsed);

      logLlm("classified", {
        event_id: event.id,
        summary: event.summary ?? "",
        is_rehearsal: result.is_rehearsal,
        name: result.name,
        group_type: result.group_type,
      });

      return result;
    } catch (error) {
      lastError = error;
      logLlm("attempt_failed", {
        event_id: event.id,
        attempt: attempt + 1,
        message: error instanceof Error ? error.message : String(error),
      });

      if (attempt < 2) {
        await sleep(500 * 2 ** attempt);
      }
    }
  }

  logLlm("failed", {
    event_id: event.id,
    summary: event.summary ?? "",
    message: lastError instanceof Error ? lastError.message : String(lastError),
  });

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
