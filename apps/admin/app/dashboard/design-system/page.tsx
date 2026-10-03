import { notFound } from "next/navigation";
import { DesignSystemLab } from "./DesignSystemLab";

/**
 * Review page for the design-system foundation (direction B): every
 * primitive and building block in every state, with a theme and a density
 * switch. Inside the dashboard so the admin check applies; absent from the
 * navigation and from production.
 */
export const metadata = { title: "Système de design | BT Admin" };

export default function DesignSystemPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return <DesignSystemLab />;
}
