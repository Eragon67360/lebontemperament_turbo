import { Metadata } from "next";
import Head from "next/head";

export const metadata: Metadata = {
  title: "Impressum",
  description:
    "En apprendre plus sur la politique de confidentialité du site du Bon Tempérament",
  keywords:
    "Le Bon Tempérament,  Ensemble vocal et instrumental Alsace,  Concerts de musique classique,  Tournées musicales annuelles,  Répétitions musicales conviviales,  Communauté musicale engagée,  Passion pour la musique,  Histoire musicale depuis 1987",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/impressum`,
    siteName: "Le Bon Tempérament",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/concerts-og.png",
        width: 800,
        height: 600,
        alt: "Le Bon Tempérament",
      },
    ],
  },
  alternates: {
    canonical: "/impressum",
  },
};

export default function Impressum() {
  return (
    <div className="min-h-screen">
      <Head>
        <title>Impressum - Le Bon Temperament</title>
      </Head>
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-primary/90 mb-12 text-4xl font-bold">Impressum</h1>

        <div className="space-y-8">
          <section className="border-divider border-b pb-8">
            <h2 className="text-primary/80 mb-6 text-2xl font-semibold">
              Informations légales
            </h2>
            <div className="space-y-4">
              <div>
                <span className="text-default-600 font-medium">
                  Propriétaire du site :
                </span>
                <span className="text-foreground ml-2">Le Bon Tempérament</span>
              </div>
              <div>
                <span className="text-default-600 font-medium">Adresse :</span>
                <span className="text-foreground ml-2">
                  3 Rue Clemenceau, 67700 SAVERNE, France
                </span>
              </div>
              <div>
                <span className="text-default-600 font-medium">
                  Téléphone :
                </span>
                <span className="text-foreground ml-2">
                  (+33) 09 52 39 57 89
                </span>
              </div>
              <div>
                <span className="text-default-600 font-medium">Email :</span>
                <span className="text-foreground ml-2">
                  lebontemperament@gmail.com
                </span>
              </div>
              <div>
                <span className="text-default-600 font-medium">
                  Numéro de SIREN :
                </span>
                <span className="text-foreground ml-2">49966465400013</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-primary/80 mb-6 text-2xl font-semibold">
              Responsable de la publication
            </h2>
            <div className="space-y-4">
              <div>
                <span className="text-default-600 font-medium">Nom :</span>
                <span className="text-foreground ml-2">Sophie Bellard</span>
              </div>
              <div>
                <span className="text-default-600 font-medium">Contact :</span>
                <span className="text-foreground ml-2">
                  lebontemperament@gmail.com
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
