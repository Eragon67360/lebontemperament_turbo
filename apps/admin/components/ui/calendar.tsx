"use client";

import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import {
  DateLib,
  DayButton as DayPickerDayButton,
  DayPicker,
  type DayButtonProps,
} from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * The month grid of a date field (react-day-picker 10) on direction B: the
 * days and the month arrows are 40 px ghost buttons, 44 px under a coarse
 * pointer, at full opacity; the days of the months around are
 * `text-muted-foreground` (5.6:1), never faded. In react-day-picker 9+ the
 * `day` class names the grid cell (`td`) and `day_button` the button inside
 * it; the picker puts the state classes (selected, today, outside…) on the
 * cell, so `CalendarDayButton` reads the modifiers and styles the button
 * the person presses. French by default: month, weekdays and the buttons'
 * names.
 */
function Calendar({
  className,
  classNames,
  components,
  labels,
  locale = fr,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "flex flex-col gap-4",
        month_caption:
          "pointer-coarse:h-11 pointer-coarse:px-11 flex h-10 items-center justify-center px-10",
        caption_label: "text-[15px] leading-5 font-medium",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "pointer-coarse:size-11 size-10 p-0 aria-disabled:pointer-events-none aria-disabled:opacity-55",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "pointer-coarse:size-11 size-10 p-0 aria-disabled:pointer-events-none aria-disabled:opacity-55",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground text-note pointer-coarse:w-11 w-10 font-normal",
        week: "mt-2 flex w-full",
        day: "relative p-0 text-center focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "pointer-coarse:size-11 size-10 p-0 text-sm font-normal",
        ),
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) =>
          orientation === "left" ? (
            <ChevronLeft
              aria-hidden
              className={cn("size-4", chevronClassName)}
            />
          ) : (
            <ChevronRight
              aria-hidden
              className={cn("size-4", chevronClassName)}
            />
          ),
        DayButton: CalendarDayButton,
        ...components,
      }}
      labels={{
        labelPrevious: () => "Mois précédent",
        labelNext: () => "Mois suivant",
        labelDayButton: (date, modifiers, options, dateLib) => {
          let label = (dateLib ?? new DateLib(options)).format(date, "PPPP");
          if (modifiers.today) label = `Aujourd’hui, ${label}`;
          if (modifiers.selected) label = `${label}, sélectionné`;
          return label;
        },
        ...labels,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

/**
 * One day of the grid: the picker's own button (it moves the focus with the
 * arrow keys) carrying the day's state, since the picker only gives the
 * modifiers to the cell. Today reads in soft teal, the chosen day in filled
 * teal, a day of the month before or after in `text-muted-foreground`; a
 * day that cannot be picked looks like every disabled button.
 */
function CalendarDayButton({ className, ...props }: DayButtonProps) {
  const { modifiers } = props;
  return (
    <DayPickerDayButton
      {...props}
      className={cn(
        className,
        modifiers.outside && "text-muted-foreground",
        modifiers.today && "bg-primary-soft text-primary-text",
        modifiers.selected &&
          "bg-primary-strong text-primary-foreground hover:bg-primary-strong-hover hover:text-primary-foreground",
        modifiers.range_middle && "bg-primary-soft text-foreground",
      )}
    />
  );
}

export { Calendar };
