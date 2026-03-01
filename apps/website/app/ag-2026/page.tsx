import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Assemblée Générale 2026 | Le Bon Tempérament",
  description:
    "L'Assemblée Générale du Bon Tempérament aura lieu le samedi 14 mars 2026 à 19h au Freihof à Wangen. Convocation et formulaire de procuration.",
  keywords:
    "Assemblée Générale, Le Bon Tempérament, AG 2026, Wangen, procuration, convocation",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/ag-2026`,
    siteName: "Le Bon Tempérament",
    title: "Assemblée Générale 2026 - Le Bon Tempérament",
    description:
      "L'Assemblée Générale du Bon Tempérament aura lieu le samedi 14 mars 2026 à 19h au Freihof à Wangen.",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/default-og.png",
        width: 1200,
        height: 630,
        alt: "Assemblée Générale 2026 - Le Bon Tempérament",
      },
    ],
  },
  alternates: {
    canonical: "/ag-2026",
  },
};

const CONVOCATION_URL = "/pdf/AG_2026/convocation_AG_2026.pdf";
const PROCURATION_URL = "/pdf/AG_2026/procuration_AG_2026.pdf";

export default function AG2026Page() {
  return (
    <div className="container mx-auto mb-32 flex flex-col px-8 py-4 md:py-8 lg:py-16">
      <div className="mb-8">
        <h1 className="text-primary/50 dark:text-primary text-title leading-none font-light">
          Assemblée
        </h1>
        <h2 className="text-foreground text-title leading-none font-bold">
          Générale 2026
        </h2>
        <hr className="border-divider mt-2 md:mt-4 lg:mt-8" />
      </div>

      {/* Date et lieu */}
      <div className="border-divider bg-default-50 mb-8 rounded-lg border p-6 shadow-sm">
        <h3 className="text-foreground mb-4 text-xl font-semibold">
          Date et lieu
        </h3>
        <p className="text-default-600 dark:text-default-400 text-base leading-relaxed">
          <strong>Samedi 14 mars 2026 à 19h</strong>
          <br />
          Freihof, Wangen
          <br />
          <span className="text-default-500 text-sm">
            Le parking se fera devant la salle des fêtes.
          </span>
        </p>
      </div>

      {/* Documents à télécharger */}
      <div className="mb-8">
        <h3 className="text-foreground mb-4 text-xl font-semibold">
          Documents
        </h3>
        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            href={CONVOCATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary hover:bg-primary/90 inline-flex w-fit items-center gap-2 rounded-md px-6 py-3 text-white transition-colors"
            aria-label="Télécharger la convocation"
          >
            Télécharger la convocation
            <svg
              className="h-5 w-5"
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
          </a>
          <a
            href={PROCURATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="border-primary text-primary hover:bg-primary/10 inline-flex w-fit items-center gap-2 rounded-md border px-6 py-3 transition-colors"
            aria-label="Télécharger le formulaire de procuration"
          >
            Télécharger le formulaire de procuration
            <svg
              className="h-5 w-5"
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
          </a>
        </div>
      </div>

      {/* Rappels importants */}
      <div className="border-primary/30 bg-primary/5 dark:bg-primary/10 mb-8 rounded-lg border p-6">
        <h3 className="text-foreground mb-4 text-xl font-semibold">
          Rappels importants
        </h3>
        <ul className="text-default-600 dark:text-default-400 list-inside list-disc space-y-2 text-base leading-relaxed">
          <li>
            Si vous ne pouvez pas être présent, il est{" "}
            <strong>impératif</strong> de donner une procuration pour que cette
            AG statutaire puisse se tenir valablement.
          </li>
          <li>
            Un membre ne peut avoir que{" "}
            <strong>deux procurations maximum</strong>.
          </li>
          <li>
            L&apos;an dernier, l&apos;AG a failli être annulée car il manquait
            une voix. Chaque procuration compte !
          </li>
        </ul>
      </div>

      {/* Critères de vote */}
      <div className="mb-8">
        <h3 className="text-foreground mb-4 text-xl font-semibold">
          Droit de vote
        </h3>
        <p className="text-default-600 dark:text-default-400 text-base leading-relaxed">
          Ont le droit de vote tous les membres de plus de 16 ans à la date de
          l&apos;AG, à jour de leurs cotisations pour l&apos;année 2025, et
          membres depuis plus de 6 mois. Afin que les votes soient recevables,
          le CA rappelle l&apos;importance que toutes les personnes répondant à
          ces critères et ne pouvant être présentes se fassent représenter par
          un membre présent à l&apos;aide d&apos;une procuration.
        </p>
      </div>

      {/* Ordre du jour */}
      <div className="mb-8">
        <h3 className="text-foreground mb-4 text-xl font-semibold">
          Ordre du jour
        </h3>
        <p className="text-default-600 dark:text-default-400 text-base leading-relaxed">
          Lors de cette AG, nous procéderons à l&apos;élection du nouveau CA.
          C&apos;est l&apos;occasion de rejoindre cette instance qui gère
          l&apos;association tout au long de l&apos;année.
        </p>
      </div>

      {/* Apéritif dînatoire */}
      <div className="border-divider bg-default-50 mb-8 rounded-lg border p-6">
        <h3 className="text-foreground mb-4 text-xl font-semibold">
          Après l&apos;AG
        </h3>
        <p className="text-default-600 dark:text-default-400 text-base leading-relaxed">
          Cette AG sera suivie d&apos;un apéritif dînatoire partagé amené par
          vos soins. La boisson sera fournie par l&apos;association.{" "}
          <strong>Apportez vos verres.</strong>
        </p>
      </div>

      <div className="mt-12">
        <Link
          href="/"
          className="border-primary text-primary hover:bg-primary/10 inline-flex w-fit items-center gap-2 rounded-md border px-6 py-3 transition-colors"
          aria-label="Retour à l'accueil"
        >
          <svg
            className="h-5 w-5 rotate-180"
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
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
