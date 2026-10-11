import NextLink from "next/link";
import type { ReactNode } from "react";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-xl text-lg font-bold no-underline transition-colors";

const SIZES = {
  /** 52 px: the main buttons of a card. */
  lg: "min-h-[52px] px-5.5",
  /** 48 px: buttons repeated in a list. */
  md: "min-h-12 px-4.5",
} as const;

const VARIANTS = {
  /** Solid teal, white text (the one main action of a block). */
  solid: "bg-primary-solid text-accent-foreground hover:bg-primary-solid-hover",
  /** Outlined, for the second action. */
  outline:
    "border-members-line-strong bg-members-card text-foreground hover:bg-primary/10 border",
  /** Outlined with teal text, for a small action repeated in a list. */
  outlineTeal:
    "border-members-line-strong bg-members-card text-primary-text hover:bg-primary/10 border",
} as const;

export type MembersButtonVariant = keyof typeof VARIANTS;

/** Class names of a members-area button, for `<a>`, `<button>` and links. */
export function membersButtonClass(
  variant: MembersButtonVariant = "solid",
  className = "",
  size: keyof typeof SIZES = "lg",
) {
  return `${base} ${SIZES[size]} ${VARIANTS[variant]} ${className}`.trim();
}

/** A link that looks like a members-area button. */
export function MembersLinkButton({
  href,
  variant = "solid",
  size = "lg",
  external = false,
  className,
  children,
  ...props
}: {
  href: string;
  variant?: MembersButtonVariant;
  size?: keyof typeof SIZES;
  /** Opens in a new tab, and says so to screen readers. */
  external?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href">) {
  const classes = membersButtonClass(variant, className, size);
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        {...props}
      >
        {children}
        <span className="sr-only"> (nouvel onglet)</span>
      </a>
    );
  }
  return (
    <NextLink href={href} className={classes} {...props}>
      {children}
    </NextLink>
  );
}
