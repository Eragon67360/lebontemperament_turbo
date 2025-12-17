"use client";

import AnniversaryLanding from "@/components/anniversary/AnniversaryLanding";
import AnniversaryNavigation from "@/components/anniversary/AnniversaryNavigation";
import AnniversaryTimeline from "@/components/anniversary/AnniversaryTimeline";
import AudioMemories from "@/components/anniversary/AudioMemories";
import MemorySharing from "@/components/anniversary/MemorySharing";
import PhotoCollection from "@/components/anniversary/PhotoCollection";
import VideoGallery from "@/components/anniversary/VideoGallery";
import type { AnniversaryPageData } from "@/types/anniversary";

interface AnniversaryPageClientProps {
  data: AnniversaryPageData;
}

export default function AnniversaryPageClient({
  data,
}: AnniversaryPageClientProps) {
  return (
    <div className="bg-background min-h-screen">
      <AnniversaryLanding hero={data.hero} stats={data.heroStats} />
      <AnniversaryNavigation cards={data.navigationCards} />
      <AnniversaryTimeline events={data.timelineEvents} />
      <VideoGallery videos={data.videos} />
      <AudioMemories audioMemories={data.audioMemories} />
      <PhotoCollection photos={data.photos} />
      <MemorySharing
        config={data.formConfig}
        featuredMemories={data.featuredMemories}
      />
    </div>
  );
}
