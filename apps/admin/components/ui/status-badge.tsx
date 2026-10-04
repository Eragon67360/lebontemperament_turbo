import { Badge, type BadgeProps } from "@/components/ui/badge";
import * as React from "react";

export type StatusTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

const TONE_VARIANT: Record<StatusTone, NonNullable<BadgeProps["variant"]>> = {
  neutral: "secondary",
  accent: "accent",
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
};

export interface StatusBadgeProps extends Omit<BadgeProps, "variant" | "dot"> {
  tone?: StatusTone;
  /** Hide the dot when the word alone is explicit (default: shown). */
  dot?: boolean;
}

/**
 * A state in one word plus a dot: « Actif », « Invitation expirée »,
 * « À régler ». The word carries the meaning; the colour only reinforces it.
 */
export function StatusBadge({
  tone = "neutral",
  dot = true,
  ...props
}: StatusBadgeProps) {
  return <Badge variant={TONE_VARIANT[tone]} dot={dot} {...props} />;
}
