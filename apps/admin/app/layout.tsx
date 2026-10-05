import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "BT | Admin",
  description: "Dashboard d'administration pour le site web du Bon Tempérament",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // next-themes sets the theme class on <html> before hydration.
    <html lang="fr" suppressHydrationWarning>
      <body className={cn(inter.className, "overflow-y-hidden")}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
