import { buttonVariants } from "@heroui/react";
import type { ButtonVariants } from "@heroui/styles";
import NextLink, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkButtonProps = LinkProps &
  Pick<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "target" | "rel" | "download" | "aria-label" | "onClick" | "id" | "title"
  > &
  ButtonVariants & {
    children: ReactNode;
    className?: string;
  };

/** A Next.js link styled as a HeroUI v3 button (replaces v2 `Button as={Link}`). */
export function LinkButton({
  variant = "primary",
  size,
  fullWidth,
  isIconOnly,
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <NextLink
      {...props}
      className={buttonVariants({
        variant,
        size,
        fullWidth,
        isIconOnly,
        className,
      })}
    >
      {children}
    </NextLink>
  );
}
