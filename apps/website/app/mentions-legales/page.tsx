import { CONTACT_FORM_PATH } from "@/lib/contact";
import { getSiteSettings } from "@/lib/siteSettings";
import { contactAddressLine } from "@repo/domain/utils/siteSettings";
import { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du Bon Tempérament : association éditrice, direction de la publication, hébergeurs du site et des données, contact.",
  keywords:
    "Le Bon Tempérament,  Ensemble vocal et instrumental Alsace,  Concerts de musique classique,  Tournées musicales annuelles,  Répétitions musicales conviviales,  Communauté musicale engagée,  Passion pour la musique,  Histoire musicale depuis 1987",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/mentions-legales`,
    siteName: "Le Bon Tempérament",
  },
  alternates: {
    canonical: "/mentions-legales",
  },
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="text-muted font-medium">{label} :</span>
      <span className="text-foreground ml-2">{children}</span>
    </div>
  );
}

const linkClass = "text-primary-text hover:text-primary-text/80 underline";

// Contact, publisher and registry come from the site settings (admin):
// prerendered, refreshed every five minutes or when an admin saves.
export const revalidate = 300;

export default async function MentionsLegales() {
  const { contact, legal_notice } = await getSiteSettings();
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-primary/90 mb-12 text-4xl font-bold">
          Mentions légales
        </h1>

        <p className="text-foreground mb-8">
          Informations prévues par la loi n° 2004-575 du 21 juin 2004 pour la
          confiance dans l’économie numérique (LCEN) pour le site
          www.lebontemperament.com.
        </p>

        <div className="space-y-8">
          <section className="border-separator border-b pb-8">
            <h2 className="text-primary-text mb-6 text-2xl font-semibold">
              Éditeur du site
            </h2>
            <div className="space-y-4">
              <Row label="Éditeur">
                Le Bon Tempérament, association de droit local (Alsace-Moselle)
              </Row>
              <Row label="Siège">{contactAddressLine(contact)}</Row>
              {/* The president's phone, required of the publisher by the LCEN:
                  shown on this page only (owner decision, 2026-10-07, #329). */}
              <Row label="Téléphone">{legal_notice.publisherPhone}</Row>
              <Row label="E-mail">
                <a href={`mailto:${contact.email}`} className={linkClass}>
                  {contact.email}
                </a>
              </Row>
              <Row label="Formulaire">
                <Link href={CONTACT_FORM_PATH} className={linkClass}>
                  page Contact
                </Link>
              </Row>
              <Row label="SIRET">{legal_notice.siret}</Row>
              {legal_notice.registry && (
                <Row label="Registre des associations">
                  {legal_notice.registry}
                </Row>
              )}
            </div>
          </section>

          <section className="border-separator border-b pb-8">
            <h2 className="text-primary-text mb-6 text-2xl font-semibold">
              Direction de la publication
            </h2>
            <div className="space-y-4">
              <Row label="Nom">{legal_notice.publicationDirector}</Row>
              <Row label="Contact">
                <a href={`mailto:${contact.email}`} className={linkClass}>
                  {contact.email}
                </a>
              </Row>
            </div>
          </section>

          <section className="border-separator border-b pb-8">
            <h2 className="text-primary-text mb-6 text-2xl font-semibold">
              Hébergement
            </h2>
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-primary-text text-xl font-semibold">
                  Site web
                </h3>
                <Row label="Hébergeur">Vercel Inc.</Row>
                <Row label="Adresse">
                  440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis
                </Row>
                <Row label="Téléphone">+1 559 288 7060</Row>
                <Row label="Site">
                  <a href="https://vercel.com" className={linkClass}>
                    vercel.com
                  </a>
                </Row>
              </div>
              <div className="space-y-4">
                <h3 className="text-primary-text text-xl font-semibold">
                  Base de données, comptes et fichiers
                </h3>
                <Row label="Hébergeur">Supabase Pte. Ltd.</Row>
                <Row label="Adresse">
                  65 Chulia Street #38-02/03, OCBC Centre, Singapour 049513
                </Row>
                <Row label="Lieu de stockage des données">
                  Paris, France (région eu-west-3)
                </Row>
                <Row label="Site">
                  <a href="https://supabase.com" className={linkClass}>
                    supabase.com
                  </a>
                </Row>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-primary-text mb-6 text-2xl font-semibold">
              Données personnelles et cookies
            </h2>
            <p className="text-foreground">
              Les traitements de données personnelles, les cookies et vos droits
              sont décrits dans la{" "}
              <Link href="/politique-de-confidentialite" className={linkClass}>
                politique de confidentialité
              </Link>
              . Pour toute question ou demande concernant vos données :{" "}
              <a href={`mailto:${contact.email}`} className={linkClass}>
                {contact.email}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
