import { JsonLd } from "@/components/JsonLd";
import { type FaqItem, listFaq } from "@/lib/faq";
import { breadcrumbJsonLd } from "@/utils/seo";
import { createPublicClient } from "@/utils/supabase/public";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ - Questions fréquentes",
  description:
    "FAQ Le Bon Tempérament : réponses aux questions sur nos concerts, comment rejoindre l'ensemble, répétitions, tarifs et informations pratiques à Saverne.",
  keywords:
    "FAQ Le Bon Tempérament, questions fréquentes chœur Saverne, comment rejoindre ensemble vocal, informations concerts musique classique",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/faq`,
    siteName: "Le Bon Tempérament",
    title: "Questions fréquentes - Le Bon Tempérament",
    description:
      "Trouvez les réponses aux questions les plus fréquentes sur Le Bon Tempérament.",
  },
  alternates: {
    canonical: "/faq",
  },
};

// The questions come from the admin (lib/faq.ts): prerendered, refreshed
// every five minutes or when an admin saves (/api/revalidate).
export const revalidate = 300;

const faqSchema = (faqData: readonly FaqItem[]) => ({
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
});

export default async function FAQPage() {
  const faqData = await listFaq(createPublicClient());
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema(faqData)),
        }}
      />
      <JsonLd data={breadcrumbJsonLd([{ name: "FAQ", path: "/faq" }])} />
      <div className="container mx-auto mb-32 flex flex-col px-8 py-4 md:py-8 lg:py-16">
        <div className="mb-8">
          <h1>
            <span className="text-title text-primary-400 dark:text-primary block leading-none font-light">
              Questions
            </span>
            <span className="text-title text-foreground block leading-none font-bold">
              Fréquentes
            </span>
          </h1>
          <hr className="border-separator mt-2 md:mt-4 lg:mt-8" />
          <p className="text-foreground mt-8 text-base md:text-lg">
            Trouvez ci-dessous les réponses aux questions les plus fréquemment
            posées sur Le Bon Tempérament. Si vous ne trouvez pas la réponse à
            votre question, n&apos;hésitez pas à{" "}
            <Link
              href="/contact"
              className="text-primary-text font-medium hover:underline"
            >
              nous contacter
            </Link>
            .
          </p>
        </div>

        <div className="space-y-6">
          {faqData.map((faq) => (
            <div
              key={faq.question}
              className="border-separator bg-surface-secondary rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md"
              itemScope
              itemType="https://schema.org/Question"
            >
              <h2
                className="text-foreground mb-3 text-xl font-semibold"
                itemProp="name"
              >
                {faq.question}
              </h2>
              <div
                className="text-muted text-base leading-relaxed"
                itemScope
                itemType="https://schema.org/Answer"
                itemProp="acceptedAnswer"
              >
                <p itemProp="text">{faq.answer}</p>
                {faq.link && (
                  <Link
                    href={faq.link.href}
                    className="text-primary-text mt-2 inline-block font-medium hover:underline"
                  >
                    {faq.link.label}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-primary/10 mt-12 rounded-lg p-8 text-center">
          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Vous avez d&apos;autres questions?
          </h2>
          <p className="text-muted mb-6">
            N&apos;hésitez pas à nous contacter, nous serons ravis de vous
            répondre!
          </p>
          <Link
            href="/contact"
            className="bg-primary-solid hover:bg-primary-solid-hover inline-block rounded-md px-6 py-3 text-white transition-colors"
          >
            Nous contacter
          </Link>
        </div>
      </div>
    </>
  );
}
