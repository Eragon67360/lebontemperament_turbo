import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ['latin'] })
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
    <html lang="en">
      <Analytics />
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="top-right"
          richColors
        /></body>
    </html>
  );
}
