"use client";

import { useEffect, useState } from "react";
import { showPreferences } from "./consent";

interface CookiePreferencesButtonProps {
  className?: string;
  children?: React.ReactNode;
}

const CookiePreferencesButton = ({
  className = "",
  children = "Gérer les cookies",
}: CookiePreferencesButtonProps) => {
  // Rendered after mount, as before: the dialog only exists in the browser.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    showPreferences().catch((error) => {
      console.error("Error opening cookie preferences:", error);
    });
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
