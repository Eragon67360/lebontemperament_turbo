"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useConsentCategory } from "./useConsentCategory";

/** Vercel Analytics and Speed Insights, loaded only after consent. */
const ConditionalVercelAnalytics = () => {
  const hasConsent = useConsentCategory("analytics");

  if (!hasConsent) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
};

export default ConditionalVercelAnalytics;
