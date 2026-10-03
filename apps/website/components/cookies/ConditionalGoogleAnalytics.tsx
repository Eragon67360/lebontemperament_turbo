"use client";

import dynamic from "next/dynamic";
import { useConsentCategory } from "./useConsentCategory";

// The tag component's code is fetched with the consent, never before it.
const GoogleAnalytics = dynamic(
  () => import("@next/third-parties/google").then((mod) => mod.GoogleAnalytics),
  { ssr: false },
);

/** Google Analytics 4, loaded only once the "analytics" category is accepted. */
const ConditionalGoogleAnalytics = () => {
  const hasConsent = useConsentCategory("analytics");

  if (!hasConsent) {
    return null;
  }

  return <GoogleAnalytics gaId="G-J893T7P26M" />;
};

export default ConditionalGoogleAnalytics;
