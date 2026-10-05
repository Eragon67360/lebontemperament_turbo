"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

// The dialog (HeroUI Modal, motion, lucide icons, the meow) is fetched the
// first time the sequence is typed: nothing of it on a page until then.
const DeveloperFootprintModal = dynamic(
  () => import("./DeveloperFootprintModal"),
  { ssr: false },
);

// --- HOOK (No changes) ---
const useCatsEasterEgg = (callback: () => void) => {
  useEffect(() => {
    let typedSequence = "";
    const targetSequence = "cats";
    let timeoutId: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      clearTimeout(timeoutId);
      typedSequence = (typedSequence + e.key.toLowerCase()).slice(-4);
      if (typedSequence === targetSequence) {
        callback();
        typedSequence = "";
      }
      timeoutId = setTimeout(() => {
        typedSequence = "";
      }, 2000);
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => {
      window.removeEventListener("keypress", handleKeyPress);
      clearTimeout(timeoutId);
    };
  }, [callback]);
};

// --- THE MAIN COMPONENT ---
export const DeveloperFootprint = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Counts the openings: each one remounts the dialog on its first tab.
  const [opening, setOpening] = useState(0);

  useEffect(() => {
    const catArt = `\n |\\_/|    \n (. .) \n  =w= (\\ \n / ^ \\// \n(|| ||) \n, ""_""_ .\n`;
    console.log(
      `%c${catArt}`,
      "font-size: 16px; color: #ff6b6b; font-family: monospace; line-height: 1.2;",
    );
    console.log(
      "%c💡 Psst... try typing 'CATS' anywhere on the site!",
      "font-size: 14px; color: #888; font-style: italic;",
    );
  }, []);

  const openModal = useCallback(() => {
    setOpening((count) => count + 1);
    setIsOpen(true);
  }, []);

  useCatsEasterEgg(openModal);

  if (opening === 0) return null;

  return (
    <DeveloperFootprintModal
      key={opening}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    />
  );
};
