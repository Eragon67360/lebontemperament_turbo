"use client";

import { useEasterEgg } from "@/hooks/useEasterEgg";
import dynamic from "next/dynamic";
import { useState } from "react";

// The riddle dialog (HeroUI Modal, motion, the video carousel) is fetched the
// first time the egg is triggered: nothing of it on a page until then.
const EasterEggModal = dynamic(() => import("./EasterEggModal"), {
  ssr: false,
});

const emulateTaps = () => {
  if (process.env.NODE_ENV === "development") {
    let tapCount = 0;
    const interval = setInterval(() => {
      if (tapCount < 6) {
        window.dispatchEvent(new Event("touchstart"));
        tapCount++;
      } else {
        clearInterval(interval);
      }
    }, 100);
  }
};

const DevTapButton = () => {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <button
      onClick={emulateTaps}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "10px",
        background: "#333",
        color: "white",
        borderRadius: "5px",
        zIndex: 9999,
        display: "none",
      }}
    >
      Emulate Quad Tap
    </button>
  );
};

export const EasterEgg = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Counts the triggers: each one remounts the dialog with a fresh riddle.
  const [opening, setOpening] = useState(0);

  const handleEasterEgg = () => {
    setIsOpen(true);
    setOpening((count) => count + 1);
  };

  const progress = useEasterEgg(handleEasterEgg);

  return (
    <>
      {progress > 0 && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            backgroundColor: "#ddd",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#1a878d",
              transition: "width 0.1s ease-in-out",
            }}
          />
        </div>
      )}

      {opening > 0 && (
        <EasterEggModal
          key={opening}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
      )}

      <DevTapButton />
    </>
  );
};
