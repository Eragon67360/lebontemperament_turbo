"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useConsentCategory } from "./useConsentCategory";

/** Google Analytics 4, loaded only once the "analytics" category is accepted. */
const ConditionalGoogleAnalytics = () => {
  const hasConsent = useConsentCategory("analytics");

  if (!hasConsent) {
    return null;
  }

  return <GoogleAnalytics gaId="G-J893T7P26M" />;
};

export default ConditionalGoogleAnalytics;
