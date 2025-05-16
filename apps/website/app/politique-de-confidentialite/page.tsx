import { Metadata } from "next";
import Head from "next/head";

export const metadata: Metadata = {
  title: "Confidentialité",
  description:
    "En apprendre plus sur la politique de confidentialité du site du Bon Tempérament",
  keywords:
    "Le Bon Tempérament,  Ensemble vocal et instrumental Alsace,  Concerts de musique classique,  Tournées musicales annuelles,  Répétitions musicales conviviales,  Communauté musicale engagée,  Passion pour la musique,  Histoire musicale depuis 1987",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/politique-de-confidentialite`,
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
    canonical: "/politique-de-confidentialite",
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      <Head>
        <title>Politique de confidentialité - Le Bon Temperament</title>
      </Head>
      <main className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl xl:text-4xl font-bold mb-12 text-primary/90">
          Politique de confidentialité
        </h1>

        <div className="space-y-8">
          <section className="border-b border-gray-200 pb-8">
            <h2 className="text-lg xl:text-2xl font-semibold mb-6 text-primary/80">
              Introduction
            </h2>
            <p className="text-gray-800">
              Votre vie privée est importante pour nous. Cette politique de
              confidentialité explique quelles informations nous recueillons,
              comment nous les utilisons et quelles options vous avez concernant
              ces informations.
            </p>
          </section>

          <section className="border-b border-gray-200 pb-8">
            <h2 className="text-lg xl:text-2xl font-semibold mb-6 text-primary/80">
              Informations que nous recueillons
            </h2>
            <p className="text-gray-800 mb-4">
              Nous recueillons différents types d&apos;informations pour divers
              objectifs, y compris pour vous fournir et améliorer notre service.
            </p>
            <ul className="list-disc pl-5 text-gray-800">
              <li className="mb-2">
                Informations personnelles (nom, adresse email, numéro de
                téléphone, etc.)
              </li>
              <li>
                Données d&apos;utilisation (adresse IP, type de navigateur,
                pages visitées, etc.)
              </li>
            </ul>
          </section>

          <section className="border-b border-gray-200 pb-8">
            <h2 className="text-lg xl:text-2xl font-semibold mb-6 text-primary/80">
              Utilisation des données
            </h2>
            <p className="text-gray-800 mb-4">
              Nous utilisons les données recueillies pour divers objectifs, tels
              que :
            </p>
            <ul className="list-disc pl-5 text-gray-800">
              <li className="mb-2">Fournir et maintenir notre service</li>
              <li className="mb-2">
                Vous notifier des changements de notre service
              </li>
              <li className="mb-2">Fournir un support client</li>
              <li>
                Analyser des informations afin d&apos;améliorer notre service
              </li>
            </ul>
          </section>

          <section className="border-b border-gray-200 pb-8">
            <h2 className="text-lg xl:text-2xl font-semibold mb-6 text-primary/80">
              Partage des données
            </h2>
            <p className="text-gray-800">
              Nous ne vendons ni ne louons vos informations personnelles à des
              tiers. Nous pouvons partager vos informations avec des
              fournisseurs de services tiers pour faciliter notre service,
              fournir le service en notre nom, ou nous aider à analyser
              l&apos;utilisation de notre service.
            </p>
          </section>

          <section>
            <h2 className="text-lg xl:text-2xl font-semibold mb-6 text-primary/80">
              Vos droits
            </h2>
            <p className="text-gray-800">
              Vous avez le droit d&apos;accéder, de corriger ou de supprimer les
              informations personnelles que nous avons sur vous. Si vous
              souhaitez exercer ces droits, veuillez nous contacter à
              l&apos;adresse suivante : contactbontemperament@gmail.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
