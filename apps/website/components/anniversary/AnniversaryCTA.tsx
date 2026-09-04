import Link from "next/link";
import type { ReactNode } from "react";

interface AnniversaryCTAProps {
  children: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}

const sizeClasses = {
  sm: "px-3 py-2 text-sm",
  md: "px-8 py-3",
};

/**
 * Shared anniversary CTA: bordered button with a primary fill sliding up on
 * hover. Pure CSS transitions (interruptible, GPU-friendly) instead of
 * motion variants.
 */
const AnniversaryCTA = ({
  children,
  href,
  external = false,
  onClick,
  type = "button",
  disabled = false,
  size = "md",
  className = "",
  ariaLabel,
}: AnniversaryCTAProps) => {
  const classes = `group border-primary/40 text-primary enabled:hover:border-primary/80 enabled:hover:text-white focus-visible:outline-primary dark:border-primary/50 relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-md border bg-transparent font-medium transition-all duration-300 enabled:active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses[size]} ${className}`;

  const content = (
    <>
      {!disabled && (
        <span
          aria-hidden="true"
          className="bg-primary absolute inset-0 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0"
        />
      )}
      <span className="relative flex items-center justify-center gap-2">
        {children}
      </span>
    </>
  );

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
          aria-label={ariaLabel}
          onClick={onClick}
        >
          {content}
        </a>
      );
    }
    return (
      <Link
        href={href}
        className={classes}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
};

export default AnniversaryCTA;
