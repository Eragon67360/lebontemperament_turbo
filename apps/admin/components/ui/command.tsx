"use client";

import { cn } from "@/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import * as React from "react";

/**
 * cmdk dressed in B's tokens (shadcn's `command`): the list, its groups and
 * items, the keyboard handling (arrows, Enter, Home/End) come from cmdk. The
 * palette filters its own results (`utils/search/palette.ts`), so
 * `shouldFilter` is off by default.
 */
function Command({
  className,
  shouldFilter = false,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      shouldFilter={shouldFilter}
      className={cn(
        "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-xl",
        className,
      )}
      {...props}
    />
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="border-border flex h-14 items-center gap-3 border-b px-4"
    >
      <Search className="text-foreground-faint size-5 shrink-0" aria-hidden />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "placeholder:text-foreground-faint flex h-full w-full bg-transparent text-base outline-hidden disabled:cursor-not-allowed disabled:opacity-55",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[min(360px,55dvh)] scroll-py-1 overflow-x-hidden overflow-y-auto overscroll-contain p-2",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn(
        "text-detail text-muted-foreground px-3 py-8 text-center",
        className,
      )}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden py-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:uppercase",
        className,
      )}
      {...props}
    />
  );
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-foreground-faint relative flex min-h-11 cursor-default items-center gap-3 rounded-md px-3 py-2 text-[15px] outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
};
