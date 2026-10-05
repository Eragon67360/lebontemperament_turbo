import { PageShell } from "@/components/layouts/PageShell";
import { Disclosure } from "@/components/travail/Disclosure";
import { DriveFoldersSection } from "@/components/travail/DriveFoldersSection";
import { DriveIndexOverview } from "@/components/travail/DriveIndexViews";
import {
  DriveSyncButton,
  DriveSyncProvider,
} from "@/components/travail/DriveSyncSection";
import { LegacyStorageSection } from "@/components/travail/LegacyStorageSection";
import { createClient } from "@/utils/supabase/server";

/**
 * « Partitions et documents »: the Drive index (programmes → groups →
 * documents) as the members see it, with « Synchroniser depuis Drive » as the
 * page's one primary action. The old Storage explorer (« Espace de travail »,
 * never shown to members) stays reachable at the bottom until it is retired.
 */
export default async function TravailPage() {
  const supabase = await createClient();
  const { data: programs, error } = await supabase
    .from("programs")
    .select("id, name, start_date, end_date, is_active")
    .order("start_date", { ascending: false });

  return (
    <DriveSyncProvider>
      <PageShell
        title="Partitions et documents"
        description="Les programmes, leurs groupes et leurs documents, lus dans Google Drive tels que les membres les retrouvent."
        headerAction={<DriveSyncButton />}
        contentClassName="space-y-8"
      >
        <DriveIndexOverview />

        <Disclosure label="Dossiers Drive suivis">
          <DriveFoldersSection />
        </Disclosure>

        <Disclosure label="Anciens fichiers (stockage)">
          <LegacyStorageSection programs={programs ?? []} failed={!!error} />
        </Disclosure>
      </PageShell>
    </DriveSyncProvider>
  );
}
