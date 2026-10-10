import type { Page } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import type { Frame } from "./recorder.ts";
import type { Narration } from "./voice.ts";

export const OUTPUT = { width: 1920, height: 1080, fps: 30 };

// Same encoding for every piece, so the chapters and the full video are
// joined without re-encoding.
const VIDEO_CODEC = [
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "18",
  "-pix_fmt",
  "yuv420p",
  "-r",
  String(OUTPUT.fps),
];
const AUDIO_CODEC = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"];

function ffmpeg(args: string[], cwd?: string) {
  const result = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", ...args],
    {
      cwd,
      encoding: "utf8",
    },
  );
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed: ${result.stderr || result.error?.message}`);
  }
}

export function canBurnSubtitles() {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-filters"], {
    encoding: "utf8",
  });
  return /\bsubtitles\b/.test(result.stdout ?? "");
}

function srtTime(seconds: number) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms % 1000, 3)}`;
}

// Cuts the narration into subtitle lines of at most two short lines, at
// sentence ends first, then at commas, timed from the voice's alignment.
export function subtitleCues(narration: Narration, offset: number) {
  const text = narration.text;
  const cues: { start: number; end: number; text: string }[] = [];
  let from = 0;
  while (from < text.length) {
    let to = text.length;
    if (to - from > 84) {
      const window = text.slice(from, from + 84);
      // Index just after the punctuation, so it stays on the line it ends.
      const after = (mark: string) => {
        const i = window.lastIndexOf(mark);
        return i < 0 ? -1 : i + mark.trimEnd().length;
      };
      const sentence = Math.max(
        after(". "),
        after("? "),
        after("! "),
        after(" : "),
      );
      const comma = after(", ");
      const space = window.lastIndexOf(" ");
      const cut = sentence > 20 ? sentence : comma > 30 ? comma : space;
      to = from + (cut > 0 ? cut : 84);
    }
    const chunk = text.slice(from, to).trim();
    if (chunk) {
      cues.push({
        start: offset + (narration.charStarts[from] ?? 0),
        end: offset + (narration.charStarts[to] ?? narration.duration),
        text: wrap(chunk),
      });
    }
    from = to;
  }
  return cues;
}

function wrap(line: string) {
  if (line.length <= 42) return line;
  const middle = line.lastIndexOf(" ", Math.ceil(line.length / 2) + 6);
  return middle > 0
    ? `${line.slice(0, middle)}\n${line.slice(middle + 1)}`
    : line;
}

export function writeSrt(
  file: string,
  cues: { start: number; end: number; text: string }[],
) {
  writeFileSync(
    file,
    cues
      .map(
        (c, i) =>
          `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`,
      )
      .join("\n"),
  );
}

// One scene: the captured frames held for their real durations, the voice
// starting after the lead-in, faded in and out, subtitles burnt in.
export function renderScene(options: {
  frames: Frame[];
  startTime: number;
  duration: number;
  leadIn: number;
  narration: Narration;
  burnSubtitles: boolean;
  workDir: string;
  out: string;
}) {
  const { frames, startTime, duration, workDir } = options;
  if (frames.length === 0)
    throw new Error(`no frame captured for ${options.out}`);

  const lines: string[] = [];
  frames.forEach((frame, i) => {
    const next = frames[i + 1]?.time ?? startTime + duration;
    const begins = i === 0 ? startTime : frame.time;
    lines.push(
      `file '${frame.file}'`,
      `duration ${Math.max(0.001, next - begins).toFixed(3)}`,
    );
  });
  // The concat demuxer ignores the last duration unless the file is repeated.
  lines.push(`file '${frames.at(-1)!.file}'`);
  writeFileSync(path.join(workDir, "frames.txt"), lines.join("\n"));

  const fade = 0.3;
  const filters = [
    `scale=${OUTPUT.width}:${OUTPUT.height}:force_original_aspect_ratio=decrease:flags=lanczos`,
    `pad=${OUTPUT.width}:${OUTPUT.height}:(ow-iw)/2:(oh-ih)/2:color=0xf4f6f6`,
    `fps=${OUTPUT.fps}`,
    `fade=t=in:st=0:d=${fade}`,
    `fade=t=out:st=${(duration - fade).toFixed(3)}:d=${fade}`,
  ];
  if (options.burnSubtitles) {
    writeSrt(
      path.join(workDir, "scene.srt"),
      subtitleCues(options.narration, options.leadIn),
    );
    filters.push(
      "subtitles=scene.srt:force_style='FontName=Inter,FontSize=11,PrimaryColour=&H00FFFFFF,BackColour=&H99000000,BorderStyle=3,Outline=6,Shadow=0,MarginV=22'",
    );
  }

  const audio = options.narration.audioFile
    ? ["-i", options.narration.audioFile]
    : ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"];
  const delay = Math.round(options.leadIn * 1000);
  ffmpeg(
    [
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "frames.txt",
      ...audio,
      "-filter:v",
      filters.join(","),
      "-filter:a",
      `adelay=${delay}|${delay},apad`,
      "-t",
      duration.toFixed(3),
      ...VIDEO_CODEC,
      ...AUDIO_CODEC,
      options.out,
    ],
    workDir,
  );
}

// A chapter title on the admin's own colours, drawn by the browser.
export async function renderTitleCard(
  page: Page,
  title: { kicker: string; heading: string },
  workDir: string,
  out: string,
  seconds = 2.5,
) {
  const escape = (s: string) =>
    s.replace(/[&<>]/g, (c) => `&#${c.charCodeAt(0)};`);
  await page.setContent(`<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;height:100%;background:#f4f6f6;color:#16201f;font-family:Inter,system-ui,sans-serif}
  body{display:flex;align-items:center;justify-content:center}
  .card{display:flex;flex-direction:column;align-items:center;gap:28px;text-align:center}
  .mark{width:84px;height:84px;border-radius:16px;background:#156c71;color:#fff;display:flex;align-items:center;justify-content:center}
  .kicker{font-size:26px;font-weight:500;color:#1a878d;letter-spacing:.02em}
  h1{margin:0;font-size:64px;font-weight:600;letter-spacing:-.01em}
  .brand{font-size:22px;color:#4b5a59}
</style></head><body><div class="card">
  <div class="mark"><svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 3v7a3 3 0 0 0 6 0V3"/><path d="M12 13v8"/></svg></div>
  <div class="kicker">${escape(title.kicker)}</div>
  <h1>${escape(title.heading)}</h1>
  <div class="brand">Le Bon Tempérament · Administration</div>
</div></body></html>`);
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  const png = path.join(workDir, "card.png");
  await page.screenshot({ path: png });
  ffmpeg([
    "-loop",
    "1",
    "-i",
    png,
    "-f",
    "lavfi",
    "-i",
    "anullsrc=r=48000:cl=stereo",
    "-filter:v",
    `scale=${OUTPUT.width}:${OUTPUT.height}:flags=lanczos,fps=${OUTPUT.fps},fade=t=in:st=0:d=0.4,fade=t=out:st=${seconds - 0.4}:d=0.4`,
    "-t",
    String(seconds),
    ...VIDEO_CODEC,
    ...AUDIO_CODEC,
    out,
  ]);
}

function probeDuration(file: string) {
  const result = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  return Number(result.stdout.trim());
}

// Joins pieces without re-encoding; with `chapters`, each listed group of
// pieces becomes a named chapter in the player.
export function join(
  pieces: string[],
  out: string,
  workDir: string,
  chapters?: { title: string; pieces: number }[],
) {
  const list = path.join(workDir, `${path.basename(out)}.txt`);
  writeFileSync(list, pieces.map((p) => `file '${p}'`).join("\n"));
  const args = ["-f", "concat", "-safe", "0", "-i", list];

  if (chapters) {
    const durations = pieces.map(probeDuration);
    let index = 0;
    let at = 0;
    const meta = [";FFMETADATA1", "title=Le nouvel espace d'administration"];
    for (const chapter of chapters) {
      const length = durations
        .slice(index, index + chapter.pieces)
        .reduce((a, b) => a + b, 0);
      meta.push(
        "[CHAPTER]",
        "TIMEBASE=1/1000",
        `START=${Math.round(at * 1000)}`,
        `END=${Math.round((at + length) * 1000)}`,
        `title=${chapter.title.replace(/[=;#\\]/g, "\\$&")}`,
      );
      index += chapter.pieces;
      at += length;
    }
    const metaFile = path.join(workDir, `${path.basename(out)}.meta`);
    writeFileSync(metaFile, meta.join("\n"));
    args.push(
      "-i",
      metaFile,
      "-map",
      "0",
      "-map_metadata",
      "1",
      "-map_chapters",
      "1",
    );
  }

  ffmpeg([...args, "-c", "copy", "-movflags", "+faststart", out]);
}
