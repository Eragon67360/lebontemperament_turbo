"use client";

import { useEffect, useState } from "react";
import { acceptedCategory } from "./consent";

/**
 * Whether the visitor accepted a cookie category. Starts as "no" (nothing
 * loads before consent) and follows the banner through the events the library
 * fires: `cc:onConsent` when a stored or fresh choice is known, `cc:onChange`
 * when the preferences change.
 */
export function useConsentCategory(category: string) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const sync = () => setAccepted(acceptedCategory(category));

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
