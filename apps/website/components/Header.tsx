"use client";
import Head from "next/head";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();
  const canonicalUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${pathname}`;

  // Définir les données structurées pour une organisation
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Le Bon Tempérament",
    alternateName: "BT",
    url: process.env.NEXT_PUBLIC_BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    image: `${process.env.NEXT_PUBLIC_BASE_URL}/img/bt_logo.webp`,
    description: "Ensemble vocal et instrumental renommé à Saverne, France",
    foundingDate: "1987",
    address: {
      "@type": "PostalAddress",
      streetAddress: "3 Rue Clémenceau",
      addressLocality: "Saverne",
      postalCode: "67700",
      addressCountry: "FR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+33-09-52-39-57-89",
      email: "lebontemperament@gmail.com",
      contactType: "Customer Service",
      availableLanguage: "French",
    },
    sameAs: [
      "https://www.facebook.com/p/Le-Bon-Temp%C3%A9rament-100063069588507/",
      "https://www.instagram.com/lebontemperament_?igsh=bm1ndG4xNXpnZmI5",
      "https://www.youtube.com/@lebontemperament",
      "https://www.tiktok.com/@lebontemperament",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Concerts et CDs",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Concerts de musique classique",
            description: "Performances d'ensemble vocal et instrumental",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: "CDs de musique classique",
            description: "Enregistrements de nos performances",
          },
        },
      ],
    },
  };

  // Helper function to get page title
  const getPageTitle = (path: string): string => {
    const titleMap: { [key: string]: string } = {
      "/concerts": "Nos Concerts",
      "/concerts/autres": "CDs",
      "/decouvrir": "Nous Découvrir",
      "/galerie": "Galerie",
      "/contact": "Contact",
      "/impressum": "Impressum",
      "/politique-de-confidentialite": "Politique de Confidentialité",
      "/membres": "Espace Membres",
    };

    return titleMap[path] || "Page";
  };

  // Breadcrumb structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: process.env.NEXT_PUBLIC_BASE_URL,
      },
      ...(pathname !== "/"
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: getPageTitle(pathname),
              item: canonicalUrl,
            },
          ]
        : []),
    ],
  };

  // Website structured data with search action
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Le Bon Tempérament",
    url: process.env.NEXT_PUBLIC_BASE_URL,
    description:
      "Site officiel de l'ensemble vocal et instrumental Le Bon Tempérament",
    inLanguage: "fr-FR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Head>
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="fr" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.css"
      />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </Head>
  );
};

export default Header;
