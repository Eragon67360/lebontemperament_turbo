
import { Metadata } from 'next';
import Head from 'next/head';


export const metadata: Metadata = {
  title: "Confidentialité",
  description: "En apprendre plus sur la politique de confidentialité du site du Bon Tempérament",
  keywords: "Le Bon Tempérament,  Ensemble vocal et instrumental Alsace,  Concerts de musique classique,  Tournées musicales annuelles,  Répétitions musicales conviviales,  Communauté musicale engagée,  Passion pour la musique,  Histoire musicale depuis 1987",
  openGraph: {
      type: 'website',
      locale: 'fr_FR',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/politique-de-confidentialite`,
      siteName: 'Le Bon Tempérament',
      images: [
          {
              url: 'https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/concerts-og.png',
              width: 800,
              height: 600,
              alt: 'Le Bon Tempérament',
          },
      ],
  },
  alternates: {
      canonical: '/politique-de-confidentialite',
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Politique de confidentialité - Le Bon Temperament</title>
      </Head>
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl xl:text-4xl font-bold mb-6">Politique de confidentialité</h1>
        <section className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg xl:text-2xl font-semibold mb-4">Introduction</h2>
          <p className="mb-4">
            Votre vie privée est importante pour nous. Cette politique de confidentialité explique quelles informations nous recueillons, comment nous les utilisons et quelles options vous avez concernant ces informations.
          </p>
        </section>
        <section className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg xl:text-2xl font-semibold mb-4">Informations que nous recueillons</h2>
          <p className="mb-2">
            Nous recueillons différents types d&apos;informations pour divers objectifs, y compris pour vous fournir et améliorer notre service.
          </p>
          <ul className="list-disc pl-5 mb-4">
            <li>Informations personnelles (nom, adresse email, numéro de téléphone, etc.)</li>
            <li>Données d&apos;utilisation (adresse IP, type de navigateur, pages visitées, etc.)</li>
          </ul>
        </section>
        <section className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg xl:text-2xl font-semibold mb-4">Utilisation des données</h2>
          <p className="mb-4">
            Nous utilisons les données recueillies pour divers objectifs, tels que :
          </p>
          <ul className="list-disc pl-5 mb-4">
            <li>Fournir et maintenir notre service</li>
            <li>Vous notifier des changements de notre service</li>
            <li>Fournir un support client</li>
            <li>Analyser des informations afin d&apos;améliorer notre service</li>
          </ul>
        </section>
        <section className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg xl:text-2xl font-semibold mb-4">Partage des données</h2>
          <p className="mb-4">
            Nous ne vendons ni ne louons vos informations personnelles à des tiers. Nous pouvons partager vos informations avec des fournisseurs de services tiers pour faciliter notre service, fournir le service en notre nom, ou nous aider à analyser l&apos;utilisation de notre service.
          </p>
        </section>
        <section className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg xl:text-2xl font-semibold mb-4">Vos droits</h2>
          <p className="mb-4">
            Vous avez le droit d&apos;accéder, de corriger ou de supprimer les informations personnelles que nous avons sur vous. Si vous souhaitez exercer ces droits, veuillez nous contacter à l&apos;adresse suivante : contactbontemperament@gmail.com.
          </p>
        </section>
      </main>
    </div>
  );
}
