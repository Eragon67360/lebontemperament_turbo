"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConcerts } from "@/hooks/useConcerts";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { useUsers } from "@/hooks/useUsers";
import type { NavSection } from "@/lib/navigation";
import { concertTitle, formatShortDateFr } from "@/utils/concerts/schedule";
import RouteNames from "@/utils/routes";
import {
  palettePages,
  searchItems,
  type PalettePage,
} from "@/utils/search/palette";
import { CornerDownLeft, FileText, Music2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/** How many members and concerts one search lists; typing more narrows them. */
const RESULT_LIMIT = 6;
/** Members are only listed from this many letters, so the first view stays short. */
const MIN_PEOPLE_QUERY = 2;

/**
 * The ⌘K search: Cmd+K (Ctrl+K on Windows and Linux) or the « Rechercher »
 * button opens it, a few letters jump to a page, a member or a concert, Enter
 * opens the first result, Escape closes. Members and concerts load only
 * while it is open. Matching ignores accents and capitals
 * (`utils/search/palette.ts`).
 *
 * A concert opens the concerts list: it has no page of its own.
 */
export function CommandPalette({
  sections,
  open,
  onOpenChange,
}: {
  sections: NavSection[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Each opening starts from an empty search.
  useResetOnChange([open], () => setQuery(""));

  // ⌘K / Ctrl+K from anywhere in the admin, also while typing in a field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const users = useUsers(undefined, { enabled: open, staleTime: 60_000 });
  const concerts = useConcerts({ enabled: open });

  const pages = useMemo(() => palettePages(sections), [sections]);
  const needsPeople = query.trim().length >= MIN_PEOPLE_QUERY;

  const pageResults = searchItems(
    pages,
    query,
    (page) => ({ label: page.label, extra: [page.section, page.hint] }),
    query.trim() ? RESULT_LIMIT * 2 : Infinity,
  );
  const memberResults = needsPeople
    ? searchItems(
        users.data ?? [],
        query,
        (user) => ({
          label: user.display_name || user.email,
          extra: [user.email],
        }),
        RESULT_LIMIT,
      )
    : [];
  const concertResults = needsPeople
    ? searchItems(
        concerts.data ?? [],
        query,
        (concert) => ({
          label: concertTitle(concert),
          extra: [concert.place, concert.name],
        }),
        RESULT_LIMIT,
      )
    : [];

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  const loading = needsPeople && (users.isPending || concerts.isPending);
  const noResult =
    pageResults.length + memberResults.length + concertResults.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[12dvh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-[600px] sm:p-0"
      >
        <DialogTitle className="sr-only">Rechercher</DialogTitle>
        <DialogDescription className="sr-only">
          Tapez quelques lettres pour aller à une page, à un membre ou à un
          concert.
        </DialogDescription>
        <Command label="Rechercher dans l’administration" loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Une page, un membre, un concert…"
            aria-label="Rechercher"
          />
          <CommandList>
            {noResult && !loading && (
              <CommandEmpty>
                {query.trim()
                  ? `Aucun résultat pour « ${query.trim()} ».`
                  : "Rien à afficher."}
              </CommandEmpty>
            )}
            {pageResults.length > 0 && (
              <CommandGroup heading="Pages">
                {pageResults.map((page) => (
                  <PageItem key={page.href} page={page} onSelect={go} />
                ))}
              </CommandGroup>
            )}
            {memberResults.length > 0 && (
              <CommandGroup heading="Membres">
                {memberResults.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`member-${user.id}`}
                    onSelect={() =>
                      go(RouteNames.DASHBOARD.ADMIN.USER(user.id))
                    }
                  >
                    <User aria-hidden />
                    <span className="min-w-0 flex-1 truncate">
                      {user.display_name || user.email}
                    </span>
                    {user.display_name && (
                      <span className="text-note text-muted-foreground truncate max-sm:hidden">
                        {user.email}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {concertResults.length > 0 && (
              <CommandGroup heading="Concerts">
                {concertResults.map((concert) => (
                  <CommandItem
                    key={concert.id}
                    value={`concert-${concert.id}`}
                    onSelect={() =>
                      go(RouteNames.DASHBOARD.PUBLIC.PROCHAINS_CONCERTS)
                    }
                  >
                    <Music2 aria-hidden />
                    <span className="min-w-0 flex-1 truncate">
                      {concertTitle(concert)}
                    </span>
                    <span className="text-note text-muted-foreground shrink-0">
                      {formatShortDateFr(concert.date)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {loading && (
              <div
                role="status"
                className="text-note text-muted-foreground px-3 py-2"
              >
                Recherche des membres et des concerts…
              </div>
            )}
          </CommandList>
          <div className="border-border text-note text-muted-foreground flex items-center gap-4 border-t px-4 py-2.5 max-sm:hidden">
            <span className="inline-flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              pour choisir
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd>
                <CornerDownLeft className="size-3" aria-hidden />
                <span className="sr-only">Entrée</span>
              </Kbd>
              pour ouvrir
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd>Échap</Kbd>
              pour fermer
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function PageItem({
  page,
  onSelect,
}: {
  page: PalettePage;
  onSelect: (href: string) => void;
}) {
  return (
    <CommandItem
      value={`page-${page.href}`}
      onSelect={() => onSelect(page.href)}
    >
      <FileText aria-hidden />
      <span className="min-w-0 flex-1 truncate">{page.label}</span>
      {page.section && (
        <span className="text-note text-muted-foreground shrink-0 max-sm:hidden">
          {page.section}
        </span>
      )}
    </CommandItem>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="border-border-strong bg-surface-sunken text-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-sm border px-1 font-sans text-[11px] font-medium">
      {children}
    </kbd>
  );
}
