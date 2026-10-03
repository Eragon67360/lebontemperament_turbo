import type { Metadata } from "next";

// One-off download helper: not a page search engines should list.
export const metadata: Metadata = {
  title: "Téléchargement",
  robots: { index: false, follow: false },
};

export default function DownloadLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
