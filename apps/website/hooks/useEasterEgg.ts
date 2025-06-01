// hooks/useEasterEgg.ts
import { useEffect, useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Shake = require("shake.js");

export const useEasterEgg = (callback: () => void) => {
  const [pressedKeys, setPressedKeys] = useState(new Set<string>());
  const [holdStartTime, setHoldStartTime] = useState<number | null>(null);
  const [shakeStartTime, setShakeStartTime] = useState<number | null>(null);

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

    const shakeEvent = new Shake({
      threshold: 15, // optional shake strength threshold
      timeout: 1000, // optional, determines the frequency of event generation
    });

    const handleShakeStart = () => {
      if (!shakeStartTime) {
        setShakeStartTime(Date.now());
      }
    };

    const handleShakeStop = () => {
      setShakeStartTime(null);
    };

    // Check if both keys are pressed and held for 2 seconds
    const checkTriggers = () => {
      // Keyboard trigger
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

      // Shake trigger
      if (shakeStartTime && Date.now() - shakeStartTime >= 2000) {
        callback();
        setShakeStartTime(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      shakeEvent.start();
      window.addEventListener("shake", handleShakeStart);
      document.addEventListener("touchend", handleShakeStop);
    }

    const intervalId = setInterval(checkTriggers, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
        shakeEvent.stop();
        window.removeEventListener("shake", handleShakeStart);
        document.removeEventListener("touchend", handleShakeStop);
      }
      clearInterval(intervalId);
    };
  }, [pressedKeys, holdStartTime, shakeStartTime, callback]);

  // Return the time remaining if you want to show progress
  return holdStartTime
    ? Math.min(100, ((Date.now() - holdStartTime) / 2000) * 100)
    : shakeStartTime
      ? Math.min(100, ((Date.now() - shakeStartTime) / 2000) * 100)
      : 0;
};
