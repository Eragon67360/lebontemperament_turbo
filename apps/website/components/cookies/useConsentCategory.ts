"use client";

import { useEffect, useState } from "react";
import * as CookieConsent from "vanilla-cookieconsent";

/**
 * Whether the visitor accepted a cookie category. Starts as "no" (nothing
 * loads before consent) and follows the banner through the events the library
 * fires: `cc:onConsent` when a stored or fresh choice is known, `cc:onChange`
 * when the preferences change.
 */
export function useConsentCategory(category: string) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const sync = () => {
      try {
        setAccepted(CookieConsent.acceptedCategory(category));
      } catch {
        setAccepted(false);
      }
    };

    sync();
    window.addEventListener("cc:onConsent", sync);
    window.addEventListener("cc:onChange", sync);
    return () => {
      window.removeEventListener("cc:onConsent", sync);
      window.removeEventListener("cc:onChange", sync);
    };
  }, [category]);

  return accepted;
}
