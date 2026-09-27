// Captures the real Le Bon Tempérament site for the portfolio hover video.
// Run: HOVER_KIT_DIR=<portfolio>/resources/hover-videos/kit HOVER_KIT_DEPS=<deps>/package.json node capture.mjs
// Scrolls are captured one screenshot per video frame (30fps) along the same eased curve the
// composition plays, so the sticky navigation and sidebar stay exactly as the site renders them.
import { writeFileSync } from "node:fs";
const { openBrowser, warmUp, shoot, box } = await import(`${process.env.HOVER_KIT_DIR}/capture.mjs`);

const dir = new URL("./captures", import.meta.url).pathname;
const SITE = "https://www.lebontemperament.com";
const FPS = 30;
const { browser, page } = await openBrowser();
const layout = { seq: {} };

const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const scrollTo = (y) => page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);

/** One JPEG per frame while the page scrolls from `from` to `to` over `seconds`. */
async function scrollSeq(name, from, to, seconds) {
  const frames = Math.round(seconds * FPS);
  for (let f = 0; f <= frames; f++) {
    await scrollTo(Math.round(from + (to - from) * inOut(f / frames)));
    await page.waitForTimeout(90);
    await page.screenshot({ path: `${dir}/${name}-${String(f).padStart(2, "0")}.jpg`, type: "jpeg", quality: 88, scale: "css" });
  }
  layout.seq[name] = frames + 1;
}

// Home: the card view.
await page.goto(SITE, { waitUntil: "networkidle" });
await warmUp(page);
await page.waitForTimeout(1500);
await shoot(page, dir, "home", { full: false });
layout.concertsBtn = await box(page, 'main a[href="/concerts"]:has-text("Nos concerts")');

// Agenda: scroll from the top down to the concert stories, hover one and open it.
const AGENDA_Y = 1250;
await page.goto(`${SITE}/concerts`, { waitUntil: "networkidle" });
await warmUp(page);
await page.waitForTimeout(800);
await scrollSeq("agenda", 0, AGENDA_Y, 1.2);
const card = 'a[href="/concerts/voyage-opera"]';
layout.card = await box(page, card);
await page.hover(card);
await page.waitForTimeout(900);
await shoot(page, dir, "agenda-hover", { full: false });

// Concert story: its hero, then scrolled down into the article and the first photo.
await page.goto(`${SITE}/concerts/voyage-opera`, { waitUntil: "networkidle" });
await warmUp(page);
await page.waitForTimeout(1200);
await scrollSeq("story", 0, 760, 1.0);

// Gallery: open the "Nos concerts" photo album.
await page.goto(`${SITE}/galerie`, { waitUntil: "networkidle" });
await warmUp(page);
await page.waitForTimeout(800);
await shoot(page, dir, "gal-0", { full: false });
const acc = 'button:has-text("Nos concerts")';
layout.accordion = await box(page, acc);
await page.click(acc);
// The album opens at once but its photos load and fade in: wait until they are all fully shown.
await page.waitForTimeout(2500);
await warmUp(page);
await page.waitForTimeout(2500);
await shoot(page, dir, "gal-1", { full: false });

// A script, not JSON: compositions are opened from file://, where fetch() is blocked.
writeFileSync(`${dir}/layout.js`, `window.LAYOUT = ${JSON.stringify(layout, null, 2)};\n`);
console.log(layout);
await browser.close();
