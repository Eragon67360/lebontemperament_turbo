"use client";

import { useEffect, useState } from "react";
import * as CookieConsent from "vanilla-cookieconsent";

interface CookiePreferencesButtonProps {
  className?: string;
  children?: React.ReactNode;
}

const CookiePreferencesButton = ({
  className = "",
  children = "Gérer les cookies",
}: CookiePreferencesButtonProps) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if cookie consent is initialized
    const checkReady = () => {
      try {
        if (typeof CookieConsent.showPreferences === "function") {
          setIsReady(true);
        } else {
          // Retry after a short delay
          setTimeout(checkReady, 100);
        }
      } catch (error) {
        setTimeout(checkReady, 100);
      }
    };

    checkReady();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      if (typeof CookieConsent.showPreferences === "function") {
        CookieConsent.showPreferences();
      }
    } catch (error) {
      console.error("Error opening cookie preferences:", error);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className={className}
      aria-label="Gérer les préférences de cookies"
      type="button"
    >
      {children}
    </button>
  );
};

export default CookiePreferencesButton;
