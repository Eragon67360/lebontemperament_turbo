"use client";

import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { useEffect, useState } from "react";
import * as CookieConsent from "vanilla-cookieconsent";

const ConditionalGoogleAnalytics = () => {
  const [hasConsent, setHasConsent] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 50; // 5 seconds max wait time
    let intervalId: NodeJS.Timeout | null = null;

    // Wait for cookie consent to be initialized and check consent
    const checkConsent = () => {
      try {
        // Check if acceptedCategory method exists (indicates library is initialized)
        if (typeof CookieConsent.acceptedCategory === "function") {
          setIsInitialized(true);
          // Check if analytics category is accepted
          const isAccepted = CookieConsent.acceptedCategory("analytics");
          setHasConsent(isAccepted);
        } else if (retryCount < maxRetries) {
          // Cookie consent not initialized yet, retry after a short delay
          retryCount++;
          setTimeout(checkConsent, 100);
        } else {
          // Max retries reached, assume no consent
          setIsInitialized(true);
        }
      } catch (error) {
        // Error accessing consent, retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(checkConsent, 100);
        } else {
          setIsInitialized(true);
        }
      }
    };

    // Start checking for initialization
    checkConsent();

    // Poll for consent changes periodically (every 500ms) once initialized
    // This allows us to detect when user changes their preferences
    intervalId = setInterval(() => {
      try {
        if (typeof CookieConsent.acceptedCategory === "function") {
          const isAccepted = CookieConsent.acceptedCategory("analytics");
          setHasConsent(isAccepted);
        }
      } catch (error) {
        // Ignore errors during polling
      }
    }, 500);

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // Don't render anything until we've checked consent and user has consented
  if (!isInitialized || !hasConsent) {
    return null;
  }

  return (
    <>
      <GoogleAnalytics gaId="G-J893T7P26M" />
      <GoogleTagManager gtmId="G-J893T7P26M" />
    </>
  );
};

export default ConditionalGoogleAnalytics;
