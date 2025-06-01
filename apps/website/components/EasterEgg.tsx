"use client";

import { useEasterEgg } from "@/hooks/useEasterEgg";
import { Modal, ModalBody, ModalContent } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { SuccessMessage } from "./SuccessMessage";

const emulateShake = () => {
  if (process.env.NODE_ENV === "development") {
    const event = new CustomEvent("shake");
    window.dispatchEvent(event);
  }
};

// Add a development-only button component
const DevShakeButton = () => {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <button
      onClick={emulateShake}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "10px",
        background: "#333",
        color: "white",
        borderRadius: "5px",
        zIndex: 9999,
      }}
    >
      Emulate Shake
    </button>
  );
};

const CodeInput = ({
  length = 11,
  onChange,
  isError = false,
}: {
  length: number;
  onChange: (value: string) => void;
  isError?: boolean;
}) => {
  const [code, setCode] = useState(Array(length).fill(""));
  const inputRefs = Array(length)
    .fill(0)
    .map(() => React.createRef<HTMLInputElement>());

  useEffect(() => {
    inputRefs[0]?.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (index: number, value: string) => {
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);

    if (value && index < length - 1) {
      inputRefs[index + 1]?.current?.focus();
    }

    onChange(newCode.join(""));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
  };

  return (
    <motion.div
      className="flex gap-2 justify-center"
      animate={
        isError
          ? {
              x: [-10, 10, -10, 10, 0],
              transition: { duration: 0.4 },
            }
          : {}
      }
    >
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <input
            key={index}
            ref={inputRefs[index]}
            type="text"
            maxLength={1}
            value={code[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`w-10 h-10 text-center border-2 rounded focus:outline-none uppercase transition-colors duration-200
                ${
                  isError
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-300 focus:border-primary"
                }`}
          />
        ))}
    </motion.div>
  );
};

export const EasterEgg = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showInitialMessage, setShowInitialMessage] = useState(true);
  const [, setCode] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const correctCode = "PICONPASTIS";

  const handleEasterEgg = () => {
    setIsOpen(true);
    setShowInitialMessage(true);
    setIsError(false);
    setIsSuccess(false);
    setCode("");
  };

  useEffect(() => {
    if (showInitialMessage) {
      const timer = setTimeout(() => {
        setShowInitialMessage(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showInitialMessage]);

  const handleCodeChange = (value: string) => {
    setCode(value);
    setIsError(false);

    if (value.length === correctCode.length) {
      if (value === correctCode) {
        setIsSuccess(true);
      } else {
        setIsError(true);
      }
    }
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

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
        <ModalContent className="min-w-3xl">
          <ModalBody className="py-8">
            <div className="flex flex-col items-center justify-center min-h-[200px]">
              <AnimatePresence mode="wait">
                {showInitialMessage && (
                  <motion.div
                    key="initial"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-3xl font-bold text-center bg-gradient-to-r from-[#1a878d] to-blue-600 text-transparent bg-clip-text"
                  >
                    Le BT est-il une secte ?
                  </motion.div>
                )}

                {!showInitialMessage && !isSuccess && (
                  <motion.div
                    key="code"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="text-xl font-bold text-center">
                      Trouve le code pour avoir la réponse
                    </div>
                    <CodeInput
                      length={11}
                      onChange={handleCodeChange}
                      isError={isError}
                    />
                    {isError && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-500 mt-2"
                      >
                        Code incorrect, essayez encore !
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {isSuccess && (
                  <SuccessMessage onClose={() => setIsOpen(false)} />
                )}
              </AnimatePresence>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      <DevShakeButton />
    </>
  );
};
