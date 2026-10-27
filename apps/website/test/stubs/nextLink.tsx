import type { AnchorHTMLAttributes } from "react";

/**
 * `next/link` as a plain anchor: plain Node imports the real module as an
 * object, not a component, and its router needs Next's runtime.
 */
export default function Link({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
