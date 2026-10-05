"use client";

import dynamic from "next/dynamic";
import { useConsentCategory } from "./useConsentCategory";

// The wrappers' code is fetched with the consent, never before it.
const VercelAnalytics = dynamic(() => import("./VercelAnalytics"), {
  ssr: false,
});

/** Vercel Analytics and Speed Insights, loaded only after consent. */
const ConditionalVercelAnalytics = () => {
  const hasConsent = useConsentCategory("analytics");

  if (!hasConsent) {
    return null;
  }

  return <VercelAnalytics />;
};

export default ConditionalVercelAnalytics;
