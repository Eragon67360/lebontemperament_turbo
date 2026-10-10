import type { CDPSession, Locator, Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cueTime, type Narration } from "./voice.ts";

export type Frame = { file: string; time: number };

/** Seconds of picture before the voice starts, and after it ends. */
export const LEAD_IN = 0.8;
export const TAIL = 1.0;

// A visible mouse pointer and click ripple: headless Chromium draws none.
// Also hides the Vercel preview toolbar.
export const CURSOR_SCRIPT = `
(() => {
  const install = () => {
    if (document.getElementById("tour-cursor")) return;
    const style = document.createElement("style");
    style.textContent = \`
      vercel-live-feedback, #vercel-live-feedback { display: none !important; }
      #tour-cursor { position: fixed; z-index: 2147483647; pointer-events: none;
        width: 22px; height: 22px; left: 0; top: 0; opacity: 0;
        transform: translate(var(--x, 720px), var(--y, 405px));
        transition: opacity .2s; filter: drop-shadow(0 1px 2px rgba(0,0,0,.35)); }
      .tour-ripple { position: fixed; z-index: 2147483646; pointer-events: none;
        width: 36px; height: 36px; margin: -18px 0 0 -18px; border-radius: 50%;
        background: rgba(13, 148, 136, .35); animation: tour-ripple .45s ease-out forwards; }
      @keyframes tour-ripple { from { transform: scale(.3); opacity: 1 } to { transform: scale(1.6); opacity: 0 } }
    \`;
    document.head.appendChild(style);
    const cursor = document.createElement("div");
    cursor.id = "tour-cursor";
    cursor.innerHTML = '<svg viewBox="0 0 22 22" width="22" height="22"><path d="M3 2l14 8.5-6.2 1.3L7.5 18z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    document.body.appendChild(cursor);
    const saved = sessionStorage.getItem("tour-cursor");
    if (saved) {
      const [x, y] = saved.split(",");
      cursor.style.setProperty("--x", x + "px");
      cursor.style.setProperty("--y", y + "px");
      cursor.style.opacity = "1";
    }
    document.addEventListener("mousemove", (e) => {
      cursor.style.setProperty("--x", e.clientX + "px");
      cursor.style.setProperty("--y", e.clientY + "px");
      cursor.style.opacity = "1";
      sessionStorage.setItem("tour-cursor", e.clientX + "," + e.clientY);
    }, true);
    document.addEventListener("mousedown", (e) => {
      const ripple = document.createElement("div");
      ripple.className = "tour-ripple";
      ripple.style.left = e.clientX + "px";
      ripple.style.top = e.clientY + "px";
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    }, true);
  };
  if (document.body) install();
  else document.addEventListener("DOMContentLoaded", install);
})();
`;

// Production only: blurs members' e-mails, phone numbers and postal
// addresses before Chromium paints them. Names stay readable. Text is
// matched by pattern everywhere, and by field label on the member pages.
export const MASK_SCRIPT = `
(() => {
  const EMAIL = /[\\w.+-]+@[\\w-]+\\.[\\w.-]+/;
  const PHONE = /(?:\\+33\\s?|\\b0)[1-9](?:[\\s.-]?\\d{2}){4}\\b/;
  const STREET = /\\b\\d{1,4}\\s?(?:bis|ter)?,?\\s+(?:rue|avenue|av\\.|boulevard|bd|chemin|impasse|allée|place|route|quai|cours|faubourg|lotissement|square|sentier)\\b/i;
  const LABELS = new Set(["E-mail", "Adresse", "Portable", "Fixe", "Téléphone", "Adresse e-mail"]);
  const onMemberPages = () => location.pathname.startsWith("/dashboard/admin/users");
  const blur = (el) => el && el.classList && el.classList.add("tour-blur");
  const scan = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const hits = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.nodeValue || "";
      if (EMAIL.test(t) || PHONE.test(t) || (onMemberPages() && STREET.test(t))) hits.push(n.parentElement);
      const label = t.trim().replace(/\\s*:$/, "");
      if (onMemberPages() && LABELS.has(label) && n.parentElement) {
        const el = n.parentElement;
        blur(el.nextElementSibling || (el.parentElement && el.parentElement.nextElementSibling));
      }
    }
    hits.forEach(blur);
  };
  const install = () => {
    const style = document.createElement("style");
    style.textContent = ".tour-blur, #email, input[type=email] { filter: blur(6px) !important; }";
    document.head.appendChild(style);
    scan(document.body);
    new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "characterData" && r.target.parentElement) scan(r.target.parentElement);
        r.addedNodes.forEach((node) => {
          if (node.nodeType === 1) scan(node);
          else if (node.nodeType === 3 && node.parentElement) scan(node.parentElement);
        });
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.body) install();
  else document.addEventListener("DOMContentLoaded", install);
})();
`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// What a scene can do on screen. Every step tolerates a missing element: it
// logs a warning and the take goes on, so one renamed button never sinks a
// whole render.
export class Director {
  warnings: string[] = [];
  readonly page: Page;
  private readonly baseURL: string;
  private narration: Narration | undefined;
  private sceneId = "";
  private mouse = { x: 720, y: 405 };
  private start = 0;

  constructor(page: Page, baseURL: string) {
    this.page = page;
    this.baseURL = baseURL;
  }

  begin(sceneId: string, narration: Narration) {
    this.sceneId = sceneId;
    this.narration = narration;
    this.start = Date.now();
  }

  /** Seconds since the take started. */
  elapsed() {
    return (Date.now() - this.start) / 1000;
  }

  private warn(message: string) {
    this.warnings.push(`${this.sceneId}: ${message}`);
    console.warn(`  ⚠ ${this.sceneId}: ${message}`);
  }

  async goto(route: string) {
    await this.page.goto(new URL(route, this.baseURL).toString());
    await this.page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});
    await this.page.evaluate(() => document.fonts.ready);
  }

  /** Waits until the voice reaches `phrase` (taken from this scene's « Voix »). */
  async cue(phrase: string) {
    const at = this.narration && cueTime(this.narration, phrase);
    if (at === undefined) {
      this.warn(`cue « ${phrase} » not in the narration`);
      return;
    }
    const wait = (LEAD_IN + at) * 1000 - (Date.now() - this.start);
    if (wait > 0) await sleep(wait);
  }

  async pause(ms: number) {
    await sleep(ms);
  }

  private async find(target: Locator, what: string) {
    try {
      const first = target.first();
      await first.waitFor({ state: "visible", timeout: 5_000 });
      await first.scrollIntoViewIfNeeded();
      return first;
    } catch {
      this.warn(`${what} not found`);
      return undefined;
    }
  }

  async moveTo(target: Locator, what = String(target)) {
    const el = await this.find(target, what);
    const box = el && (await el.boundingBox());
    if (!box) return undefined;
    const to = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const from = { ...this.mouse };
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(12, Math.min(45, Math.round(distance / 18)));
    for (let i = 1; i <= steps; i++) {
      const t = ease(i / steps);
      await this.page.mouse.move(
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t,
      );
      await sleep(14);
    }
    this.mouse = to;
    return el;
  }

  async hover(target: Locator, what?: string, holdMs = 700) {
    if (await this.moveTo(target, what)) await sleep(holdMs);
  }

  async click(target: Locator, what?: string) {
    if (!(await this.moveTo(target, what))) return;
    await sleep(220);
    await this.page.mouse.down();
    await sleep(70);
    await this.page.mouse.up();
    await this.page
      .waitForLoadState("networkidle", { timeout: 10_000 })
      .catch(() => {});
    await sleep(500);
  }

  async type(target: Locator, text: string, what?: string) {
    await this.click(target, what);
    await this.page.keyboard.type(text, { delay: 85 });
    await sleep(400);
  }

  async press(key: string) {
    await this.page.keyboard.press(key);
    await sleep(500);
  }

  /** Closes the open dialog with « Annuler », or Escape, without saving. */
  async cancel() {
    const dialog = this.page
      .getByRole("dialog")
      .or(this.page.getByRole("alertdialog"))
      .last();
    const cancel = dialog.getByRole("button", { name: "Annuler" });
    if (await cancel.isVisible().catch(() => false)) await this.click(cancel);
    if (await dialog.isVisible().catch(() => false)) await this.press("Escape");
    await dialog.waitFor({ state: "hidden", timeout: 3_000 }).catch(() => {
      this.warn("a dialog stayed open");
    });
  }

  async scrollTo(target: Locator, what?: string) {
    try {
      await target.first().waitFor({ state: "attached", timeout: 5_000 });
      await target
        .first()
        .evaluate((el) =>
          el.scrollIntoView({ behavior: "smooth", block: "center" }),
        );
      await sleep(1_100);
    } catch {
      this.warn(`${what ?? String(target)} not found to scroll to`);
    }
  }

  async scrollBy(pixels: number) {
    await this.page.evaluate(
      (y) => window.scrollBy({ top: y, behavior: "smooth" }),
      pixels,
    );
    await sleep(1_100);
  }
}

// Captures what Chromium paints, through the DevTools screencast: sharper
// than Playwright's recordVideo, and frames come with their own timestamps.
export class Camera {
  private session?: CDPSession;
  private frames: Frame[] = [];
  private dir = "";
  private readonly page: Page;
  private readonly size: { width: number; height: number };

  constructor(page: Page, size: { width: number; height: number }) {
    this.page = page;
    this.size = size;
  }

  async start(dir: string) {
    mkdirSync(dir, { recursive: true });
    this.dir = dir;
    this.frames = [];
    this.session = await this.page.context().newCDPSession(this.page);
    this.session.on("Page.screencastFrame", (frame) => {
      const file = path.join(
        this.dir,
        `${String(this.frames.length).padStart(5, "0")}.jpg`,
      );
      writeFileSync(file, Buffer.from(frame.data, "base64"));
      // Receipt time, on the same clock as the take's start.
      this.frames.push({ file, time: Date.now() / 1000 });
      this.session
        ?.send("Page.screencastFrameAck", { sessionId: frame.sessionId })
        .catch(() => {});
    });
    await this.session.send("Page.startScreencast", {
      format: "jpeg",
      quality: 92,
      maxWidth: this.size.width,
      maxHeight: this.size.height,
      everyNthFrame: 1,
    });
    // A tiny scroll-free repaint so the first frame arrives at once.
    await this.page.evaluate(() =>
      document.body.style.setProperty("outline", "0 solid transparent"),
    );
    return Date.now() / 1000;
  }

  async stop() {
    await this.session?.send("Page.stopScreencast").catch(() => {});
    await this.session?.detach().catch(() => {});
    return this.frames;
  }
}
