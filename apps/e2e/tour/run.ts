// Records the narrated admin tour: voices script-fr.md with ElevenLabs,
// films each scene on admin-dev (fake data) or, with --production, on the
// real admin with contacts blurred and every write blocked, and assembles
// the full video, one clip per chapter, and subtitles. See README.md.
import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  canBurnSubtitles,
  join,
  renderScene,
  renderTitleCard,
  subtitleCues,
  writeSrt,
} from "./lib/assemble.ts";
import {
  Camera,
  CURSOR_SCRIPT,
  Director,
  LEAD_IN,
  MASK_SCRIPT,
  TAIL,
} from "./lib/recorder.ts";
import { readScript } from "./lib/script.ts";
import {
  draftNarration,
  narrate,
  type Narration,
  type VoiceConfig,
} from "./lib/voice.ts";
import { shots } from "./scenes.ts";

const here = import.meta.dirname;

const { values: args } = parseArgs({
  options: {
    // Silent draft with estimated timings: no ElevenLabs credits spent.
    draft: { type: "boolean", default: false },
    // Comma-separated chapter numbers to render, e.g. « 2 » or « 0,1 ».
    chapters: { type: "string" },
    "no-subtitles": { type: "boolean", default: false },
    // Voice the script only (check the takes before filming).
    "voice-only": { type: "boolean", default: false },
    // Film the real admin with the account in prod-login.env: members'
    // contacts are blurred and every write request is blocked.
    production: { type: "boolean", default: false },
    script: { type: "string", default: path.join(here, "script-fr.md") },
    out: {
      type: "string",
      default:
        process.env.TOUR_OUT ??
        path.join(os.homedir(), "Movies", "lbt-admin-video"),
    },
  },
});

const config = path.join(os.homedir(), ".config", "lbt-admin-video");
// Production: the throwaway admin account, outside the repo. Staging: the
// same env files as the e2e suite (staging login, Vercel bypass). Both: the
// ElevenLabs key, outside the repo too. First file wins per key.
const envFiles = args.production
  ? [path.join(config, "prod-login.env")]
  : [
      path.join(here, "..", ".env.local"),
      path.join(here, "..", ".env"),
      path.join(here, "..", "..", "..", ".env.local"),
    ];
for (const file of [...envFiles, path.join(config, "elevenlabs.env")]) {
  if (!existsSync(file)) continue;
  for (const [key, value] of Object.entries(dotenv.parse(readFileSync(file)))) {
    if (value !== "" && process.env[key] === undefined)
      process.env[key] = value;
  }
}

const PRODUCTION = "https://admin.lebontemperament.com";
let baseURL: string;
if (args.production) {
  baseURL = PRODUCTION;
  if (!process.env.TOUR_EMAIL || !process.env.TOUR_PASSWORD) {
    throw new Error(
      `TOUR_EMAIL and TOUR_PASSWORD are missing from ${path.join(config, "prod-login.env")}.`,
    );
  }
} else {
  baseURL = process.env.ADMIN_URL || "https://admin-dev.lebontemperament.com";
  if (baseURL.startsWith(PRODUCTION)) {
    // Real members: only through --production, which blurs and blocks.
    throw new Error(
      "ADMIN_URL points to the production admin. Use --production instead.",
    );
  }
  process.env.TOUR_EMAIL ??= process.env.E2E_USER_EMAIL;
  process.env.TOUR_PASSWORD ??= process.env.E2E_USER_PASSWORD;
}

const chapters = readScript(args.script!).filter(
  (c) =>
    !args.chapters || args.chapters.split(",").map(Number).includes(c.number),
);
const scenes = chapters.flatMap((c) => c.scenes);
const missing = scenes.filter((s) => !shots[s.id]).map((s) => s.id);
if (missing.length)
  throw new Error(`No shot in scenes.ts for scene(s) ${missing.join(", ")}`);

const outDir = path.resolve(args.out!);
const audioDir = path.join(outDir, "audio");
const workRoot = path.join(outDir, "work");
mkdirSync(audioDir, { recursive: true });
rmSync(workRoot, { recursive: true, force: true });
mkdirSync(workRoot, { recursive: true });

// 1. Voice
const narrations = new Map<string, Narration>();
if (args.draft) {
  for (const s of scenes) narrations.set(s.id, draftNarration(s));
} else {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    throw new Error(
      "ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID are missing from ~/.config/lbt-admin-video/elevenlabs.env (or use --draft).",
    );
  }
  const config: VoiceConfig = {
    apiKey,
    voiceId,
    modelId: process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2",
  };
  const all = readScript(args.script!).flatMap((c) => c.scenes);
  for (const s of scenes) {
    const i = all.findIndex((x) => x.id === s.id);
    console.log(`voice ${s.id}`);
    narrations.set(
      s.id,
      await narrate(s, config, audioDir, {
        previous: all[i - 1]?.voice,
        next: all[i + 1]?.voice,
      }),
    );
  }
}
if (args["voice-only"]) {
  console.log(`Voice files in ${audioDir}`);
  process.exit(0);
}

// 2. Film and 3. assemble
const size = { width: 1920, height: 1080 };
const browser = await chromium.launch();
const bypass = args.production
  ? undefined
  : process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const context = await browser.newContext({
  viewport: { width: 1440, height: 810 },
  deviceScaleFactor: size.width / 1440,
  locale: "fr-FR",
  timezoneId: "Europe/Paris",
  colorScheme: "light",
  extraHTTPHeaders: bypass
    ? { "x-vercel-protection-bypass": bypass }
    : undefined,
});
await context.addInitScript(CURSOR_SCRIPT);

// On production, nothing the tour does may change real data: every request
// that could write is refused and listed at the end. Signing in (Supabase
// auth token) and Next.js server actions go through, logged, since the
// admin also reads through them.
const writes: string[] = [];
if (args.production) {
  await context.addInitScript(MASK_SCRIPT);
  await context.route("**/*", (route) => {
    const request = route.request();
    const method = request.method();
    if (["GET", "HEAD", "OPTIONS"].includes(method)) return route.continue();
    const url = new URL(request.url());
    const where = `${method} ${url.host}${url.pathname}`;
    if (url.pathname.endsWith("/auth/v1/token")) return route.continue();
    if (method === "POST" && request.headers()["next-action"]) {
      writes.push(`allowed server action: ${where}`);
      return route.continue();
    }
    if (method === "POST" && url.pathname.includes("/rest/v1/rpc/")) {
      writes.push(`allowed read function: ${where}`);
      return route.continue();
    }
    writes.push(`BLOCKED: ${where}`);
    return route.abort("blockedbyclient");
  });
}
const page = await context.newPage();
const camera = new Camera(page, size);
const director = new Director(page, baseURL);
const subtitles = !args["no-subtitles"] && canBurnSubtitles();
if (!args["no-subtitles"] && !subtitles)
  console.warn(
    "This ffmpeg cannot burn subtitles (no libass): the .srt file is written instead.",
  );

// Every scene but the login needs a session: sign in off camera when the
// login scene is not part of this render.
if (!scenes.some((s) => s.id === "0.1")) {
  await director.goto("/auth/login");
  await page.locator("#email").fill(process.env.TOUR_EMAIL ?? "");
  await page.locator("#password").fill(process.env.TOUR_PASSWORD ?? "");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
}

const fullPieces: string[] = [];
const fullChapters: { title: string; pieces: number }[] = [];
const fullCues: { start: number; end: number; text: string }[] = [];
let fullTime = 0;
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

for (const chapter of chapters) {
  console.log(`chapter ${chapter.number} · ${chapter.title}`);
  const pieces: string[] = [];
  const cardDir = path.join(workRoot, `card-${chapter.number}`);
  mkdirSync(cardDir, { recursive: true });
  const cardPage = await context.newPage();
  const card = path.join(cardDir, "card.mp4");
  await renderTitleCard(
    cardPage,
    chapter.number === 0
      ? { kicker: "Présentation", heading: "Le nouvel espace d’administration" }
      : { kicker: `Chapitre ${chapter.number}`, heading: chapter.title },
    cardDir,
    card,
  );
  await cardPage.close();
  pieces.push(card);
  fullTime += 2.5;

  for (const scene of chapter.scenes) {
    const shot = shots[scene.id]!;
    const narration = narrations.get(scene.id)!;
    console.log(
      `  scene ${scene.id} ${scene.title} (${narration.duration.toFixed(1)} s of voice)`,
    );
    if (shot.route) await director.goto(shot.route);
    await shot.setup?.(director);

    const workDir = path.join(workRoot, scene.id);
    const startTime = await camera.start(path.join(workDir, "frames"));
    director.begin(scene.id, narration);
    await shot.run(director);
    const minimum = LEAD_IN + narration.duration + TAIL;
    if (director.elapsed() < minimum)
      await director.pause((minimum - director.elapsed()) * 1000);
    const duration = director.elapsed();
    const frames = await camera.stop();

    const out = path.join(workDir, "scene.mp4");
    renderScene({
      frames,
      startTime,
      duration,
      leadIn: LEAD_IN,
      narration,
      burnSubtitles: subtitles,
      workDir,
      out,
    });
    pieces.push(out);
    for (const cue of subtitleCues(narration, fullTime + LEAD_IN))
      fullCues.push(cue);
    fullTime += duration;
  }

  const clip = path.join(
    outDir,
    `${String(chapter.number).padStart(2, "0")}-${slug(chapter.title)}.mp4`,
  );
  join(pieces, clip, workRoot);
  console.log(`  → ${clip}`);
  fullPieces.push(...pieces);
  fullChapters.push({ title: chapter.title, pieces: pieces.length });
}

await browser.close();

const full = path.join(outDir, "presentation-admin.mp4");
join(fullPieces, full, workRoot, fullChapters);
writeSrt(path.join(outDir, "presentation-admin.srt"), fullCues);

console.log(`\nDone: ${full}`);
if (args.production) {
  console.log(
    writes.length
      ? `\nRequests other than reads during the run:\n${writes.map((w) => `  - ${w}`).join("\n")}`
      : "\nNo write request during the run.",
  );
}
if (director.warnings.length) {
  console.log(
    `\n${director.warnings.length} step(s) skipped, check these scenes:`,
  );
  for (const w of director.warnings) console.log(`  - ${w}`);
}
