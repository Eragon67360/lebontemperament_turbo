import { cn } from "@/lib/utils";
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

export type CalloutTone = "info" | "success" | "warning" | "danger";

const TONES: Record<
  CalloutTone,
  { icon: LucideIcon; box: string; iconBox: string }
> = {
  info: {
    icon: Info,
    box: "border-info/40",
    iconBox: "bg-info-soft text-info",
  },
  success: {
    icon: CircleCheck,
    box: "border-success/40",
    iconBox: "bg-success-soft text-success",
  },
  warning: {
    icon: TriangleAlert,
    box: "border-warning/50",
    iconBox: "bg-warning-soft text-warning",
  },
  danger: {
    icon: CircleAlert,
    box: "border-danger/50",
    iconBox: "bg-danger-soft text-danger",
  },
};

export interface CalloutProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: CalloutTone;
  title: React.ReactNode;
  /** Buttons for what to do about it; rendered under the body. */
  actions?: React.ReactNode;
  icon?: LucideIcon;
}

/**
 * A boxed message with a title, a body and what to do next (direction B's
 * « 1 différence avec la liste des membres »). Neutral surface, coloured
 * border and icon, so it reads in both themes. Pass `role="alert"` when it
 * must be announced on appearance.
 */
export const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  (
    { tone = "info", title, actions, icon, children, className, ...props },
    ref,
  ) => {
    const config = TONES[tone];
    const Icon = icon ?? config.icon;
    return (
      <div
        ref={ref}
        data-tone={tone}
        className={cn(
          "flex gap-4 rounded-lg border bg-card p-4 text-foreground shadow-sm sm:p-5",
          config.box,
          className,
        )}
        {...props}
      >
        <span
          aria-hidden
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-md",
            config.iconBox,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base leading-6 font-semibold">{title}</p>
          {children && (
            <div className="mt-1 text-[15px] leading-6 text-muted-foreground [&_p+p]:mt-2">
              {children}
            </div>
          )}
          {actions && (
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  },
);
Callout.displayName = "Callout";
