import { DonationForm } from "@/components/donations/DonationForm";
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

export default async function DonPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="container mx-auto flex min-h-screen w-full flex-col px-4 py-12 pb-16 md:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-title text-primary/50 dark:text-primary leading-none font-light">
          Faire un don
        </h1>
        <h2 className="text-title text-foreground mb-8 leading-none font-bold">
          Soutenez Le Bon Tempérament
        </h2>

        {params.success === "true" && (
          <div
            className="bg-success/10 border-success/30 mb-8 rounded-lg border p-4"
            role="alert"
          >
            <p className="text-success font-semibold">Merci pour votre don !</p>
            <p className="text-default-600 mt-1 text-sm">
              Vous recevrez votre reçu fiscal par email sous peu. Conservez-le
              pour votre déclaration d&apos;impôts.
            </p>
          </div>
        )}

        <div className="bg-default-50 rounded-lg p-6 shadow-lg md:p-8">
          <p className="text-default-600 mb-6">
            Votre don permet à l&apos;association Le Bon Tempérament de
            poursuivre ses activités : concerts, tournées, ateliers et
            transmission de la musique. En tant qu&apos;association
            d&apos;intérêt général, nous pouvons vous délivrer un reçu fiscal
            ouvrant droit à une réduction d&apos;impôt de 66 % du montant du don
            (Article 200 du code général des impôts).
          </p>
          <DonationForm />
        </div>
      </div>
    </div>
  );
}
