import type { Metadata } from "next";

// Delivery tracking links are private per recipient: never indexed.
export const metadata: Metadata = {
  title: "Suivi de livraison",
  robots: { index: false, follow: false },
};

export default function TrackLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
