import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { RosterSyncReview } from "@/components/users/sync/RosterSyncReview";
import {
  memberListsAvailable,
  PRODUCTION_ONLY_TITLE,
} from "@/utils/memberLists";
import RouteNames from "@/utils/routes";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Synchronisation de la liste des membres (#462): vérifier, choisir,
// appliquer. The dashboard layout already requires an admin session. Outside
// production the roster is not read (utils/memberLists.ts): the page says so
// instead of loading the review.
export default function UsersSyncPage() {
  if (memberListsAvailable()) return <RosterSyncReview />;

  return (
    <PageShell
      className="px-2 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8"
      title="Synchronisation de la liste des membres"
      description="Compare le tableau des membres avec les comptes du site."
      headerAction={
        <Button
          asChild
          variant="outline"
          className="min-h-11 sm:h-9 sm:min-h-0"
        >
          <Link href={RouteNames.DASHBOARD.ADMIN.USERS}>
            <ArrowLeft aria-hidden />
            Utilisateurs
          </Link>
        </Button>
      }
    >
      <Callout title={PRODUCTION_ONLY_TITLE}>
        Le site de test n&apos;a pas accès au tableau des membres.
      </Callout>
    </PageShell>
  );
}
