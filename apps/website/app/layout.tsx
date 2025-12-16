import FloatingAnniversaryButton from "@/components/anniversary/FloatingAnniversaryButton";
import { BubbleContainer } from "@/components/BubbleContainer";
import ConditionalGoogleAnalytics from "@/components/cookies/ConditionalGoogleAnalytics";
import ConditionalVercelAnalytics from "@/components/cookies/ConditionalVercelAnalytics";
import CookieConsentComponent from "@/components/cookies/CookieConsent";
import { DeveloperFootprint } from "@/components/DeveloperFootprint";
import { EasterEgg } from "@/components/EasterEgg";
import { FooterClientWrapper } from "@/components/FooterClientWrapper";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import Providers from "./providers";

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be defined");
}

export const keyword = [
  "Classical music concerts in France",
  "Baroque music ensemble performances",
  "Vocal and instrumental classical music",
  "Educational workshops for classical music",
  "Baroque opera performances",
  "Classical music CDs for sale",
  "Youth choirs classical music France",
  "Adult choirs classical music performances",
  "Classical music events in Saverne",
  "French classical music associations",
  "Concerts de musique classique en France",
  "Performances d'ensemble de musique baroque",
  "Musique classique vocale et instrumentale",
  "Ateliers éducatifs pour la musique classique",
  "Performances d'opéra baroque",
  "CD de musique classique à vendre",
  "Chœurs de jeunes musique classique France",
  "Performances de chœurs d'adultes musique classique",
  "Événements de musique classique à Saverne",
  "Associations françaises de musique classique",
];

export const metadata: Metadata = {
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/`),
  title: {
    default: "Le Bon Tempérament - Ensemble vocal et instrumental à Saverne",
    template: "%s | Le Bon Tempérament",
  },
  description:
    "Le Bon Tempérament est un ensemble vocal et instrumental renommé à Saverne, France. Rejoignez-nous pour des concerts captivants, opéras et plus encore. Découvrez nos CDs et nos événements à venir.",
  keywords: `${keyword.join(", ")}`,
  authors: [{ name: "Le Bon Tempérament" }],
  creator: "Le Bon Tempérament",
  publisher: "Le Bon Tempérament",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    siteName: "Le Bon Tempérament",
    title: "Le Bon Tempérament - Ensemble vocal et instrumental à Saverne",
    description:
      "Le Bon Tempérament est un ensemble vocal et instrumental renommé à Saverne, France. Rejoignez-nous pour des concerts captivants, opéras et plus encore.",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/default-og.png",
        width: 1200,
        height: 630,
        alt: "Le Bon Tempérament - Ensemble vocal et instrumental",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Le Bon Tempérament - Ensemble vocal et instrumental à Saverne",
    description:
      "Le Bon Tempérament est un ensemble vocal et instrumental renommé à Saverne, France.",
    images: [
      "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/default-og.png",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={roboto.className} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
/*
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   👨‍💻 Crafted with ❤️ by Thomas Moser                         ║
║                                                               ║
║   GitHub: https://github.com/Eragon67360                     ║
║   Developer & Cat Enthusiast 🐱                               ║
║                                                               ║
║   This website was built with much love and dedication        ║
║   for Le Bon Tempérament music ensemble.                     ║
║                                                               ║
║   Tech Stack:                                                 ║
║   • Next.js 16                                                ║
║   • React & TypeScript                                        ║
║   • Supabase                                                  ║
║   • TailwindCSS                                               ║
║   • Framer Motion                                             ║
║                                                               ║
║   🐈 Fun fact: I LOVE CATS! 🐈                                 ║
║                                                               ║
║   💡 Psst... type "CATS" anywhere on the site!                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
*/
`,
          }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#333333" />
        <meta
          name="developer"
          content="Thomas Moser - https://github.com/Eragon67360"
        />
        <meta name="made-with" content="❤️ and 🐱" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body className="bg-background text-foreground z-10 transition-colors duration-200">
        <CookieConsentComponent />
        <Header />
        <Providers>
          <DeveloperFootprint />
          <EasterEgg />

          {/* Skip to main content link for accessibility */}
          <a
            href="#main-content"
            className="focus:bg-primary focus:ring-primary sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-offset-2 focus:outline-none"
          >
            Aller au contenu principal
          </a>

          <main
            id="main-content"
            className="flex min-h-dvh flex-col justify-center"
          >
            <Navigation />
            {children}
            <BubbleContainer />
            <FloatingAnniversaryButton />
            <ConditionalVercelAnalytics />
            <FooterClientWrapper />
          </main>
        </Providers>
        <Toaster position="top-right" richColors />
        <ConditionalGoogleAnalytics />
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${process.env.NEXT_PUBLIC_BASE_URL}/#organization`,
              name: "Le Bon Tempérament",
              alternateName: "BT",
              url: process.env.NEXT_PUBLIC_BASE_URL,
              logo: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/logo",
              description:
                "Ensemble vocal et instrumental renommé à Saverne, France, depuis 1987",
              address: {
                "@type": "PostalAddress",
                streetAddress: "3 Rue Clemenceau",
                addressLocality: "Saverne",
                postalCode: "67700",
                addressCountry: "FR",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+33-09-52-39-57-89",
                contactType: "customer service",
                email: "lebontemperament@gmail.com",
                areaServed: "FR",
                availableLanguage: "fr",
              },
              sameAs: [
                "https://www.facebook.com/p/Le-Bon-Temp%C3%A9rament-100063069588507/",
                "https://www.instagram.com/lebontemperament_",
                "https://www.youtube.com/@lebontemperament",
                "https://www.tiktok.com/@lebontemperament",
              ],
              foundingDate: "1987",
              founder: {
                "@type": "Person",
                name: "Simone Duclos",
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
