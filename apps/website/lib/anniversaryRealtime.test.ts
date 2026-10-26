// Run with `npm test -w website` (tsx, no framework, like apps/admin).
import type { AnniversaryPageData } from "@/types/anniversary";
import assert from "node:assert/strict";
import {
  ANNIVERSARY_AUDIO_MEMORY_COLUMNS,
  ANNIVERSARY_HERO_STAT_COLUMNS,
  ANNIVERSARY_NAVIGATION_CARD_COLUMNS,
  ANNIVERSARY_PHOTO_COLUMNS,
  ANNIVERSARY_TIMELINE_EVENT_COLUMNS,
  ANNIVERSARY_VIDEO_COLUMNS,
} from "./anniversaryColumns";
import { subscribeToAnniversaryChanges } from "./anniversaryRealtime";

type Client = Parameters<typeof subscribeToAnniversaryChanges>[0];

interface Listener {
  event: string;
  schema: string;
  table: string;
  callback: (payload: unknown) => unknown;
}

/** Records what the page registers on its channel. */
class FakeChannel {
  readonly listeners: Listener[] = [];
  subscribeCalls = 0;
  listenersAtSubscribe = -1;
  status?: (status: string, error?: Error) => void;

  constructor(readonly topic: string) {}

  on(
    type: string,
    filter: { event: string; schema: string; table: string },
    callback: (payload: unknown) => unknown,
  ) {
    assert.equal(type, "postgres_changes");
    this.listeners.push({ ...filter, callback });
    return this;
  }

  subscribe(status?: (status: string, error?: Error) => void) {
    this.subscribeCalls += 1;
    this.listenersAtSubscribe = this.listeners.length;
    this.status = status;
    return this;
  }

  /** Delivers one change to the listeners of a table; settles their work. */
  async fire(table: string, payload: unknown = {}) {
    const matching = this.listeners.filter((l) => l.table === table);
    await Promise.all(matching.map((l) => l.callback(payload)));
    return matching.length;
  }
}

interface Query {
  table: string;
  select?: string;
  eq?: [string, unknown];
  order?: [string, unknown];
}

/** A client whose reads answer from `rows` (a missing table reads null). */
function fakeClient(rows: Record<string, unknown[]> = {}) {
  const channels: FakeChannel[] = [];
  const removed: FakeChannel[] = [];
  const queries: Query[] = [];
  const client = {
    channel: (topic: string) => {
      const channel = new FakeChannel(topic);
      channels.push(channel);
      return channel;
    },
    removeChannel: async (channel: FakeChannel) => {
      removed.push(channel);
      return "ok";
    },
    from: (table: string) => {
      const query: Query = { table };
      queries.push(query);
      const builder = {
        select: (columns: string) => {
          query.select = columns;
          return builder;
        },
        eq: (column: string, value: unknown) => {
          query.eq = [column, value];
          return builder;
        },
        order: async (column: string, options: unknown) => {
          query.order = [column, options];
          return { data: rows[table] ?? null, error: null };
        },
      };
      return builder;
    },
  };
  return { client: client as unknown as Client, channels, removed, queries };
}

const BASE: AnniversaryPageData = {
  hero: {
    hero_number: "40",
    hero_subtitle: "ans",
    description: "Quarante ans de musique.",
    cta_text: "Découvrir",
    cta_target_section: "contents",
    enable_intro_animation: false,
    skip_button_text: "Passer",
  },
  heroStats: [],
  navigationCards: [],
  timelineEvents: [],
  videos: [],
  audioMemories: [],
  photos: [],
  formConfig: {
    section_title: "Livre d’or",
    section_description: "Partagez un souvenir.",
    name_label: "Nom",
    email_label: "E-mail",
    message_label: "Message",
    year_label: "Année",
    submit_button_text: "Envoyer",
    success_message: "Merci !",
    is_enabled: true,
  },
  featuredMemories: [],
};

/** Applies the updaters the page hands to `setData`. */
function recorder() {
  let current = BASE;
  let count = 0;
  return {
    update: (updater: (prev: AnniversaryPageData) => AnniversaryPageData) => {
      current = updater(current);
      count += 1;
    },
    get current() {
      return current;
    },
    get count() {
      return count;
    },
  };
}

// Rows as the database returns them: the public columns plus the
// `is_visible` filter, which must not reach the page.
const ROWS = {
  anniversary_hero_stats: [
    {
      id: "stat-1",
      icon_name: "music",
      number: "40",
      label: "ans de musique",
      display_order: 1,
      is_visible: true,
    },
  ],
  anniversary_navigation_cards: [
    {
      id: "card-1",
      title: "Histoire",
      description: "Quarante saisons",
      icon_name: "book",
      target_section_id: "seasons",
      display_order: 1,
      is_visible: true,
    },
  ],
  anniversary_timeline_events: [
    {
      id: "event-1",
      year: 1986,
      title: "Fondation",
      description: "Premier concert",
      icon_name: "star",
      display_order: 1,
      is_visible: true,
    },
  ],
  anniversary_videos: [
    {
      id: "video-1",
      title: "Concert de test",
      description: "Un extrait",
      thumbnail_url: "https://example.com/video.jpg",
      video_url: null,
      year: 2000,
      category: "concert",
      display_order: 1,
      is_visible: true,
    },
  ],
  anniversary_audio_memories: [
    {
      id: "audio-1",
      title: "Souvenir sonore",
      description: "Témoignage fictif",
      speaker_name: "Prénom NOM",
      year: null,
      duration: "1:00",
      audio_url: "https://example.com/audio.mp3",
      display_order: 1,
      is_visible: true,
    },
  ],
  anniversary_photos: [
    {
      id: "photo-1",
      title: "Photo de test",
      description: null,
      year: 1999,
      category: "concert",
      image_url: "https://example.com/photo.jpg",
      display_order: 1,
      is_visible: true,
    },
  ],
};

const REFETCHED: ReadonlyArray<
  readonly [keyof typeof ROWS, string, keyof AnniversaryPageData]
> = [
  ["anniversary_hero_stats", ANNIVERSARY_HERO_STAT_COLUMNS, "heroStats"],
  [
    "anniversary_navigation_cards",
    ANNIVERSARY_NAVIGATION_CARD_COLUMNS,
    "navigationCards",
  ],
  [
    "anniversary_timeline_events",
    ANNIVERSARY_TIMELINE_EVENT_COLUMNS,
    "timelineEvents",
  ],
  ["anniversary_videos", ANNIVERSARY_VIDEO_COLUMNS, "videos"],
  [
    "anniversary_audio_memories",
    ANNIVERSARY_AUDIO_MEMORY_COLUMNS,
    "audioMemories",
  ],
  ["anniversary_photos", ANNIVERSARY_PHOTO_COLUMNS, "photos"],
];

const publicFields = (row: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(row).filter(([k]) => k !== "is_visible"));

const VISITOR_LISTENERS = [
  ["anniversary_hero", "UPDATE"],
  ["anniversary_hero_stats", "*"],
  ["anniversary_navigation_cards", "*"],
  ["anniversary_timeline_events", "*"],
  ["anniversary_videos", "*"],
  ["anniversary_audio_memories", "*"],
  ["anniversary_photos", "*"],
  ["anniversary_form_config", "UPDATE"],
];

/** The item at `index`, which the test expects to exist. */
function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  assert.ok(item !== undefined, `item ${index} exists`);
  return item;
}

// A visitor's tab joins one channel that follows the eight public tables,
// never the memories table (RLS would deliver nothing to them anyway).
{
  const { client, channels, removed } = fakeClient();
  const stop = subscribeToAnniversaryChanges(client, {
    isPreview: false,
    update: () => {},
  });
  assert.equal(channels.length, 1, "one channel per tab");
  const channel = at(channels, 0);
  assert.deepEqual(
    channel.listeners.map((l) => [l.table, l.event]),
    VISITOR_LISTENERS,
  );
  assert.ok(channel.listeners.every((l) => l.schema === "public"));
  assert.equal(channel.subscribeCalls, 1, "joined once");
  assert.equal(
    channel.listenersAtSubscribe,
    VISITOR_LISTENERS.length,
    "every listener is registered before the join",
  );
  assert.equal(await channel.fire("anniversary_memories"), 0);

  assert.deepEqual(removed, [], "nothing removed before cleanup");
  stop();
  assert.equal(removed.length, 1, "cleanup removes the channel");
  assert.equal(at(removed, 0), channel, "the channel it joined");
}

// The admin preview follows the memories table too, on the same channel,
// and each subscription gets a topic of its own.
{
  const { client, channels } = fakeClient();
  subscribeToAnniversaryChanges(client, { isPreview: true, update: () => {} });
  subscribeToAnniversaryChanges(client, { isPreview: true, update: () => {} });
  assert.equal(channels.length, 2);
  const preview = at(channels, 0);
  assert.deepEqual(
    preview.listeners.map((l) => [l.table, l.event]),
    [...VISITOR_LISTENERS, ["anniversary_memories", "*"]],
  );
  assert.equal(preview.listenersAtSubscribe, VISITOR_LISTENERS.length + 1);
  assert.ok(preview.topic.startsWith("anniversary-page-"));
  assert.notEqual(preview.topic, at(channels, 1).topic, "distinct topics");
}

// Handlers: singletons take the row from the payload, lists refetch the
// visible rows in display order with the public columns only.
{
  const { client, channels, queries } = fakeClient(ROWS);
  const state = recorder();
  subscribeToAnniversaryChanges(client, {
    isPreview: true,
    update: state.update,
  });
  const channel = at(channels, 0);

  const hero = { ...BASE.hero, hero_number: "41" };
  await channel.fire("anniversary_hero", { eventType: "UPDATE", new: hero });
  assert.deepEqual(state.current.hero, hero);

  const formConfig = { ...BASE.formConfig, is_enabled: false };
  await channel.fire("anniversary_form_config", {
    eventType: "UPDATE",
    new: formConfig,
  });
  assert.deepEqual(state.current.formConfig, formConfig);

  for (const [table, columns, key] of REFETCHED) {
    const before = queries.length;
    await channel.fire(table, { eventType: "INSERT" });
    assert.equal(queries.length, before + 1, `${table} refetches once`);
    assert.deepEqual(at(queries, before), {
      table,
      select: columns,
      eq: ["is_visible", true],
      order: ["display_order", { ascending: true }],
    });
    assert.deepEqual(state.current[key], ROWS[table].map(publicFields));
  }

  // One table's change leaves the other sections as they were.
  assert.deepEqual(state.current.hero, hero);
  assert.deepEqual(state.current.formConfig, formConfig);
  assert.deepEqual(state.current.featuredMemories, []);
  assert.equal(state.count, 2 + REFETCHED.length);
}

// A refetch that returns nothing keeps what the page already shows.
{
  const { client, channels } = fakeClient();
  const state = recorder();
  subscribeToAnniversaryChanges(client, {
    isPreview: false,
    update: state.update,
  });
  await at(channels, 0).fire("anniversary_photos");
  assert.equal(state.count, 0);
  assert.deepEqual(state.current, BASE);
}

// Memories go through the server route, which applies the page's gate and
// returns the public columns; a failed call changes nothing.
{
  const memories = [
    {
      id: "memory-1",
      name: "Prénom NOM",
      message: "Un souvenir de test.",
      year: 1999,
      is_featured: true,
      created_at: "2026-01-01T00:00:00Z",
    },
  ];
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  const fetched: string[] = [];
  let errors = 0;
  console.error = () => {
    errors += 1;
  };
  try {
    const { client, channels } = fakeClient();
    const state = recorder();
    subscribeToAnniversaryChanges(client, {
      isPreview: true,
      update: state.update,
    });
    const channel = at(channels, 0);

    globalThis.fetch = (async (input: string | URL | Request) => {
      fetched.push(String(input));
      return Response.json({ memories });
    }) as typeof fetch;
    assert.equal(await channel.fire("anniversary_memories"), 1);
    assert.deepEqual(fetched, ["/api/anniversary/featured-memories"]);
    assert.deepEqual(state.current.featuredMemories, memories);
    assert.equal(state.count, 1);

    globalThis.fetch = (async () =>
      new Response("", { status: 404 })) as typeof fetch;
    await channel.fire("anniversary_memories");
    assert.equal(state.count, 1, "a refused call changes nothing");

    globalThis.fetch = (async () => {
      throw new Error("offline");
    }) as typeof fetch;
    await channel.fire("anniversary_memories");
    assert.equal(state.count, 1, "a failed call changes nothing");
    assert.equal(errors, 1, "and is logged");

    // The join's status callback logs a failed or timed-out join only.
    channel.status?.("SUBSCRIBED");
    assert.equal(errors, 1);
    channel.status?.("CHANNEL_ERROR", new Error("fixture"));
    channel.status?.("TIMED_OUT");
    assert.equal(errors, 3);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }
}

console.log("anniversaryRealtime: all assertions passed");
