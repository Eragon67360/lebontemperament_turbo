// hooks/useEasterEgg.ts
import { useCallback, useEffect, useState } from "react";

export const useEasterEgg = (callback: () => void) => {
  const [pressedKeys, setPressedKeys] = useState(new Set<string>());
  const [holdStartTime, setHoldStartTime] = useState<number | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  const TAP_TIMEOUT = 500;
  const REQUIRED_TAPS = 4;
  const HOLD_DURATION = 2000; // 2 seconds hold time

  const handleTap = useCallback(() => {
    const currentTime = Date.now();

    if (currentTime - lastTapTime > TAP_TIMEOUT) {
      setTapCount(1);
    } else {
      setTapCount((prev) => prev + 1);
    }

    setLastTapTime(currentTime);

    if (tapCount + 1 >= REQUIRED_TAPS) {
      callback();
      setTapCount(0);
      setLastTapTime(0);
    }
  }, [tapCount, lastTapTime, callback]);

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
      Date.now() - holdStartTime >= HOLD_DURATION
    ) {
      callback();
      setHoldStartTime(null);
      setPressedKeys(new Set());
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("touchstart", handleTap);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("touchstart", handleTap);
    };
  }, [pressedKeys, holdStartTime, callback, handleTap]);

  // Return the progress if you want to show progress
  const progress =
    holdStartTime && pressedKeys.has("b") && pressedKeys.has("t")
      ? Math.min(100, ((Date.now() - holdStartTime) / HOLD_DURATION) * 100)
      : 0;

  return progress;
};
