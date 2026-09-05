import DonationTiers from "@/components/donations/DonationTiers";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/utils/seo";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faire un don - Le Bon Tempérament",
  description:
    "Soutenez Le Bon Tempérament par un don. Votre don ouvre droit à une réduction d'impôt (Article 200 CGI). Reçu fiscal envoyé par email.",
  keywords:
    "don Le Bon Tempérament, soutien association musique, reçu fiscal, Article 200 CGI, donation",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/don`,
    siteName: "Le Bon Tempérament",
    title: "Faire un don - Le Bon Tempérament",
    description:
      "Soutenez Le Bon Tempérament par un don. Reçu fiscal envoyé par email.",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/default-og.png",
        width: 1200,
        height: 630,
        alt: "Le Bon Tempérament - Faire un don",
      },
    ],
  },
  alternates: {
    canonical: "/don",
  },
};

export default function DonPage() {
  return (
    <div className="container mx-auto flex min-h-screen w-full flex-col px-4 py-12 pb-16 md:py-16">
      <JsonLd
        data={breadcrumbJsonLd([{ name: "Faire un don", path: "/don" }])}
      />
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-title text-primary/50 dark:text-primary leading-none font-light">
          Faire un don
        </h1>
        <h2 className="text-title text-foreground mb-8 leading-none font-bold">
          Soutenez Le Bon Tempérament
        </h2>

        <div className="bg-surface-secondary rounded-lg p-6 shadow-lg md:p-8">
          <p className="text-muted mb-6">
            Depuis bientôt 40 ans, notre joyeuse troupe réunit des musiciens de
            7 à 77 ans — parfois moins, parfois plus. Sans subvention et avec
            des cotisations volontairement modérées, chaque coup de pouce nous
            aide à continuer de faire vivre la musique ensemble.
          </p>

          <DonationTiers />

          <p className="border-default-200 text-muted mt-8 border-t pt-5 text-sm">
            Le Bon Tempérament est une association d&apos;intérêt général :
            votre don ouvre droit à une réduction d&apos;impôt de 66 % de son
            montant (article 200 du Code général des impôts). Votre reçu fiscal
            sera délivré par HelloAsso.
          </p>
        </div>
      </div>
    </div>
  );
}
