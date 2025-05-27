// hooks/useEasterEgg.ts
import { useEffect, useState } from "react";

export const useEasterEgg = (callback: () => void) => {
  const [pressedKeys, setPressedKeys] = useState(new Set<string>());
  const [holdStartTime, setHoldStartTime] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setPressedKeys((prev) => new Set([...prev, key]));

      // If both keys are pressed and we haven't started timing yet
      if (!holdStartTime && pressedKeys.has("b") && pressedKeys.has("t")) {
        setHoldStartTime(Date.now());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setPressedKeys((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });

      // Reset hold timer when any key is released
      setHoldStartTime(null);
    };

    // Check if both keys are pressed and held for 2 seconds
    if (
      holdStartTime &&
      pressedKeys.has("b") &&
      pressedKeys.has("t") &&
      Date.now() - holdStartTime >= 2000
    ) {
      callback();
      setHoldStartTime(null);
      setPressedKeys(new Set());
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [pressedKeys, holdStartTime, callback]);

  // Return the time remaining if you want to show progress
  return holdStartTime
    ? Math.min(100, ((Date.now() - holdStartTime) / 2000) * 100)
    : 0;
};
