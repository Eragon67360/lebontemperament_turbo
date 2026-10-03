import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/data-state";
import RouteNames from "@/utils/routes";
import { FileQuestion } from "lucide-react";
import Link from "next/link";

/** Stale links (old bookmarks, removed hub pages) land here with a way back. */
export default function NotFound() {
  return (
    <main className="from-primary/10 to-primary/50 flex h-dvh items-center justify-center bg-gradient-to-br p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-2">
        <EmptyState
          icon={FileQuestion}
          title="Cette page n'existe pas"
          description="Le lien est peut-être obsolète ou la page a été déplacée."
          action={
            <Button asChild>
              <Link href={RouteNames.DASHBOARD.ROOT}>
                Retour au tableau de bord
              </Link>
            </Button>
          }
        />
      </div>
    </main>
  );
}
