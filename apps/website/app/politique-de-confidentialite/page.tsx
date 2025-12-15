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
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-primary/90 mb-12 text-2xl font-bold xl:text-4xl">
          Politique de confidentialité
        </h1>

        <div className="space-y-8">
          <section className="border-divider border-b pb-8">
            <h2 className="text-primary/80 mb-6 text-lg font-semibold xl:text-2xl">
              Introduction
            </h2>
            <p className="text-foreground">
              Votre vie privée est importante pour nous. Cette politique de
              confidentialité explique quelles informations nous recueillons,
              comment nous les utilisons et quelles options vous avez concernant
              ces informations.
            </p>
          </section>

          <section className="border-divider border-b pb-8">
            <h2 className="text-primary/80 mb-6 text-lg font-semibold xl:text-2xl">
              Informations que nous recueillons
            </h2>
            <p className="text-foreground mb-4">
              Nous recueillons différents types d&apos;informations pour divers
              objectifs, y compris pour vous fournir et améliorer notre service.
            </p>
            <ul className="text-foreground list-disc pl-5">
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

          <section className="border-divider border-b pb-8">
            <h2 className="text-primary/80 mb-6 text-lg font-semibold xl:text-2xl">
              Utilisation des données
            </h2>
            <p className="text-foreground mb-4">
              Nous utilisons les données recueillies pour divers objectifs, tels
              que :
            </p>
            <ul className="text-foreground list-disc pl-5">
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

          <section className="border-divider border-b pb-8">
            <h2 className="text-primary/80 mb-6 text-lg font-semibold xl:text-2xl">
              Partage des données
            </h2>
            <p className="text-foreground">
              Nous ne vendons ni ne louons vos informations personnelles à des
              tiers. Nous pouvons partager vos informations avec des
              fournisseurs de services tiers pour faciliter notre service,
              fournir le service en notre nom, ou nous aider à analyser
              l&apos;utilisation de notre service.
            </p>
          </section>

          <section className="border-divider border-b pb-8">
            <h2 className="text-primary/80 mb-6 text-lg font-semibold xl:text-2xl">
              Utilisation des cookies
            </h2>
            <p className="text-foreground mb-4">
              Notre site utilise des cookies pour améliorer votre expérience de
              navigation et analyser l&apos;utilisation du site. Vous pouvez
              gérer vos préférences de cookies à tout moment via le panneau de
              gestion des cookies accessible en bas à gauche de chaque page.
            </p>
            <h3 className="text-primary/70 mt-6 mb-4 text-base font-semibold xl:text-xl">
              Cookies strictement nécessaires
            </h3>
            <p className="text-foreground mb-4">
              Ces cookies sont essentiels au bon fonctionnement du site Web et
              ne peuvent pas être désactivés. Ils sont généralement définis en
              réponse à des actions que vous effectuez et qui équivalent à une
              demande de services, comme la définition de vos préférences de
              confidentialité, la connexion ou le remplissage de formulaires.
            </p>
            <ul className="text-foreground mb-6 list-disc pl-5">
              <li className="mb-2">
                <strong>__cf_bm</strong> (clerk.lebontemperament.com) : Utilisé
                pour distinguer les humains des robots. Durée : 1 jour
              </li>
              <li className="mb-2">
                <strong>CookieConsent</strong> (lebontemperament.com) : Stocke
                l&apos;état de consentement aux cookies de l&apos;utilisateur.
                Durée : 1 an
              </li>
              <li className="mb-2">
                <strong>SERVERID</strong> (lebontemperament.com) : Utilisé pour
                l&apos;équilibrage de charge. Durée : Session
              </li>
              <li className="mb-2">
                <strong>__clerk_db_jwt</strong> (lebontemperament.com) : Cookie
                d&apos;authentification pour les fonctionnalités membres. Durée
                : Session
              </li>
            </ul>

            <h3 className="text-primary/70 mt-6 mb-4 text-base font-semibold xl:text-xl">
              Cookies d&apos;analyse et de performance
            </h3>
            <p className="text-foreground mb-4">
              Ces cookies nous permettent de compter les visites et les sources
              de trafic afin d&apos;améliorer les performances de notre site.
              Toutes les informations que ces cookies recueillent sont agrégées
              et donc anonymes. Si vous n&apos;autorisez pas ces cookies, nous
              ne saurons pas quand vous avez visité notre site.
            </p>
            <ul className="text-foreground mb-6 list-disc pl-5">
              <li className="mb-2">
                <strong>_ga, _gid, _gat</strong> : Cookies Google Analytics
                utilisés pour suivre et analyser l&apos;utilisation du site web.
                Les données sont anonymisées.
              </li>
              <li className="mb-2">
                <strong>__utma, __utmb, __utmc, __utmz</strong> : Cookies Google
                Analytics (ancienne version) pour le suivi des sessions et des
                sources de trafic.
              </li>
            </ul>
            <p className="text-foreground mb-4">
              <strong>Services utilisés :</strong> Google Analytics, Vercel
              Analytics, Vercel Speed Insights
            </p>

            <h3 className="text-primary/70 mt-6 mb-4 text-base font-semibold xl:text-xl">
              Cookies de ciblage et publicité
            </h3>
            <p className="text-foreground mb-4">
              Ces cookies peuvent être définis par nos partenaires publicitaires
              sur notre site pour créer un profil de vos intérêts et vous
              montrer des publicités pertinentes sur d&apos;autres sites. Ils ne
              stockent pas directement d&apos;informations personnelles, mais
              sont basés sur l&apos;identification unique de votre navigateur et
              de votre appareil Internet.
            </p>
            <ul className="text-foreground mb-6 list-disc pl-5">
              <li className="mb-2">
                <strong>Cookies YouTube</strong> : Lorsque vous regardez des
                vidéos YouTube intégrées sur notre site, YouTube peut définir
                des cookies pour suivre vos préférences et votre activité.
              </li>
              <li className="mb-2">
                <strong>Cookies Google</strong> : Utilisés pour la
                personnalisation des publicités et le suivi des interactions
                avec les services Google.
              </li>
            </ul>
            <p className="text-foreground mb-4">
              <strong>Services utilisés :</strong> YouTube (vidéos intégrées),
              Google Ads (si applicable)
            </p>

            <h3 className="text-primary/70 mt-6 mb-4 text-base font-semibold xl:text-xl">
              Gestion de vos préférences de cookies
            </h3>
            <p className="text-foreground mb-4">
              Vous pouvez modifier vos préférences de cookies à tout moment en
              cliquant sur le lien &quot;Gérer les préférences&quot; dans le
              bandeau de consentement aux cookies, ou en utilisant le lien
              disponible dans le pied de page de chaque page.
            </p>
            <p className="text-foreground">
              Pour plus d&apos;informations sur la façon dont nous utilisons les
              cookies et vos droits, veuillez consulter notre{" "}
              <a
                href="/politique-de-confidentialite"
                className="text-primary hover:text-primary/80 underline"
              >
                politique de confidentialité
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-primary/80 mb-6 text-lg font-semibold xl:text-2xl">
              Vos droits RGPD
            </h2>
            <p className="text-foreground mb-4">
              Conformément au Règlement Général sur la Protection des Données
              (RGPD), vous disposez des droits suivants concernant vos données
              personnelles :
            </p>
            <ul className="text-foreground mb-4 list-disc pl-5">
              <li className="mb-2">
                <strong>Droit d&apos;accès</strong> : Vous avez le droit de
                savoir quelles données personnelles nous détenons sur vous.
              </li>
              <li className="mb-2">
                <strong>Droit de rectification</strong> : Vous pouvez demander
                la correction de données inexactes ou incomplètes.
              </li>
              <li className="mb-2">
                <strong>Droit à l&apos;effacement</strong> : Vous pouvez
                demander la suppression de vos données personnelles dans
                certaines circonstances.
              </li>
              <li className="mb-2">
                <strong>Droit à la limitation du traitement</strong> : Vous
                pouvez demander la limitation du traitement de vos données.
              </li>
              <li className="mb-2">
                <strong>Droit à la portabilité</strong> : Vous pouvez demander à
                recevoir vos données dans un format structuré.
              </li>
              <li className="mb-2">
                <strong>Droit d&apos;opposition</strong> : Vous pouvez vous
                opposer au traitement de vos données personnelles.
              </li>
              <li className="mb-2">
                <strong>Droit de retirer votre consentement</strong> : Vous
                pouvez retirer votre consentement à tout moment pour les cookies
                non essentiels.
              </li>
            </ul>
            <p className="text-foreground">
              Pour exercer ces droits, veuillez nous contacter à l&apos;adresse
              suivante :{" "}
              <a
                href="mailto:contactbontemperament@gmail.com"
                className="text-primary hover:text-primary/80 underline"
              >
                contactbontemperament@gmail.com
              </a>
              . Nous répondrons à votre demande dans un délai d&apos;un mois.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
