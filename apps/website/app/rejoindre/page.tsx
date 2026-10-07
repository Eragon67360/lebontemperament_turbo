import { JsonLd } from "@/components/JsonLd";
import { CONTACT_EMAIL, CONTACT_FORM_PATH } from "@/lib/contact";
import { JOINING_FACTS, REHEARSAL_SLOTS } from "@/lib/joining";
import { breadcrumbJsonLd } from "@/utils/seo";
import { Metadata } from "next";
import Link from "next/link";
import {
  IoCalendarClear,
  IoMusicalNotes,
  IoPeople,
  IoPersonAdd,
  IoTime,
} from "react-icons/io5";

export const metadata: Metadata = {
  title: "Adhésion : rejoindre le chœur à Saverne",
  description:
    "Rejoindre Le Bon Tempérament : chœurs pour tous les âges et orchestre, sans audition ni solfège. Répétitions à Wangen, Nordheim et Strasbourg, répétition d'essai, cotisation d'environ 40 € par an.",
  keywords:
    "rejoindre chœur Saverne, adhésion Le Bon Tempérament, chœur amateur Alsace, comment rejoindre ensemble vocal, intégrer chœur musique classique, adhésion chœur Saverne",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/rejoindre`,
    siteName: "Le Bon Tempérament",
    title: "Rejoindre Le Bon Tempérament - Ensemble vocal et instrumental",
    description:
      "Découvrez comment rejoindre l'ensemble vocal et instrumental Le Bon Tempérament à Saverne.",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/default-og.png",
        width: 1200,
        height: 630,
        alt: "Le Bon Tempérament - Rejoignez-nous",
      },
    ],
  },
  alternates: {
    canonical: "/rejoindre",
  },
};

/**
 * The joining steps: rendered on the page and copied into the HowTo JSON-LD,
 * so both say the same thing.
 */
const joiningSteps = [
  {
    name: "Contactez-nous",
    text: `Écrivez-nous à ${CONTACT_EMAIL} ou par le formulaire de contact, en nous disant ce que vous chantez ou jouez (ou aimeriez chanter). Nous répondons à vos questions et vous proposons une date.`,
  },
  {
    name: "Venez à une répétition d’essai",
    text: "Vous participez à une répétition pour rencontrer le chef et les membres et découvrir le répertoire. Il n’y a pas d’audition et il n’est pas nécessaire de savoir lire la musique.",
  },
  {
    name: "Vous décidez de rester",
    text: "C’est vous qui choisissez de continuer. Vous adhérez alors à l’association (environ 40 € par an pour un adulte qui travaille, partitions comprises) et participez aux répétitions, aux concerts et à la tournée d’été.",
  },
];

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Comment rejoindre Le Bon Tempérament",
  description:
    "Les étapes pour rejoindre l'ensemble vocal et instrumental Le Bon Tempérament",
  step: joiningSteps.map((step, index) => ({
    "@type": "HowToStep",
    position: index + 1,
    name: step.name,
    text: step.text,
  })),
};

export default function RejoindrePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <JsonLd
        data={breadcrumbJsonLd([{ name: "Rejoindre", path: "/rejoindre" }])}
      />
      <div className="container mx-auto mb-32 flex flex-col px-8 py-4 md:py-8 lg:py-16">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-title text-primary-400 dark:text-primary leading-none font-light">
            Rejoignez-nous
          </h1>
          <h2 className="text-title text-foreground leading-none font-bold">
            Devenez membre de l&apos;ensemble
          </h2>
          <hr className="border-separator mt-2 md:mt-4 lg:mt-8" />
          <p className="text-foreground mt-8 text-base leading-relaxed md:text-lg">
            {JOINING_FACTS.intro}
          </p>
          <p className="text-muted mt-4 text-base leading-relaxed">
            Notre ensemble se distingue par le mélange des générations, la
            diversité des parcours et l&apos;esprit de convivialité qui
            l&apos;anime.
          </p>
        </div>

        {/* Qui peut nous rejoindre */}
        <section className="mb-12">
          <div className="border-separator bg-surface-secondary rounded-lg border p-6 md:p-8">
            <h2 className="text-foreground mb-6 flex items-center gap-3 text-2xl font-semibold">
              <IoPeople className="text-primary text-3xl" />
              Qui peut nous rejoindre?
            </h2>
            <p className="text-muted mb-4 text-base leading-relaxed">
              Le Bon Tempérament est ouvert à tous ceux qui partagent notre
              passion pour la musique, quel que soit leur niveau ou leur
              parcours musical.
            </p>
            <div className="space-y-4">
              <div className="border-separator bg-background rounded-lg border p-4">
                <h3 className="text-foreground mb-2 font-semibold">
                  Choristes amateurs
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  Que vous ayez déjà chanté en chœur ou que vous souhaitiez
                  découvrir le chant choral, vous êtes les bienvenus. Aucune
                  expérience préalable n&apos;est nécessaire pour rejoindre
                  certains de nos chœurs.
                </p>
              </div>
              <div className="border-separator bg-background rounded-lg border p-4">
                <h3 className="text-foreground mb-2 font-semibold">
                  Chanteurs solistes professionnels
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  Nous accueillons également des solistes professionnels pour
                  enrichir nos performances et partager leur expertise avec
                  l&apos;ensemble.
                </p>
              </div>
              <div className="border-separator bg-background rounded-lg border p-4">
                <h3 className="text-foreground mb-2 font-semibold">
                  Instrumentistes
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  L&apos;orchestre symphonique, créé en 2023 et dirigé par
                  Charlotte Lienhard, accueille des instrumentistes de tous
                  niveaux. L&apos;orchestre se produit seul ou avec la chorale
                  lors des différents concerts de l&apos;année.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Nos chœurs */}
        <section className="mb-12">
          <h2 className="text-foreground mb-6 flex items-center gap-3 text-2xl font-semibold">
            <IoMusicalNotes className="text-primary text-3xl" />
            Nos chœurs
          </h2>
          <p className="text-muted mb-6 text-base leading-relaxed">
            Nous proposons différents chœurs adaptés à tous les âges et tous les
            niveaux :
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="border-separator bg-surface-secondary rounded-lg border p-6">
              <h3 className="text-foreground mb-3 text-xl font-semibold">
                Chœur d&apos;adultes
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Pour les chanteurs adultes de tous niveaux, dirigé par Simone
                Duclos. Ce chœur constitue le cœur de l&apos;ensemble depuis sa
                création en 1987.
              </p>
            </div>
            <div className="border-separator bg-surface-secondary rounded-lg border p-6">
              <h3 className="text-foreground mb-3 text-xl font-semibold">
                Chœur de jeunes
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Dirigé par Chloé Rozaire, ce chœur accueille les jeunes
                passionnés de musique qui souhaitent développer leur pratique
                vocale dans un cadre convivial.
              </p>
            </div>
            <div className="border-separator bg-surface-secondary rounded-lg border p-6">
              <h3 className="text-foreground mb-3 text-xl font-semibold">
                Chœur des tout-jeunes
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Dirigé par Camille Gerlier-Lienhard, où les enfants découvrent
                la musique à travers le chant, la pratique instrumentale et
                l&apos;interprétation de spectacles musicaux.
              </p>
            </div>
          </div>
        </section>

        {/* Comment nous rejoindre - HowTo Steps */}
        <section className="mb-12">
          <div className="border-separator bg-surface-secondary rounded-lg border p-6 md:p-8">
            <h2 className="text-foreground mb-6 flex items-center gap-3 text-2xl font-semibold">
              <IoPersonAdd className="text-primary text-3xl" />
              Comment nous rejoindre
            </h2>
            <ol className="space-y-6">
              {joiningSteps.map((step, index) => (
                <li
                  key={step.name}
                  className="border-separator bg-background rounded-lg border p-6"
                  itemScope
                  itemType="https://schema.org/HowToStep"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className="bg-primary-solid flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <h3
                      className="text-foreground text-xl font-semibold"
                      itemProp="name"
                    >
                      {step.name}
                    </h3>
                  </div>
                  <p className="text-muted leading-relaxed" itemProp="text">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
            <p className="text-muted mt-6 leading-relaxed">
              Pour nous écrire :{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary-text font-medium hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              ou le{" "}
              <Link
                href={CONTACT_FORM_PATH}
                className="text-primary-text font-medium hover:underline"
              >
                formulaire de contact
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Répétitions et engagement */}
        <section id="repetitions" className="mb-12 scroll-mt-24">
          <div className="border-separator bg-surface-secondary rounded-lg border p-6 md:p-8">
            <h2 className="text-foreground mb-6 flex items-center gap-3 text-2xl font-semibold">
              <IoTime className="text-primary text-3xl" />
              Répétitions et engagement
            </h2>
            <div className="space-y-4 text-base leading-relaxed">
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {REHEARSAL_SLOTS.map((slot) => (
                  <li
                    key={slot.group}
                    className="border-separator bg-background rounded-lg border p-4"
                  >
                    <h3 className="text-foreground mb-2 font-semibold">
                      {slot.group}
                    </h3>
                    <p className="text-muted text-sm">
                      {`Le ${slot.day}, ${slot.time}, ${slot.place} (${slot.rhythm}).`}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="text-muted text-sm">
                Ce sont les horaires habituels du chœur d&apos;adultes et de
                l&apos;orchestre ; le lieu et la date de votre répétition
                d&apos;essai vous sont confirmés quand vous nous contactez. Les
                chœurs d&apos;enfants et de jeunes ont leurs propres horaires.
              </p>
              <div className="border-separator bg-background rounded-lg border p-4">
                <h3 className="text-foreground mb-2 font-semibold">
                  Tournée estivale
                </h3>
                <p className="text-muted text-sm">
                  Chaque été, nous organisons une tournée de dix jours dans
                  différentes régions de France, où se peaufine le programme de
                  l&apos;année et où se tissent les liens si particuliers entre
                  les membres.
                </p>
              </div>
              <p className="text-foreground mt-4 font-medium">
                L&apos;important est la motivation et l&apos;envie de partager
                la passion pour la musique dans un esprit convivial et familial.
              </p>
            </div>
          </div>
        </section>

        {/* Avantages et bénéfices */}
        <section className="mb-12">
          <h2 className="text-foreground mb-6 text-2xl font-semibold">
            Avantages et bénéfices
          </h2>
          <div className="border-separator bg-surface-secondary rounded-lg border p-6 md:p-8">
            <p className="text-muted mb-4 text-base leading-relaxed">
              En rejoignant Le Bon Tempérament, vous bénéficiez de :
            </p>
            <ul className="text-muted space-y-3 text-base leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="text-primary-text mt-1 shrink-0">✓</span>
                <span>
                  Une pratique musicale régulière dans un cadre structuré et
                  professionnel
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-text mt-1 shrink-0">✓</span>
                <span>
                  Un esprit convivial et familial unique, où se mêlent les
                  générations
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-text mt-1 shrink-0">✓</span>
                <span>
                  La diversité des parcours et le mélange des générations,
                  enrichissant l&apos;expérience musicale
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-text mt-1 shrink-0">✓</span>
                <span>
                  La participation à des concerts et événements musicaux de
                  qualité
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-text mt-1 shrink-0">✓</span>
                <span>
                  L&apos;opportunité de découvrir un répertoire varié, de la
                  Renaissance à nos jours
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-text mt-1 shrink-0">✓</span>
                <span>
                  Des moments de partage inoubliables lors des tournées
                  estivales
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Frais et adhésion */}
        <section className="mb-12">
          <div className="border-separator bg-surface-secondary rounded-lg border p-6 md:p-8">
            <h2 className="text-foreground mb-4 flex items-center gap-3 text-2xl font-semibold">
              <IoCalendarClear className="text-primary text-3xl" />
              Frais et adhésion
            </h2>
            <p className="text-muted text-base leading-relaxed">
              {JOINING_FACTS.fee} {JOINING_FACTS.anyTime}
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <div className="bg-primary/10 rounded-lg p-8 text-center md:p-12">
          <h2 className="text-foreground mb-4 text-2xl font-semibold">
            Prêt à nous rejoindre?
          </h2>
          <p className="text-muted mb-8 text-base leading-relaxed">
            N&apos;hésitez pas à nous contacter pour discuter de votre
            intégration dans l&apos;ensemble. Nous serons ravis de vous
            accueillir et de partager notre passion pour la musique avec vous!
          </p>
          <div className="mx-auto flex w-fit flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="bg-primary-solid hover:bg-primary-solid-hover inline-block rounded-md px-8 py-3 text-center text-white transition-colors"
            >
              Nous contacter
            </Link>
            <Link
              href="/faq"
              className="border-primary text-primary-text hover:bg-primary/10 inline-block rounded-md border px-8 py-3 text-center transition-colors"
            >
              Consulter la FAQ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
