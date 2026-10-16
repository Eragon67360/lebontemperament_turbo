"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { OptionalMark } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  addressQuery,
  type AddressSuggestion,
} from "@repo/domain/utils/addressSearch";
import { MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

const DEBOUNCE_MS = 250;

async function fetchSuggestions(
  query: string,
  signal: AbortSignal,
): Promise<AddressSuggestion[]> {
  const res = await fetch(
    `/api/orders/address-search?q=${encodeURIComponent(query)}`,
    { signal },
  );
  if (!res.ok) return [];
  const body = (await res.json()) as { suggestions?: AddressSuggestion[] };
  return body.suggestions ?? [];
}

/**
 * The buyer's address with suggestions from the national address base: type
 * a few words, pick a line (mouse, or arrows and Entrée), and the field holds
 * « 31a Rue des Vignes 67520 Wangen », the form the round's map finds. Typing
 * freely still works: suggestions only help, and a geocoder that is down
 * leaves a plain text field.
 */
export function AddressField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  hint,
  placeholder,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  id: string;
  label: string;
  hint?: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={id}>
            {label}
            <OptionalMark />
          </FormLabel>
          <AddressInput
            id={id}
            value={(field.value as string | undefined) ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={placeholder}
          />
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function AddressInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
}) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Only what the admin types is searched, not a picked suggestion or the
  // order's saved address when the dialog opens.
  const [typed, setTyped] = useState<string | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const query = typed === null ? null : addressQuery(typed);
    if (!query) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchSuggestions(query, controller.signal)
        .then((found) => {
          setSuggestions(found);
          setActive(-1);
          setOpen(found.length > 0);
        })
        .catch(() => {
          // Aborted by the next keystroke, or offline: no suggestion.
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [typed]);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const expanded = open && suggestions.length > 0;

  function choose(suggestion: AddressSuggestion) {
    onChange(suggestion.label);
    setTyped(null);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!expanded) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(suggestions[active]!);
    } else if (e.key === "Escape") {
      // Closes the list, not the dialog.
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div>
      <FormControl>
        <Textarea
          id={id}
          rows={2}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={
            expanded && active >= 0 ? `${listId}-${active}` : undefined
          }
          className="min-h-0"
          onChange={(e) => {
            onChange(e.target.value);
            setTyped(e.target.value);
            if (!addressQuery(e.target.value)) {
              setSuggestions([]);
              setOpen(false);
            }
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(suggestions.length > 0)}
          onBlur={() => {
            // Let a click on a suggestion land before the list closes.
            blurTimer.current = setTimeout(() => setOpen(false), 150);
            onBlur();
          }}
        />
      </FormControl>
      <ul
        id={listId}
        role="listbox"
        aria-label="Adresses proposées"
        hidden={!expanded}
        className="bg-popover text-popover-foreground mt-1 rounded-lg border p-1 shadow-lg"
      >
        {suggestions.map((s, i) => (
          <li
            key={s.label}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            // mousedown, not click: it comes before the field's blur.
            onMouseDown={(e) => {
              e.preventDefault();
              choose(s);
            }}
            onMouseEnter={() => setActive(i)}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[15px]",
              i === active && "bg-accent text-accent-foreground",
            )}
          >
            <MapPin
              className="text-foreground-faint size-4 shrink-0"
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block">{s.label}</span>
              {s.context && (
                <span className="text-muted-foreground block text-xs">
                  {s.context}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
