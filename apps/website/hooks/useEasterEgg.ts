// hooks/useEasterEgg.ts
import { useCallback, useEffect, useState } from "react";

interface AccelerationData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export const useEasterEgg = (callback: () => void) => {
  const [pressedKeys, setPressedKeys] = useState(new Set<string>());
  const [holdStartTime, setHoldStartTime] = useState<number | null>(null);
  const [shakeStartTime, setShakeStartTime] = useState<number | null>(null);
  const [lastAcceleration, setLastAcceleration] =
    useState<AccelerationData | null>(null);

  const SHAKE_THRESHOLD = 15;

  const handleShake = useCallback(
    (acceleration: AccelerationData) => {
      if (!lastAcceleration) {
        setLastAcceleration(acceleration);
        return;
      }

      const deltaX = Math.abs(lastAcceleration.x - acceleration.x);
      const deltaY = Math.abs(lastAcceleration.y - acceleration.y);
      const deltaZ = Math.abs(lastAcceleration.z - acceleration.z);

      if (
        (deltaX > SHAKE_THRESHOLD && deltaY > SHAKE_THRESHOLD) ||
        (deltaX > SHAKE_THRESHOLD && deltaZ > SHAKE_THRESHOLD) ||
        (deltaY > SHAKE_THRESHOLD && deltaZ > SHAKE_THRESHOLD)
      ) {
        if (!shakeStartTime) {
          setShakeStartTime(Date.now());
        }
      }

      setLastAcceleration(acceleration);
    },
    [lastAcceleration, shakeStartTime],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setPressedKeys((prev) => new Set([...prev, key]));

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
      setHoldStartTime(null);
    };

    const handleMotion = (event: DeviceMotionEvent) => {
      if (event.accelerationIncludingGravity) {
        handleShake({
          x: event.accelerationIncludingGravity.x || 0,
          y: event.accelerationIncludingGravity.y || 0,
          z: event.accelerationIncludingGravity.z || 0,
          timestamp: Date.now(),
        });
      }
    };

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

    // Request permission for iOS devices
    const requestDeviceMotionPermission = async () => {
      if (
        typeof DeviceMotionEvent !== "undefined" &&
        typeof (DeviceMotionEvent as any).requestPermission === "function"
      ) {
        try {
          const permissionState = await (
            DeviceMotionEvent as any
          ).requestPermission();
          if (permissionState === "granted") {
            window.addEventListener("devicemotion", handleMotion);
          }
        } catch (error) {
          console.error("Error requesting device motion permission:", error);
        }
      } else if (
        typeof window !== "undefined" &&
        "DeviceMotionEvent" in window
      ) {
        // For non-iOS devices
        window.addEventListener("devicemotion", handleMotion);
      }
    };

    requestDeviceMotionPermission();

    const intervalId = setInterval(checkTriggers, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("devicemotion", handleMotion);
      clearInterval(intervalId);
    };
  }, [pressedKeys, holdStartTime, shakeStartTime, callback, handleShake]);

  return holdStartTime
    ? Math.min(100, ((Date.now() - holdStartTime) / 2000) * 100)
    : shakeStartTime
      ? Math.min(100, ((Date.now() - shakeStartTime) / 2000) * 100)
      : 0;
};
