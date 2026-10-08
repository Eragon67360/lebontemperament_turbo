import type { Metadata } from "next";

// Utility routes (login, password reset, profile creation) must not be indexed
// and must not inherit the homepage title.
export const metadata: Metadata = {
  title: "Espace membres",
  robots: { index: false, follow: false },
  // Signed-out visitors and link-preview crawlers land here from /membres:
  // the members card (auth/opengraph-image.tsx) with its own title.
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Le Bon Tempérament",
    title: "Espace membres - Le Bon Tempérament",
    description:
      "Partitions, répétitions et agenda des choristes et musiciens du Bon Tempérament, après connexion.",
  },
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
