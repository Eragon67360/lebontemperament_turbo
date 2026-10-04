"use client";

import { PageHeader } from "@/components/layouts/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useSyncExternalStore } from "react";

/** « Camille » from « Camille Martin »; empty when there is no name. */
export function firstNameOf(displayName: string | null | undefined): string {
  if (!displayName) return "";
  return displayName.trim().split(/\s+/)[0] ?? "";
}

/** « Vendredi 3 octobre 2026 ». */
export function formatTodayFr(date: Date): string {
  const text = format(date, "EEEE d MMMM yyyy", { locale: fr });
  return text.charAt(0).toLocaleUpperCase("fr-FR") + text.slice(1);
}

const subscribe = () => () => {};
// Today's date only on the client: the server has no idea of the admin's day,
// and a date rendered there would mismatch at hydration.
function useToday(): Date | null {
  const key = useSyncExternalStore(
    subscribe,
    () => new Date().toDateString(),
    () => null,
  );
  return key ? new Date(key) : null;
}

/** « Bonjour Camille », today's date and the one sentence the home starts with. */
export function DashboardWelcomeHeader() {
  const { data: user, isLoading } = useCurrentUser();
  const today = useToday();

  const name = firstNameOf(
    user?.user_metadata?.display_name || user?.user_metadata?.name,
  );

  return (
    <PageHeader
      title={
        isLoading ? (
          <>
            Bonjour{" "}
            <Skeleton
              className="inline-block h-7 w-36 align-middle"
              aria-hidden
            />
          </>
        ) : name ? (
          `Bonjour ${name}`
        ) : (
          "Bonjour"
        )
      }
      intro="Voici ce qui vous attend."
      actions={
        today && (
          <p className="text-detail text-muted-foreground lg:pt-2.5">
            <time dateTime={format(today, "yyyy-MM-dd")}>
              {formatTodayFr(today)}
            </time>
          </p>
        )
      }
    />
  );
}
