"use client";

import { AnniversaryIcon } from "@/components/anniversary/AnniversaryIcon";
import { cn } from "@/lib/utils";
import { ICON_OPTIONS, type IconName } from "@/types/anniversary";
import { ICON_LABELS } from "@/utils/anniversary/icons";
import { Check } from "lucide-react";
import * as React from "react";

interface IconPickerProps {
  id: string;
  value: IconName | "";
  onChange: (icon: IconName) => void;
  /** Id of the label element naming the group. */
  "aria-labelledby": string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  disabled?: boolean;
}

/**
 * A radio group of the nine icons with their human names (« Calendrier »,
 * « Musique »…): arrow keys move, Space selects, one tab stop.
 */
export function IconPicker({
  id,
  value,
  onChange,
  disabled,
  ...aria
}: IconPickerProps) {
  const buttons = React.useRef<Map<IconName, HTMLButtonElement>>(new Map());
  const current = value || ICON_OPTIONS[0];

  const focusAndSelect = (index: number) => {
    const next =
      ICON_OPTIONS[(index + ICON_OPTIONS.length) % ICON_OPTIONS.length]!;
    onChange(next);
    buttons.current.get(next)?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusAndSelect(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusAndSelect(index - 1);
    }
  };

  return (
    <div
      id={id}
      role="radiogroup"
      tabIndex={-1}
      className="grid grid-cols-3 gap-2 rounded-md sm:grid-cols-5"
      {...aria}
    >
      {ICON_OPTIONS.map((iconName, index) => {
        const selected = value === iconName;
        return (
          <button
            key={iconName}
            ref={(node) => {
              if (node) buttons.current.set(iconName, node);
              else buttons.current.delete(iconName);
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={current === iconName ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(iconName)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "text-note bg-card text-foreground hover:bg-accent relative flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-md border px-2 py-2.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none",
              selected
                ? "border-primary-soft-border bg-primary-soft text-primary-text hover:bg-primary-soft"
                : "border-input",
            )}
          >
            {selected && (
              <Check
                className="absolute top-1.5 right-1.5 size-3.5"
                strokeWidth={3}
                aria-hidden
              />
            )}
            <AnniversaryIcon name={iconName} className="size-5" />
            <span>{ICON_LABELS[iconName]}</span>
          </button>
        );
      })}
    </div>
  );
}
