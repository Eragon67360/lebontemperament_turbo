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

  return (
    <nav aria-label="Fil d'Ariane" className="px-8 lg:px-24 py-4 bg-gray-50">
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
              <span className="text-gray-600 font-medium" aria-current="page">
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label={`Aller à ${breadcrumb.label}`}
              >
                {breadcrumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
