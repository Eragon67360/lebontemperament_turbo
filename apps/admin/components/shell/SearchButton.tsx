"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** « ⌘K » on a Mac, « Ctrl K » elsewhere; nothing on the server and on phones. */
function useShortcutLabel(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      const touchOnly = window.matchMedia("(pointer: coarse)").matches;
      if (touchOnly) return "";
      const apple = /Mac|iPhone|iPad/i.test(navigator.userAgent);
      return apple ? "⌘K" : "Ctrl K";
    },
    () => "",
  );
}

/**
 * The visible way into the ⌘K search, for everyone who doesn't use shortcuts.
 * `sidebar`: a full-width field-like button at the top of the menu (it also
 * shows the shortcut). `icon`: the 44 px header button for phones and tablets.
 */
export function SearchButton({
  onClick,
  variant = "sidebar",
  className,
}: {
  onClick: () => void;
  variant?: "sidebar" | "icon";
  className?: string;
}) {
  const shortcut = useShortcutLabel();

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-11 shrink-0", className)}
        onClick={onClick}
      >
        <Search className="size-5" aria-hidden />
        <span className="sr-only">Rechercher</span>
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-input bg-card text-muted-foreground hover:border-foreground-faint hover:text-foreground flex min-h-10 w-full items-center gap-2.5 rounded-md border px-3 text-[15px] transition-colors motion-reduce:transition-none pointer-coarse:min-h-11",
        className,
      )}
    >
      <Search className="text-foreground-faint size-5 shrink-0" aria-hidden />
      <span className="flex-1 text-left">Rechercher</span>
      {shortcut && (
        <kbd className="border-border-strong bg-surface-sunken text-muted-foreground rounded-sm border px-1.5 font-sans text-[11px] leading-5 font-medium">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
