"use client";
import Head from "next/head";
import { usePathname } from "next/navigation";
import React from "react";

const Header = () => {
  const pathname = usePathname();
  const canonicalUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${pathname}`;

  // Définir les données structurées pour une organisation
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Le Bon Tempérament",
    url: canonicalUrl,
    logo: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`,
    sameAs: [
      "https://www.facebook.com/p/Le-Bon-Temp%C3%A9rament-100063069588507/",
      "https://www.instagram.com/lebontemperament_?igsh=bm1ndG4xNXpnZmI5",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+33-09-52-39-57-89",
      contactType: "Customer Service",
    },
  };

  return (
    <Head>
      <link rel="canonical" href={canonicalUrl} />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.css"
      ></link>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
    </Head>
  );
};

export default Header;
