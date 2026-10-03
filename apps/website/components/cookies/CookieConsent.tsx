"use client";
import { useEffect } from "react";
import { startCookieConsent } from "./consent";
import getConfig from "./CookieConsentConfig";

/**
 * Mounts the consent banner. The library is fetched once the page has painted
 * and the browser is idle (at most two seconds later), so it never delays the
 * first paint; the banner, the stored choice and the `cc:*` events behave as
 * before.
 */
const CookieConsentComponent = () => {
  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (!cancelled) startCookieConsent(getConfig());
    };

    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(start, { timeout: 2000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(handle);
      };
    }
    const handle = window.setTimeout(start, 1);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, []);

  return <></>;
};

export default CookieConsentComponent;
