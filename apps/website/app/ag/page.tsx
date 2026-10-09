import { getCurrentAssembly, type Assembly } from "@/lib/generalAssemblies";
import { createPublicClient } from "@/utils/supabase/public";
import {
  assemblyDateLabel,
  assemblyShortDateLabel,
  assemblyTitle,
  isAssemblyUpcoming,
} from "@repo/domain/utils/generalAssemblies";
import { Metadata } from "next";
import Link from "next/link";
import { cache, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

// The newest published general assembly (admin › Association › Assemblée
// générale): prerendered, refreshed every five minutes or when the admin
// saves it (/api/revalidate).
export const revalidate = 300;

const loadAssembly = cache(() => getCurrentAssembly(createPublicClient()));

export async function generateMetadata(): Promise<Metadata> {
  const assembly = await loadAssembly();
  const title = assembly
    ? assemblyTitle(assembly.heldAt)
    : "Assemblée générale";
  const description = assembly
    ? `L'Assemblée générale du Bon Tempérament : ${assemblyDateLabel(assembly.heldAt).toLowerCase()}, ${assembly.place}. Convocation et formulaire de procuration.`
    : "L'Assemblée générale du Bon Tempérament : date, lieu, convocation et formulaire de procuration.";
  return {
    title,
    description,
    // For members; not worth a search result.
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/ag`,
      siteName: "Le Bon Tempérament",
      title: `${title} - Le Bon Tempérament`,
      description,
    },
    alternates: { canonical: "/ag" },
  };
}

const markdown: Components = {
  p: ({ children }) => (
    <p className="text-muted text-base leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="text-muted list-inside list-disc space-y-2 text-base leading-relaxed">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-muted list-inside list-decimal space-y-2 text-base leading-relaxed">
      {children}
    </ol>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-primary-text underline underline-offset-2"
      target={href?.startsWith("/") ? undefined : "_blank"}
      rel={href?.startsWith("/") ? undefined : "noopener noreferrer"}
    >
      {children}
    </a>
  ),
};

function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3">
      <ReactMarkdown components={markdown} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  );
}

function Section({
  title,
  tone = "plain",
  children,
}: {
  title: string;
  tone?: "plain" | "card" | "highlight";
  children: ReactNode;
}) {
  const box =
    tone === "card"
      ? "border-separator bg-surface-secondary rounded-lg border p-6 shadow-sm"
      : tone === "highlight"
        ? "border-primary/30 bg-primary/5 dark:bg-primary/10 rounded-lg border p-6"
        : "";
  return (
    <section className={`mb-8 ${box}`}>
      <h2 className="text-foreground mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function ArrowIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 5l7 7m0 0l-7 7m7-7H3"
      />
    </svg>
  );
}

function Documents({ assembly }: { assembly: Assembly }) {
  const { convocation, proxy } = assembly;
  if (!convocation && !proxy) return null;
  return (
    <Section title="Documents">
      <div className="flex flex-col gap-4 sm:flex-row">
        {convocation && (
          <a
            href={convocation.href}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary-solid hover:bg-primary-solid-hover inline-flex w-fit items-center gap-2 rounded-md px-6 py-3 text-white transition-colors"
            aria-label="Télécharger la convocation"
          >
            Télécharger la convocation
            <ArrowIcon />
          </a>
        )}
        {proxy && (
          <a
            href={proxy.href}
            target="_blank"
            rel="noopener noreferrer"
            className="border-primary text-primary-text hover:bg-primary/10 inline-flex w-fit items-center gap-2 rounded-md border px-6 py-3 transition-colors"
            aria-label="Télécharger le formulaire de procuration"
          >
            Télécharger le formulaire de procuration
            <ArrowIcon />
          </a>
        )}
      </div>
    </Section>
  );
}

function BackHome() {
  return (
    <div className="mt-12">
      <Link
        href="/"
        className="border-primary text-primary-text hover:bg-primary/10 inline-flex w-fit items-center gap-2 rounded-md border px-6 py-3 transition-colors"
        aria-label="Retour à l'accueil"
      >
        <ArrowIcon className="h-5 w-5 rotate-180" />
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}

export default async function GeneralAssemblyPage() {
  const assembly = await loadAssembly();
  const year = assembly ? assemblyTitle(assembly.heldAt).slice(-4) : null;

  return (
    <div className="container mx-auto mb-32 flex flex-col px-8 py-4 md:py-8 lg:py-16">
      <div className="mb-8">
        <h1>
          <span className="text-primary-400 dark:text-primary text-title block leading-none font-light">
            Assemblée
          </span>
          <span className="text-foreground text-title block leading-none font-bold">
            {year ? `Générale ${year}` : "Générale"}
          </span>
        </h1>
        <hr className="border-separator mt-2 md:mt-4 lg:mt-8" />
      </div>

      {!assembly ? (
        <p className="text-muted text-base leading-relaxed">
          La prochaine assemblée générale n&apos;est pas encore annoncée. Les
          membres recevront la convocation dès qu&apos;elle sera fixée.
        </p>
      ) : (
        <>
          {!isAssemblyUpcoming(assembly.heldAt) && (
            <p className="border-separator bg-surface-secondary text-muted mb-8 rounded-lg border px-6 py-4 text-sm">
              Cette assemblée générale a eu lieu le{" "}
              {assemblyShortDateLabel(assembly.heldAt)}. La prochaine sera
              annoncée ici.
            </p>
          )}

          <Section title="Date et lieu" tone="card">
            <p className="text-muted text-base leading-relaxed">
              <strong>{assemblyDateLabel(assembly.heldAt)}</strong>
              <br />
              {assembly.place}
              {assembly.practicalNote && (
                <>
                  <br />
                  <span className="text-muted text-sm">
                    {assembly.practicalNote}
                  </span>
                </>
              )}
            </p>
          </Section>

          <Documents assembly={assembly} />

          {assembly.reminders && (
            <Section title="Rappels importants" tone="highlight">
              <Markdown>{assembly.reminders}</Markdown>
            </Section>
          )}
          {assembly.votingRights && (
            <Section title="Droit de vote">
              <Markdown>{assembly.votingRights}</Markdown>
            </Section>
          )}
          {assembly.agenda && (
            <Section title="Ordre du jour">
              <Markdown>{assembly.agenda}</Markdown>
            </Section>
          )}
          {assembly.afterwards && (
            <Section title="Après l'AG" tone="card">
              <Markdown>{assembly.afterwards}</Markdown>
            </Section>
          )}
        </>
      )}

      <BackHome />
    </div>
  );
}
