"use client";

import AudioMemories from "@/components/anniversary/AudioMemories";
import MemorySharing from "@/components/anniversary/MemorySharing";
import PhotoCollection from "@/components/anniversary/PhotoCollection";
import PreviewBanner from "@/components/anniversary/PreviewBanner";
import ProgrammeArchives from "@/components/anniversary/programme/ProgrammeArchives";
import ProgrammeContents from "@/components/anniversary/programme/ProgrammeContents";
import ProgrammeCover from "@/components/anniversary/programme/ProgrammeCover";
import ProgrammeDistribution from "@/components/anniversary/programme/ProgrammeDistribution";
import ProgrammeEntracte from "@/components/anniversary/programme/ProgrammeEntracte";
import ProgrammeSeasons from "@/components/anniversary/programme/ProgrammeSeasons";
import ProgrammeTicket from "@/components/anniversary/programme/ProgrammeTicket";
import { PROGRAMME_ROOT } from "@/components/anniversary/programme/theme";
import VideoGallery from "@/components/anniversary/VideoGallery";
import type { ProgrammePoster } from "@/lib/anniversaryProgramme";
import { subscribeToAnniversaryChanges } from "@/lib/anniversaryRealtime";
import type { AnniversaryPageData } from "@/types/anniversary";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

interface AnniversaryPageClientProps {
  data: AnniversaryPageData;
  /** Recent concert posters for the archive stack (not live-updated). */
  posters: ProgrammePoster[];
  isPreview?: boolean;
}

export default function AnniversaryPageClient({
  data: initialData,
  posters,
  isPreview = false,
}: AnniversaryPageClientProps) {
  const [data, setData] = useState<AnniversaryPageData>(initialData);
  // « Signez le livre d’or » on a season prefills the memory form's year.
  const [memoryYear, setMemoryYear] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(
    () =>
      subscribeToAnniversaryChanges(supabase, { isPreview, update: setData }),
    [supabase, isPreview],
  );

  return (
    <div className={`${PROGRAMME_ROOT} min-h-screen overflow-x-clip`}>
      <PreviewBanner isPreview={isPreview} />
      <ProgrammeCover hero={data.hero} stats={data.heroStats} />
      <ProgrammeContents
        cards={data.navigationCards}
        description={data.hero.description ?? ""}
      />
      <ProgrammeSeasons
        events={data.timelineEvents}
        memories={data.featuredMemories}
        photos={data.photos}
        onWriteMemory={data.formConfig.is_enabled ? setMemoryYear : undefined}
      />
      <ProgrammeEntracte />
      <ProgrammeDistribution />
      <VideoGallery videos={data.videos} />
      <AudioMemories audioMemories={data.audioMemories} />
      <PhotoCollection photos={data.photos} />
      <ProgrammeArchives posters={posters} />
      <MemorySharing
        config={data.formConfig}
        featuredMemories={data.featuredMemories}
        prefillYear={memoryYear}
      />
      <ProgrammeTicket />
    </div>
  );
}
