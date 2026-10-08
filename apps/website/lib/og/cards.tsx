import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactElement } from "react";
import { OG_SECTIONS, type OgSection, type OgSectionKey } from "./sections";

/**
 * Link-preview cards (Open Graph and X) drawn with `next/og`, in the public
 * website's look: the hero's band of teal notes and its rule, Roboto, the
 * teal label colour (`--primary-600`), the logo and the « LE BT » mark from
 * the navigation. Four layouts: brand (home), section (one per page), next
 * concert (`/concerts`) and concert story (`/concerts/[slug]`).
 *
 * The files in `assets/og/` are read from disk: `band.png` is the top of
 * `public/img/hero.webp`, `logo.png` is `public/logo.png` on a transparent
 * ground, `picto.png` is `public/img/picto.svg` at 112 px (Satori can't read
 * that Illustrator SVG), the fonts are Roboto (Apache 2.0, @fontsource).
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const SITE = "lebontemperament.com";

// Website tokens (app/globals.css, light theme)
const INK = "#11181c";
const MUTED = "#4a5560";
const TEAL = "#1a878d"; // --primary-500
const TEAL_TEXT = "#156c71"; // --primary-600, 6.15:1 on white
const TEAL_DEEP = "#105155"; // --primary-700
const TEAL_SOFT = "#e6f1f2"; // --primary-50

type Assets = {
  fonts: { name: string; data: Buffer; weight: 400 | 500 | 700 }[];
  band: string;
  logo: string;
  picto: string;
};

let assetsPromise: Promise<Assets> | null = null;

function loadAssets(): Promise<Assets> {
  assetsPromise ??= (async () => {
    const dir = join(process.cwd(), "assets/og");
    const file = (name: string) => readFile(join(dir, name));
    const png = async (name: string) =>
      `data:image/png;base64,${(await file(name)).toString("base64")}`;
    const [regular, medium, bold, band, logo, picto] = await Promise.all([
      file("roboto-latin-400-normal.woff"),
      file("roboto-latin-500-normal.woff"),
      file("roboto-latin-700-normal.woff"),
      png("band.png"),
      png("logo.png"),
      png("picto.png"),
    ]);
    return {
      fonts: [
        { name: "Roboto", data: regular, weight: 400 },
        { name: "Roboto", data: medium, weight: 500 },
        { name: "Roboto", data: bold, weight: 700 },
      ],
      band,
      logo,
      picto,
    };
  })();
  return assetsPromise;
}

async function render(draw: (assets: Assets) => ReactElement) {
  const assets = await loadAssets();
  return new ImageResponse(draw(assets), {
    ...OG_SIZE,
    fonts: assets.fonts.map((f) => ({ ...f, style: "normal" as const })),
  });
}

// --- Building blocks (Satori: every element with children is a flexbox) ---

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: "#ffffff",
        color: INK,
        fontFamily: "Roboto",
      }}
    >
      {children}
    </div>
  );
}

function Band({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      src={src}
      width={1200}
      height={142}
      style={{ position: "absolute", left: 0, top: 0 }}
    />
  );
}

function Label({ children, locked }: { children: string; locked?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: TEAL_TEXT,
      }}
    >
      {locked && (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={TEAL_TEXT}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      )}
      {children}
    </div>
  );
}

function Lines({ lines, size = 32 }: { lines: string[]; size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        fontSize: size,
        lineHeight: 1.3,
        color: MUTED,
      }}
    >
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  );
}

function Footer({ path, picto }: { path: string; picto: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 72,
        bottom: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 500, color: TEAL_TEXT }}>
        {`${SITE}${path === "/" ? "" : path}`}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={picto} width={56} height={56} />
        Le Bon Tempérament
      </div>
    </div>
  );
}

// --- Layouts ---

/** Home page, and every page without a card of its own. */
export function brandImage() {
  return render(({ band, logo }) => (
    <Frame>
      <Band src={band} />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 170,
          display: "flex",
          alignItems: "center",
          gap: 60,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={logo} width={412} height={380} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            width: 600,
          }}
        >
          <Label>Chœur et orchestre · Saverne</Label>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.08 }}>
            Chanter et jouer ensemble depuis 1987
          </div>
          <Lines
            size={28}
            lines={[
              "Chœurs pour tous les âges, un orchestre,",
              "et une place pour vous.",
            ]}
          />
          <div
            style={{
              marginTop: 8,
              fontSize: 24,
              fontWeight: 500,
              color: TEAL_TEXT,
            }}
          >
            {SITE}
          </div>
        </div>
      </div>
    </Frame>
  ));
}

function SectionCard({
  section,
  band,
  picto,
}: {
  section: OgSection;
  band: string;
  picto: string;
}) {
  return (
    <Frame>
      <Band src={band} />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 182,
          width: 1000,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <Label locked={section.locked}>{section.label}</Label>
        <div
          style={{
            fontSize: section.title.length > 26 ? 72 : 84,
            fontWeight: 700,
            lineHeight: 1.04,
          }}
        >
          {section.title}
        </div>
        <Lines lines={section.lines} />
      </div>
      <Footer path={section.path} picto={picto} />
    </Frame>
  );
}

/** One public page: its label, title and one or two lines. */
export function sectionImage(key: OgSectionKey) {
  const section: OgSection = OG_SECTIONS[key];
  return render(({ band, picto }) => (
    <SectionCard section={section} band={band} picto={picto} />
  ));
}

export type NextConcert = {
  title: string;
  day: string;
  month: string;
  year: string;
  /** « Dimanche 22 novembre · 18 h 00 » */
  when: string;
  place: string;
};

/** `/concerts`: the next announced concert, or the agenda's section card. */
export function nextConcertImage(concert: NextConcert | null) {
  if (!concert) return sectionImage("concerts");
  return render(({ band, picto }) => (
    <Frame>
      <Band src={band} />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 178,
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        <Label>Prochain concert</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div
            style={{
              width: 150,
              height: 170,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: `3px solid ${TEAL}`,
              borderRadius: 18,
              background: TEAL_SOFT,
              color: TEAL_DEEP,
            }}
          >
            <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1 }}>
              {concert.day}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              {concert.month}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 500,
                marginTop: 6,
                color: TEAL_TEXT,
              }}
            >
              {concert.year}
            </div>
          </div>
          <div
            style={{
              width: 820,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                fontSize: concert.title.length > 34 ? 48 : 58,
                fontWeight: 700,
                lineHeight: 1.05,
              }}
            >
              {concert.title}
            </div>
            <Lines size={30} lines={[concert.when, concert.place]} />
          </div>
        </div>
      </div>
      <Footer path="/concerts" picto={picto} />
    </Frame>
  ));
}

export type ConcertStory = {
  title: string;
  subtitle: string | null;
  year: string | null;
  /** The story's banner as a data URL, already cropped to 1200 × 360. */
  banner: string | null;
};

/** `/concerts/[slug]`: the banner at full width, then the story's title. */
export function storyImage(story: ConcertStory, path: string) {
  const label = story.year
    ? `Histoire de concert · ${story.year}`
    : "Histoire de concert";
  if (!story.banner) {
    return render(({ band, picto }) => (
      <SectionCard
        section={{
          label,
          title: story.title,
          lines: story.subtitle ? [story.subtitle] : [],
          path,
          alt: "",
        }}
        band={band}
        picto={picto}
      />
    ));
  }
  const banner = story.banner;
  return render(({ picto }) => (
    <Frame>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={banner}
        width={1200}
        height={360}
        style={{ position: "absolute", left: 0, top: 0, objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 360,
          width: 1200,
          height: 8,
          background: TEAL,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 408,
          width: 900,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Label>{label}</Label>
        <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.05 }}>
          {story.title}
        </div>
        {story.subtitle && <Lines size={28} lines={[story.subtitle]} />}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={picto}
        width={72}
        height={72}
        style={{ position: "absolute", right: 72, bottom: 48 }}
      />
    </Frame>
  ));
}
