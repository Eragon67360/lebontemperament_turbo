// app/dashboard/admin/google-groups/page.tsx
//
// « Liste de diffusion »: the Google Groups' addresses and their comparison
// with the roster. Outside production neither is read (utils/memberLists.ts):
// the page says so instead of loading them.
import { PageShell } from "@/components/layouts/PageShell";
import { Callout } from "@/components/ui/callout";
import {
  memberListsAvailable,
  PRODUCTION_ONLY_TITLE,
} from "@/utils/memberLists";
import { GoogleGroupsView } from "./GoogleGroupsView";

export default function GoogleGroupsPage() {
  if (memberListsAvailable()) return <GoogleGroupsView />;

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Liste de diffusion"
      description="Les adresses inscrites aux groupes Google de l'association, en lecture seule : les inscriptions se gèrent dans Google Groups."
    >
      <Callout title={PRODUCTION_ONLY_TITLE}>
        Le site de test n&apos;a pas accès aux groupes Google ni au tableau des
        membres.
      </Callout>
    </PageShell>
  );
}
