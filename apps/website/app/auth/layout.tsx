import type { Metadata } from "next";

// Utility routes (login, password reset, profile creation) must not be indexed
// and must not inherit the homepage title.
export const metadata: Metadata = {
  title: "Espace membres",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
