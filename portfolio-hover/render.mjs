// Renders a hover-video composition to <out>.mp4 (silent H.264, faststart) and <out>.jpg (frame 0).
// H.264 MP4 plays in every current browser; VP9 WebM came out larger at equal quality, so it is not produced.
// Usage: HOVER_KIT_DEPS=/path/to/package.json node render.mjs <comp.html> <out-basename> [fps]
// HOVER_KIT_DEPS points at a package.json whose node_modules contain `playwright` and `ffmpeg-static`.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const require = createRequire(process.env.HOVER_KIT_DEPS ?? import.meta.url);
const { chromium } = require("playwright");
const ffmpegPath = require("ffmpeg-static");

const [comp, out, fpsArg] = process.argv.slice(2);
const fps = Number(fpsArg ?? 30);
const W = 1280;
const H = 800;

function run(args, input) {
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, ["-y", "-loglevel", "error", ...args], { stdio: [input ? "pipe" : "ignore", "inherit", "inherit"] });
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`))));
    if (input) input(ff.stdin);
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.resolve(comp)).href);
// Wait for images and fonts, and for the composition to define its timeline.
await page.evaluate(() => window.ready);
await page.waitForFunction(() => typeof window.renderAt === "function" && window.DURATION > 0);
const duration = await page.evaluate(() => window.DURATION);
const frames = Math.round(duration * fps);

const mp4 = `${out}.mp4`;
await run(
  ["-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-", "-an",
   "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4],
  async (stdin) => {
    for (let i = 0; i < frames; i++) {
      await page.evaluate((t) => window.renderAt(t), i / fps);
      const jpg = await page.screenshot({ type: "jpeg", quality: 92 });
      if (i === 0) await import("node:fs").then((fs) => fs.writeFileSync(`${out}.jpg`, jpg));
      if (!stdin.write(jpg)) await new Promise((r) => stdin.once("drain", r));
    }
    stdin.end();
  },
);
await browser.close();

console.log(`${path.basename(out)}: ${frames} frames @ ${fps}fps (${duration}s)`);
