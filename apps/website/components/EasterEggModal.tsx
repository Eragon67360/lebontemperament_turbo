"use client";

import { Modal } from "@heroui/react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { SuccessMessage } from "./SuccessMessage";

const isMobile = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
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
    if (!isMobile()) {
      inputRefs[0]?.current?.focus();
    }
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
      className="flex flex-wrap justify-center gap-2"
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
            className={`h-8 w-8 rounded border-2 text-center uppercase transition-colors duration-200 focus:outline-none md:h-10 md:w-10 ${
              isError
                ? "border-red-500 focus:border-red-600"
                : "focus:border-primary border-gray-300"
            }`}
          />
        ))}
    </motion.div>
  );
};

type EasterEggModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/**
 * The riddle dialog of the "BT" easter egg, split from `EasterEgg` so its
 * code only loads once the egg is triggered. Mounted fresh on each trigger
 * (keyed by the parent), so the riddle starts over as before. Uses
 * `motion.*`: the success videos are a drag carousel, outside the shared
 * feature set.
 */
const EasterEggModal = ({ isOpen, onOpenChange }: EasterEggModalProps) => {
  const [showInitialMessage, setShowInitialMessage] = useState(true);
  const [, setCode] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const correctCode = "PICONPASTIS";

  useEffect(() => {
    if (showInitialMessage) {
      const timer = setTimeout(() => {
        setShowInitialMessage(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showInitialMessage]);

  useEffect(() => {
    if (isOpen && isMobile()) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

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

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container size="md" className="mx-0">
          <Modal.Dialog
            className="w-full max-w-[95vw] bg-white shadow-xl md:max-w-3xl md:rounded-lg dark:bg-zinc-900"
            style={{
              maxHeight: isMobile() ? "calc(100vh - 2rem)" : "80vh",
              overflowY: "auto",
            }}
          >
            <Modal.Body className="py-4 md:py-8">
              <div className="flex min-h-[200px] flex-col items-center justify-center px-2 md:px-4">
                <AnimatePresence mode="wait">
                  {showInitialMessage && (
                    <motion.div
                      key="initial"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-gradient-to-r from-[#1a878d] to-blue-600 bg-clip-text text-center text-xl font-bold text-transparent md:text-3xl"
                    >
                      Le BT est-il une secte ?
                    </motion.div>
                  )}

                  {!showInitialMessage && !isSuccess && (
                    <motion.div
                      key="code"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex w-full flex-col items-center gap-4 md:gap-6"
                    >
                      <div className="text-center text-lg font-bold md:text-xl">
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
                          className="mt-2 text-sm text-red-500 md:text-base"
                        >
                          Code incorrect, essayez encore !
                        </motion.p>
                      )}
                    </motion.div>
                  )}

                  {isSuccess && (
                    <SuccessMessage onClose={() => onOpenChange(false)} />
                  )}
                </AnimatePresence>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default EasterEggModal;
