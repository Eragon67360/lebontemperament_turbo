const BASE = () => process.env.NEXT_PUBLIC_BASE_URL;

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: `${BASE()}/`,
      },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.name,
        item: `${BASE()}${item.path}`,
      })),
    ],
  };
}

export function webPageJsonLd({
  name,
  description,
  path,
  dateModified,
}: {
  name: string;
  description: string;
  path: string;
  dateModified?: string; // pass only a real content-change date — never fabricate
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: `${BASE()}${path}`,
    inLanguage: "fr-FR",
    ...(dateModified ? { dateModified } : {}),
    isPartOf: {
      "@type": "WebSite",
      url: `${BASE()}/`,
    },
  };
}

/**
 * `@id` of the organisation node declared once in `app/layout.tsx`
 * (`@type: ["Organization", "MusicGroup"]`). Other JSON-LD blocks reference
 * it instead of redeclaring the entity, so validators see one organisation.
 */
export const organizationId = () => `${BASE()}/#organization`;

export function organizationRef(
  type: "Organization" | "MusicGroup" = "Organization",
) {
  return {
    "@type": type,
    "@id": organizationId(),
    name: "Le Bon Tempérament",
  };
}
