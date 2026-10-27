"use client";

import { useEffect, useRef, type RefObject } from "react";

/** What Tab reaches inside the dialog; the browser already skips disabled controls. */
const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/**
 * The keyboard and focus contract of a hand-made modal overlay (the
 * anniversary lightboxes keep their own markup, which HeroUI's `Modal`
 * would redraw). Give the overlay `role="dialog"`, `aria-modal="true"`, a
 * label and `tabIndex={-1}`. While `isOpen`, the focus moves onto it, Tab
 * and Shift+Tab stay inside it, Escape calls `onClose` and the page behind
 * stops scrolling. When it closes, the focus returns to the element that
 * opened it.
 */
export function useModalDialog(
  dialogRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
) {
  // Callers pass inline arrows: read the latest one without re-running the effect.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.focus({ preventScroll: true });

    const tabbables = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(TABBABLE)).filter(
        (element) => element.getClientRects().length > 0,
      );

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = tabbables();
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside =
        active instanceof Node && active !== dialog && dialog.contains(active);
      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    // Focus that still lands outside (a Shift+Tab out of an embedded player) comes back.
    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) {
        dialog.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      document.body.style.overflow = bodyOverflow;
      opener?.focus({ preventScroll: true });
    };
  }, [dialogRef, isOpen]);
}
