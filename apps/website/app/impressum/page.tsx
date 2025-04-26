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
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Impressum - Le Bon Temperament</title>
      </Head>
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-6">Impressum</h1>
        <section className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Informations légales</h2>
          <p className="mb-2">
            <strong>Propriétaire du site :</strong> Le Bon Tempérament
          </p>
          <p className="mb-2">
            <strong>Adresse :</strong> 3 Rue Clemenceau, 67700 SAVERNE, France
          </p>
          <p className="mb-2">
            <strong>Téléphone :</strong> (+33) 09 52 39 57 89
          </p>
          <p className="mb-2">
            <strong>Email :</strong> lebontemperament@gmail.com
          </p>
          <p className="mb-2">
            <strong>Numéro de SIREN :</strong> 49966465400013
          </p>
        </section>
        <section className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Responsable de la publication
          </h2>
          <p className="mb-2">
            <strong>Nom :</strong> Sophie Bellard
          </p>
          <p className="mb-2">
            <strong>Contact :</strong> lebontemperament@gmail.com
          </p>
        </section>
      </main>
    </div>
  );
}
