"use client";

import { Link, Tooltip } from "@heroui/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaHeart, FaTimes } from "react-icons/fa";
import { validConsent } from "vanilla-cookieconsent";

// Bump the version to re-announce a future campaign to everyone.
const STORAGE_KEY = "lbt.donation-campaign-showcase.v1";
const SHOW_DELAY_MS = 1500;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const TITLE = "Nouvelle campagne de dons";
const BODY =
  "Notre nouvelle campagne est ouverte. Découvrez à quoi peut servir chaque don — avec quelques coulisses du BT.";

const markSeen = () => {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Storage blocked (private mode, quota): the showcase may reappear later.
  }
};

const hasBeenSeen = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    // Treat an unreadable store as "seen" so we never nag on every page view.
    return true;
  }
};

const consentResolved = () => {
  try {
    return validConsent();
  } catch {
    return false;
  }
};

const DonationCampaignShowcase = ({ isLight }: { isLight: boolean }) => {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const heartRef = useRef<HTMLSpanElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // The navbar is a 64px scroll container, so the card cannot live inside it.
  // It is portaled to the body and pinned to the heart's measured position.
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(
    null,
  );

  useEffect(() => setIsMounted(true), []);

  const dismiss = useCallback(() => {
    setIsOpen(false);
    setIsPulsing(false);
  }, []);

  const measureAnchor = useCallback(() => {
    const heart = heartRef.current;
    if (!heart) return;

    const rect = heart.getBoundingClientRect();
    setAnchor({
      top: rect.bottom + 12,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  }, []);

  useEffect(() => {
    if (hasBeenSeen()) return;

    // Landing on the donation page is discovery enough.
    if (pathname === "/don") {
      markSeen();
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    const scheduleShow = () => {
      timer = setTimeout(() => {
        setIsOpen(true);
        setIsPulsing(true);
        // Mark on show, not on dismiss: seen once is seen for good.
        markSeen();
      }, SHOW_DELAY_MS);
    };

    // Never compete with the cookie consent dialog for a first-time visitor.
    if (consentResolved()) {
      scheduleShow();
      return () => clearTimeout(timer);
    }

    window.addEventListener("cc:onConsent", scheduleShow, { once: true });
    return () => {
      window.removeEventListener("cc:onConsent", scheduleShow);
      clearTimeout(timer);
    };
  }, [pathname]);

  // Close when the visitor navigates elsewhere.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    measureAnchor();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", measureAnchor);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", measureAnchor);
    };
  }, [isOpen, dismiss, measureAnchor]);

  const cardMotion = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.18 } },
        exit: { opacity: 0, transition: { duration: 0.12 } },
      }
    : {
        initial: { opacity: 0, transform: "translateY(-6px) scale(0.98)" },
        animate: {
          opacity: 1,
          transform: "translateY(0px) scale(1)",
          transition: { duration: 0.18, ease: EASE_OUT },
        },
        exit: {
          opacity: 0,
          transform: "translateY(-4px) scale(0.98)",
          transition: { duration: 0.12, ease: EASE_OUT },
        },
      };

  const card = (
    <>
      <div className="mb-2 flex items-start gap-2">
        <FaHeart
          size={14}
          aria-hidden="true"
          className="text-primary mt-0.5 shrink-0"
        />
        <p className="text-foreground grow text-sm font-semibold">{TITLE}</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer l'annonce de la campagne de dons"
          className="text-default-400 hover:text-default-600 -mt-1 -mr-1 shrink-0 cursor-pointer rounded-md p-1 transition-colors"
        >
          <FaTimes size={12} aria-hidden="true" />
        </button>
      </div>
      <p className="text-default-500 mb-3 text-xs leading-relaxed">{BODY}</p>
      <Link
        href="/don"
        onPress={dismiss}
        className="bg-primary hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors"
      >
        Découvrir
      </Link>
    </>
  );

  return (
    <>
      {/* Announce once, politely, without moving focus. */}
      <p role="status" aria-live="polite" className="sr-only">
        {isOpen ? `${TITLE}. ${BODY}` : ""}
      </p>

      <div className="hidden items-center lg:flex">
        <span ref={heartRef} className="relative flex">
          {isPulsing && !prefersReducedMotion && (
            <motion.span
              aria-hidden="true"
              className="border-primary pointer-events-none absolute inset-0 rounded-md border-2"
              initial={{ opacity: 0.55, transform: "scale(0.85)" }}
              animate={{ opacity: 0, transform: "scale(1.45)" }}
              transition={{ duration: 0.7, repeat: 1, ease: "easeOut" }}
              onAnimationComplete={() => setIsPulsing(false)}
            />
          )}
          <Tooltip content="Faire un don" isDisabled={isOpen}>
            <Link
              href="/don"
              onPress={dismiss}
              aria-label="Faire un don à l'association"
              className={`flex size-9 items-center justify-center rounded-md transition-colors ${
                isLight
                  ? "text-white hover:bg-white/20"
                  : "text-foreground hover:bg-default-200"
              }`}
            >
              <FaHeart size={18} aria-hidden="true" />
            </Link>
          </Tooltip>
        </span>
      </div>

      {isMounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Desktop: anchored under the heart, with a caret pointing at it. */}
                {anchor && (
                  <motion.div
                    key="desktop"
                    {...cardMotion}
                    role="region"
                    aria-label={TITLE}
                    style={{ top: anchor.top, right: anchor.right }}
                    className="border-default-200 bg-content1 fixed z-50 hidden w-72 origin-top-right rounded-xl border p-4 shadow-lg lg:block"
                  >
                    <span
                      aria-hidden="true"
                      className="border-default-200 bg-content1 absolute -top-1 right-3.5 size-2 rotate-45 border-t border-l"
                    />
                    {card}
                  </motion.div>
                )}

                {/* Below lg the heart is hidden, so the message gets its own card. */}
                <motion.div
                  key="mobile"
                  {...cardMotion}
                  role="region"
                  aria-label={TITLE}
                  className="border-default-200 bg-content1 fixed top-20 right-3 left-3 z-50 mx-auto max-w-sm origin-top rounded-xl border p-4 shadow-lg lg:hidden"
                >
                  {card}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};

export default DonationCampaignShowcase;

