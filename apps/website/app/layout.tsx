import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { SocialPopover } from "@/components/SocialPopover";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { EasterEgg } from "@/components/EasterEgg";

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
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
    default: "Le Bon Tempérament",
    template: "%s | Le Bon Tempérament",
  },
  description:
    "Le Bon Tempérament est un ensemble vocal et instrumental renommé à Saverne, France. Rejoignez-nous pour des concerts captivants, opéras et plus encore. Découvrez nos CDs et nos événements à venir.",
  keywords: `${keyword.join(", ")}`,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    siteName: "Le Bon Tempérament",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/default-og.png",
        width: 800,
        height: 600,
        alt: "Le Bon Tempérament",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html lang="fr">
        <Header />
        <body className={roboto.className}>
          <Providers>
            <EasterEgg />
            <main className="flex flex-col justify-center min-h-dvh bg-white dark:bg-neutral-800">
              <Navigation />
              {children}
              <SocialPopover />
              <Analytics />
              <SpeedInsights />
            </main>
            <Footer />
          </Providers>
        </body>
        <GoogleAnalytics gaId="G-J893T7P26M" />
        <GoogleTagManager gtmId="G-J893T7P26M" />
      </html>
    </>
  );
}
