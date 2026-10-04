"use client";

import { cn } from "@/lib/utils";
import { CircleAlert } from "lucide-react";
import * as React from "react";

export type ErrorSummaryItem = {
  /** `id` of the field the message is about; the link focuses it. */
  fieldId: string;
  /** Field label as written on the page, e.g. « Date ». */
  label: string;
  /** What is wrong and what to do, e.g. « la date est passée ». */
  message: string;
};

export interface ErrorSummaryProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "onSelect"> {
  title?: React.ReactNode;
  errors: ErrorSummaryItem[];
  /** Move keyboard focus to the summary when it appears or its errors change (default true). */
  autoFocus?: boolean;
  /**
   * Called before a link focuses its field, with the field's id: a form
   * split in tabs reveals the right tab here (the focus follows once the
   * field is in the document).
   */
  onSelect?: (fieldId: string) => void;
}

/** Focuses a field once it is rendered (after a tab switch, for instance). */
function focusField(fieldId: string) {
  const attempt = () => {
    const field = document.getElementById(fieldId);
    if (!field) return false;
    field.focus();
    field.scrollIntoView({ block: "center" });
    return true;
  };
  if (!attempt()) requestAnimationFrame(() => attempt());
}

/**
 * The top-of-form summary of what to fix (direction B): a `role="alert"`
 * region, focused when shown, listing each error as a link to its field.
 * Renders nothing when there are no errors.
 */
export const ErrorSummary = React.forwardRef<HTMLDivElement, ErrorSummaryProps>(
  (
    { title, errors, autoFocus = true, onSelect, className, ...props },
    forwardedRef,
  ) => {
    const innerRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => innerRef.current!);

    const count = errors.length;
    const signature = errors.map((error) => error.fieldId).join("|");

    React.useEffect(() => {
      if (autoFocus && count > 0) innerRef.current?.focus();
    }, [autoFocus, count, signature]);

    if (count === 0) return null;

    const heading =
      title ??
      (count === 1
        ? "1 champ à corriger avant de continuer"
        : `${count} champs à corriger avant de continuer`);

    return (
      <div
        ref={innerRef}
        role="alert"
        tabIndex={-1}
        className={cn(
          "flex gap-3 rounded-lg border border-danger bg-danger-soft px-5 py-4 text-foreground",
          className,
        )}
        {...props}
      >
        <CircleAlert
          className="mt-0.5 size-6 shrink-0 text-danger"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="font-semibold text-danger-foreground">{heading}</p>
          <ul className="mt-1.5 grid gap-1 text-[15px] leading-6">
            {errors.map((error) => (
              <li key={error.fieldId}>
                <a
                  href={`#${error.fieldId}`}
                  className="rounded-sm font-medium text-danger-foreground underline underline-offset-[3px]"
                  onClick={(event) => {
                    event.preventDefault();
                    onSelect?.(error.fieldId);
                    focusField(error.fieldId);
                  }}
                >
                  {error.label}
                </a>
                <span> — {error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  },
);
ErrorSummary.displayName = "ErrorSummary";
