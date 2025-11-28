import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description:
    "Trouvez les réponses aux questions les plus fréquentes sur Le Bon Tempérament, nos concerts, comment nous rejoindre, et plus encore.",
  keywords:
    "FAQ Le Bon Tempérament, questions fréquentes, rejoindre chœur Saverne, concerts musique classique, informations pratiques",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/faq`,
    siteName: "Le Bon Tempérament",
    title: "Questions fréquentes - Le Bon Tempérament",
    description:
      "Trouvez les réponses aux questions les plus fréquentes sur Le Bon Tempérament.",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/default-og.png",
        width: 1200,
        height: 630,
        alt: "Le Bon Tempérament - Questions fréquentes",
      },
    ],
  },
  alternates: {
    canonical: "/faq",
  },
};

const faqData = [
  {
    question: "Qu'est-ce que Le Bon Tempérament?",
    answer:
      "Le Bon Tempérament est un ensemble vocal et instrumental renommé basé à Saverne, en Alsace. Fondé en 1987 par Simone Duclos, l'ensemble se distingue par le mélange des générations, la diversité des parcours des chanteurs et des instrumentistes, et l'esprit de convivialité qui l'anime. Nous interprétons un répertoire varié allant de la musique classique sacrée et profane à des pièces populaires et folkloriques.",
  },
  {
    question: "Quand ont lieu les concerts du Bon Tempérament?",
    answer:
      "Le Bon Tempérament organise des concerts tout au long de l'année, avec une tournée estivale de dix jours. Les dates exactes sont disponibles sur notre page concerts. Nous répétons également un dimanche par mois, et les répétitions de pupitres ont lieu tous les 15 jours.",
  },
  {
    question: "Comment rejoindre Le Bon Tempérament?",
    answer:
      "Le Bon Tempérament accueille des choristes amateurs, des chanteurs solistes professionnels et des instrumentistes de tous horizons. Pour nous rejoindre, contactez-nous par email à lebontemperament@gmail.com ou par téléphone au (+33) 09 52 39 57 89. Nous serons ravis de vous accueillir et de discuter de votre intégration dans l'ensemble.",
  },
  {
    question: "Faut-il avoir de l'expérience musicale pour rejoindre?",
    answer:
      "Non, il n'est pas nécessaire d'avoir une expérience musicale préalable pour rejoindre certains de nos chœurs. Le Bon Tempérament accueille des membres de tous niveaux. Nous avons différents chœurs adaptés à différents niveaux : un chœur d'adultes, un chœur de jeunes, et un chœur des tout-jeunes. L'important est la motivation et l'envie de partager la passion pour la musique.",
  },
  {
    question: "Où se déroulent les concerts?",
    answer:
      "Nos concerts se déroulent principalement à Saverne et dans la région Alsace, mais nous organisons également des tournées dans d'autres régions de France. Les lieux exacts sont indiqués sur chaque affiche de concert et sur notre page concerts. Certains concerts peuvent également avoir lieu dans des églises, des salles de spectacle, ou lors de festivals.",
  },
  {
    question: "Les concerts sont-ils payants?",
    answer:
      "Les tarifs varient selon les concerts. Certains événements sont gratuits, d'autres nécessitent une réservation avec un tarif d'entrée. Les informations de tarification et de réservation sont toujours indiquées sur les affiches de concert et sur notre site web. Pour plus d'informations, n'hésitez pas à nous contacter.",
  },
  {
    question: "Qui dirige Le Bon Tempérament?",
    answer:
      "Le Bon Tempérament est dirigé par Simone Duclos depuis sa création en 1987. L'orchestre symphonique, créé en 2023, est dirigé par Charlotte Lienhard. Nous avons également Camille Gerlier-Lienhard qui dirige le chœur des enfants, et Chloé Rozaire qui dirige le chœur des jeunes.",
  },
  {
    question: "Quels types de musique sont interprétés?",
    answer:
      "Le Bon Tempérament se distingue par la diversité musicale de son répertoire. Nous interprétons des œuvres variées allant de la musique classique sacrée et profane à des pièces populaires et folkloriques, couvrant une large période musicale de la Renaissance à nos jours. Notre programme inclut notamment des opéras, de la musique baroque, des œuvres chorales contemporaines, et des adaptations de musique populaire.",
  },
  {
    question: "Comment puis-je être informé des prochains concerts?",
    answer:
      "Plusieurs moyens de rester informé : consultez régulièrement notre site web, abonnez-vous à notre newsletter en utilisant le formulaire sur la page contact, suivez-nous sur nos réseaux sociaux (Facebook, Instagram, YouTube, TikTok), ou contactez-nous directement pour être ajouté à notre liste de diffusion.",
  },
  {
    question: "Le Bon Tempérament propose-t-il des cours de musique?",
    answer:
      "Le Bon Tempérament est avant tout un ensemble de pratique musicale en groupe. Nous ne proposons pas de cours individuels, mais la participation aux répétitions et aux concerts permet d'apprendre et de progresser dans la pratique vocale et instrumentale. Les enfants découvrent la musique à travers le chant, la pratique instrumentale et l'interprétation de spectacles musicaux.",
  },
  {
    question: "Y a-t-il des frais d'adhésion?",
    answer:
      "Pour obtenir des informations précises sur les frais d'adhésion et les modalités d'inscription, nous vous invitons à nous contacter directement par email ou téléphone. Une commission de solidarité est également mise en place pour aider les membres qui en auraient besoin.",
  },
  {
    question: "Le Bon Tempérament vend-il des CDs?",
    answer:
      "Oui, Le Bon Tempérament a enregistré plusieurs CDs que vous pouvez découvrir et acheter. Consultez notre page 'Autres concerts' pour voir nos productions disponibles. Les CDs sont également disponibles lors de certains de nos concerts.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="container mx-auto mb-32 flex flex-col px-8 py-4 md:py-8 lg:py-16">
        <div className="mb-8">
          <h1 className="text-title text-primary/50 dark:text-primary leading-none font-light">
            Questions
          </h1>
          <h2 className="text-title text-foreground leading-none font-bold">
            Fréquentes
          </h2>
          <hr className="border-divider mt-2 md:mt-4 lg:mt-8" />
          <p className="text-foreground mt-8 text-base md:text-lg">
            Trouvez ci-dessous les réponses aux questions les plus fréquemment
            posées sur Le Bon Tempérament. Si vous ne trouvez pas la réponse à
            votre question, n&apos;hésitez pas à{" "}
            <Link
              href="/contact"
              className="text-primary font-medium hover:underline"
            >
              nous contacter
            </Link>
            .
          </p>
        </div>

        <div className="space-y-6">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="border-divider bg-default-50 rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md"
              itemScope
              itemType="https://schema.org/Question"
            >
              <h3
                className="text-foreground mb-3 text-xl font-semibold"
                itemProp="name"
              >
                {faq.question}
              </h3>
              <div
                className="text-default-600 dark:text-default-400 text-base leading-relaxed"
                itemScope
                itemType="https://schema.org/Answer"
                itemProp="acceptedAnswer"
              >
                <p itemProp="text">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-primary/10 mt-12 rounded-lg p-8 text-center">
          <h3 className="text-foreground mb-4 text-xl font-semibold">
            Vous avez d&apos;autres questions?
          </h3>
          <p className="text-default-600 dark:text-default-400 mb-6">
            N&apos;hésitez pas à nous contacter, nous serons ravis de vous
            répondre!
          </p>
          <Link
            href="/contact"
            className="bg-primary hover:bg-primary/90 inline-block rounded-md px-6 py-3 text-white transition-colors"
          >
            Nous contacter
          </Link>
        </div>
      </div>
    </>
  );
}
