"use client";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { matchMembers, type MemberOption } from "@/utils/orders/members";
import { UserRound, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * « Nom de l'acheteur », typed from the paper form or chosen among the
 * members: from two letters, the matching members are proposed under the
 * field (mouse, or arrows and Entrée). Picking one links the order to their
 * account, so it shows in their members area; the link is named under the
 * field with « Retirer le lien ». Typing freely still works and never links
 * anyone by itself.
 */
export function BuyerNameField({
  id,
  label,
  value,
  onChange,
  onBlur,
  members,
  linked,
  onPick,
  onUnlink,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  members: readonly MemberOption[];
  /** The member the order is linked to, if any. */
  linked: MemberOption | null;
  onPick: (member: MemberOption) => void;
  onUnlink: () => void;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Only what the admin types is searched, not the name a pick wrote.
  const [typed, setTyped] = useState<string | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const suggestions = useMemo(
    () => (typed === null ? [] : matchMembers(members, typed)),
    [members, typed],
  );
  const expanded = open && suggestions.length > 0;

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  function choose(member: MemberOption) {
    onPick(member);
    setTyped(null);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
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
    <FormItem>
      <FormLabel htmlFor={id}>
        {label}
        <RequiredMark />
      </FormLabel>
      <div className="relative">
        <FormControl>
          <Input
            id={id}
            value={value}
            placeholder="Prénom NOM"
            autoComplete="off"
            aria-required
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={listId}
            aria-activedescendant={
              expanded && active >= 0 ? `${listId}-${active}` : undefined
            }
            onChange={(e) => {
              onChange(e.target.value);
              setTyped(e.target.value);
              setActive(-1);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // Let a click on a suggestion land before the list closes.
              blurTimer.current = setTimeout(() => setOpen(false), 150);
              onBlur();
            }}
          />
        </FormControl>
        <div
          hidden={!expanded}
          className="bg-popover text-popover-foreground absolute inset-x-0 top-full z-20 mt-1 rounded-lg border p-1 shadow-lg"
        >
          <p className="text-note text-muted-foreground px-3 pt-1.5 pb-1 font-medium">
            Parmi les membres
          </p>
          <ul id={listId} role="listbox" aria-label="Membres proposés">
            {suggestions.map((member, i) => (
              <li
                key={member.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown, not click: it comes before the field's blur.
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(member);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[15px]",
                  i === active && "bg-accent text-accent-foreground",
                )}
              >
                <UserRound
                  className="text-foreground-faint size-4 shrink-0"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block truncate">{member.name}</span>
                  {member.email && (
                    <span className="text-muted-foreground block truncate text-xs">
                      {member.email}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {linked ? (
        <div className="border-primary-soft-border bg-primary-soft flex items-center gap-2.5 rounded-md border py-1 pr-1 pl-3">
          <UserRound className="text-primary size-4 shrink-0" aria-hidden />
          <p className="text-detail min-w-0 flex-1">
            <span className="font-medium">Membre : {linked.name}</span>
            <span className="text-muted-foreground">
              {" "}
              · la commande s&apos;affiche dans son espace membre.
            </span>
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={onUnlink}
          >
            <X aria-hidden />
            Retirer le lien
          </Button>
        </div>
      ) : (
        <FormDescription>
          Tapez le nom, ou choisissez parmi les membres : la commande
          s&apos;affichera alors dans son espace membre.
        </FormDescription>
      )}
      <FormMessage />
    </FormItem>
  );
}
