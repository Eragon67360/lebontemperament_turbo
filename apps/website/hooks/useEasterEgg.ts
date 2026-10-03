// hooks/useEasterEgg.ts
import { useCallback, useEffect, useRef, useState } from "react";

const TAP_TIMEOUT = 250; // Reduced from 500ms - taps must be faster
const REQUIRED_TAPS = 6; // Increased from 4 - more taps required
const HOLD_DURATION = 2000; // 2 seconds hold time
const HOLD_TICK_MS = 50; // progress refresh while the keys are held

export const useEasterEgg = (callback: () => void) => {
  const [pressedKeys, setPressedKeys] = useState(new Set<string>());
  const [holdStartTime, setHoldStartTime] = useState<number | null>(null);
  // Milliseconds since the hold started, refreshed by the ticker below.
  const [holdElapsed, setHoldElapsed] = useState(0);
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);

  const handleTap = useCallback(() => {
    const currentTime = Date.now();
    let newTapCount: number;

    // Refs give synchronous access to the current values between renders
    if (currentTime - lastTapTimeRef.current > TAP_TIMEOUT) {
      newTapCount = 1;
    } else {
      newTapCount = tapCountRef.current + 1;
    }

    tapCountRef.current = newTapCount;
    lastTapTimeRef.current = currentTime;

    // Check with the new count value
    if (newTapCount >= REQUIRED_TAPS) {
      callback();
      tapCountRef.current = 0;
      lastTapTimeRef.current = 0;
    }
  }, [callback]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setPressedKeys((prev) => new Set([...prev, key]));

      // If both keys are pressed and we haven't started timing yet
      if (!holdStartTime && pressedKeys.has("b") && pressedKeys.has("t")) {
        setHoldStartTime(Date.now());
        setHoldElapsed(0);
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

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("touchstart", handleTap);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("touchstart", handleTap);
    };
  }, [pressedKeys, holdStartTime, handleTap]);

  const isHolding =
    holdStartTime !== null && pressedKeys.has("b") && pressedKeys.has("t");

  // While both keys are held: tick the progress, fire after HOLD_DURATION.
  useEffect(() => {
    if (!isHolding || holdStartTime === null) return;
    const tick = () => {
      const elapsed = Date.now() - holdStartTime;
      if (elapsed >= HOLD_DURATION) {
        callback();
        setHoldStartTime(null);
        setPressedKeys(new Set());
        setHoldElapsed(0);
        return;
      }
      setHoldElapsed(elapsed);
    };
    const timer = setInterval(tick, HOLD_TICK_MS);
    return () => clearInterval(timer);
  }, [isHolding, holdStartTime, callback]);

  // Return the progress if you want to show progress
  const progress = isHolding
    ? Math.min(100, (holdElapsed / HOLD_DURATION) * 100)
    : 0;

  return progress;
};
