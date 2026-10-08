"use client";

import { validConsent } from "@/components/cookies/consent";
import { useHydrated } from "@/hooks/useClientValue";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import {
  type Announcement,
  LEGACY_DONATION_ANNOUNCEMENT,
} from "@/lib/announcements";
import { Link, Tooltip } from "@heroui/react";
import {
  isAnnouncementLive,
  isExternalLink,
  LEGACY_DONATION_ANNOUNCEMENT_ID,
} from "@repo/domain/utils/announcements";
import { AnimatePresence, m } from "motion/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaHeart, FaTimes } from "react-icons/fa";

const SHOW_DELAY_MS = 1500;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// One « already seen » key per campaign (admin › Site public › Annonces), so
// a new campaign shows again. The campaign that was hard-coded before keeps
// its old key.
const storageKey = (id: string) =>
  id === LEGACY_DONATION_ANNOUNCEMENT_ID
    ? "lbt.donation-campaign-showcase.v1"
    : `lbt.donation-campaign-showcase.${id}`;

const markSeen = (id: string) => {
  try {
    localStorage.setItem(storageKey(id), "1");
  } catch {
    // Storage blocked (private mode, quota): the showcase may reappear later.
  }
};

const hasBeenSeen = (id: string) => {
  try {
    return localStorage.getItem(storageKey(id)) !== null;
  } catch {
    // Treat an unreadable store as "seen" so we never nag on every page view.
    return true;
  }
};

// Fetched once per visit (the response is the same for everyone and cached
// by the CDN). Unreachable: the campaign that was hard-coded before.
let campaignRequest: Promise<Announcement | null> | null = null;
const loadCampaign = () => {
  campaignRequest ??= fetch("/api/announcements")
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<{ donation_popover?: Announcement[] }>;
    })
    .then(
      (data) =>
        (data.donation_popover ?? []).find((a) =>
          isAnnouncementLive({ starts_on: a.startsOn, ends_on: a.endsOn }),
        ) ?? null,
    )
    .catch(() => LEGACY_DONATION_ANNOUNCEMENT);
  return campaignRequest;
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
  const [campaign, setCampaign] = useState<Announcement | null>(null);
  // The portal needs `document`: only after hydration.
  const isMounted = useHydrated();
  // The navbar is a 64px scroll container, so the card cannot live inside it.
  // It is portaled to the body and pinned to the heart's measured position.
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(
    null,
  );

  // Close when the visitor navigates elsewhere.
  useResetOnChange([pathname], () => setIsOpen(false));

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
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let scheduleShow: (() => void) | undefined;

    loadCampaign().then((current) => {
      if (cancelled || !current || hasBeenSeen(current.id)) return;
      setCampaign(current);

      // Landing on the donation page is discovery enough.
      if (pathname === "/don") {
        markSeen(current.id);
        return;
      }

      scheduleShow = () => {
        timer = setTimeout(() => {
          setIsOpen(true);
          setIsPulsing(true);
          // Mark on show, not on dismiss: seen once is seen for good.
          markSeen(current.id);
        }, SHOW_DELAY_MS);
      };

      // Never compete with the cookie consent dialog for a first-time visitor.
      if (consentResolved()) scheduleShow();
      else
        window.addEventListener("cc:onConsent", scheduleShow, { once: true });
    });

    return () => {
      cancelled = true;
      if (scheduleShow) {
        window.removeEventListener("cc:onConsent", scheduleShow);
      }
      clearTimeout(timer);
    };
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

  const title = campaign?.title ?? "";
  const body = campaign?.body ?? "";
  const external = campaign ? isExternalLink(campaign.linkUrl) : false;

  const card = campaign && (
    <>
      <div className="mb-2 flex items-start gap-2">
        <FaHeart
          size={14}
          aria-hidden="true"
          className="text-primary mt-0.5 shrink-0"
        />
        <p className="text-foreground grow text-sm font-semibold">{title}</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer l'annonce de la campagne de dons"
          className="text-muted hover:text-muted -mt-1 -mr-1 shrink-0 cursor-pointer rounded-md p-1 transition-colors"
        >
          <FaTimes size={12} aria-hidden="true" />
        </button>
      </div>
      {body && (
        <p className="text-muted mb-3 text-xs leading-relaxed">{body}</p>
      )}
      <Link
        href={campaign.linkUrl}
        onPress={dismiss}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="bg-primary-solid hover:bg-primary-solid-hover inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors"
      >
        {campaign.linkLabel ?? "Découvrir"}
      </Link>
    </>
  );

  return (
    <>
      {/* Announce once, politely, without moving focus. */}
      <p role="status" aria-live="polite" className="sr-only">
        {isOpen && campaign ? [title, body].filter(Boolean).join(". ") : ""}
      </p>

      <div className="hidden items-center lg:flex">
        <span ref={heartRef} className="relative flex">
          {isPulsing && !prefersReducedMotion && (
            <m.span
              aria-hidden="true"
              className="border-primary pointer-events-none absolute inset-0 rounded-md border-2"
              initial={{ opacity: 0.55, transform: "scale(0.85)" }}
              animate={{ opacity: 0, transform: "scale(1.45)" }}
              transition={{ duration: 0.7, repeat: 1, ease: "easeOut" }}
              onAnimationComplete={() => setIsPulsing(false)}
            />
          )}
          <Tooltip isDisabled={isOpen}>
            <Link
              href="/don"
              onPress={dismiss}
              aria-label="Faire un don à l'association"
              className={`flex size-9 items-center justify-center rounded-md transition-colors ${
                isLight
                  ? "text-white hover:bg-white/20"
                  : "text-foreground hover:bg-surface-tertiary"
              }`}
            >
              <FaHeart size={18} aria-hidden="true" />
            </Link>
            <Tooltip.Content>Faire un don</Tooltip.Content>
          </Tooltip>
        </span>
      </div>

      {isMounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && campaign && (
              <>
                {/* Desktop: anchored under the heart, with a caret pointing at it. */}
                {anchor && (
                  <m.div
                    key="desktop"
                    {...cardMotion}
                    role="region"
                    aria-label={title}
                    style={{ top: anchor.top, right: anchor.right }}
                    className="border-default-200 bg-content1 fixed z-50 hidden w-72 origin-top-right rounded-xl border p-4 shadow-lg lg:block"
                  >
                    <span
                      aria-hidden="true"
                      className="border-default-200 bg-content1 absolute -top-1 right-3.5 size-2 rotate-45 border-t border-l"
                    />
                    {card}
                  </m.div>
                )}

                {/* Below lg the heart is hidden, so the message gets its own card. */}
                <m.div
                  key="mobile"
                  {...cardMotion}
                  role="region"
                  aria-label={title}
                  className="border-default-200 bg-content1 fixed top-20 right-3 left-3 z-50 mx-auto max-w-sm origin-top rounded-xl border p-4 shadow-lg lg:hidden"
                >
                  {card}
                </m.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};

export default DonationCampaignShowcase;
