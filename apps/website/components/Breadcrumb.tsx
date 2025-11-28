"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoChevronForward } from "react-icons/io5";

interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

const Breadcrumb = () => {
  const pathname = usePathname();

  // Skip breadcrumb for home page and members section
  if (pathname === "/" || pathname.startsWith("/membres")) {
    return null;
  }

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Accueil", href: "/" }];

    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Map segment to readable label
      const label = getSegmentLabel(segment);

      breadcrumbs.push({
        label,
        href: currentPath,
        current: index === segments.length - 1,
      });
    });

    return breadcrumbs;
  };

  const getSegmentLabel = (segment: string): string => {
    const labelMap: Record<string, string> = {
      decouvrir: "Nous découvrir",
      concerts: "Nos concerts",
      autres: "Autres concerts",
      galerie: "Galerie",
      contact: "Contact",
      membres: "Espace membres",
      impressum: "Impressum",
      "politique-de-confidentialite": "Politique de confidentialité",
    };

    return labelMap[segment] || segment;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Generate breadcrumb schema
  const generateBreadcrumbSchema = (breadcrumbs: BreadcrumbItem[]) => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_BASE_URL ||
          "https://www.lebontemperament.com";
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.label,
        item: `${baseUrl}${crumb.href}`,
      })),
    };
  };

  return (
    <>
      {typeof window !== "undefined" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbs)),
          }}
        />
      )}
      <nav aria-label="Fil d'Ariane" className="bg-gray-50 px-8 py-4 lg:px-24">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={breadcrumb.href} className="flex items-center">
              {index > 0 && (
                <IoChevronForward
                  className="mx-2 text-gray-400"
                  size={16}
                  aria-hidden="true"
                />
              )}
              {breadcrumb.current ? (
                <span className="font-medium text-gray-600" aria-current="page">
                  {breadcrumb.label}
                </span>
              ) : (
                <Link
                  href={breadcrumb.href}
                  className="text-gray-500 transition-colors hover:text-gray-700"
                  aria-label={`Aller à ${breadcrumb.label}`}
                >
                  {breadcrumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumb;
