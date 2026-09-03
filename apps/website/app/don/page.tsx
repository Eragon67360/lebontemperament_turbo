import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/utils/seo";
import { Metadata } from "next";
import { FaHeart } from "react-icons/fa";

const HELLOASSO_CAMPAIGN_URL =
  "https://www.helloasso.com/associations/le-bon-temperament/formulaires/2";

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

        <div className="bg-default-50 h-full grow rounded-lg p-6 shadow-lg md:p-8">
          <p className="text-default-600 mb-6">
            Votre don permet à l&apos;association Le Bon Tempérament de
            poursuivre ses activités : concerts, tournées, ateliers et
            transmission de la musique. En tant qu&apos;association
            d&apos;intérêt général, nous pouvons vous délivrer un reçu fiscal
            ouvrant droit à une réduction d&apos;impôt de 66 % du montant du don
            (Article 200 du code général des impôts).
          </p>
          <p className="text-default-600 mb-6">
            Les dons sont collectés de manière sécurisée par HelloAsso, notre
            partenaire de paiement. En cliquant sur le bouton ci-dessous, vous
            serez redirigé vers notre page de don HelloAsso (nouvel onglet).
          </p>
          <a
            href={HELLOASSO_CAMPAIGN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Faire un don via HelloAsso (nouvel onglet)"
            className="bg-primary hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-colors"
          >
            <FaHeart aria-hidden="true" />
            Faire un don sur HelloAsso
          </a>
        </div>
      </div>
    </div>
  );
}
