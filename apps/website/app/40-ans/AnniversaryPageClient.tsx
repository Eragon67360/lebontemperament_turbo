"use client";

import AnniversaryLanding from "@/components/anniversary/AnniversaryLanding";
import AnniversaryNavigation from "@/components/anniversary/AnniversaryNavigation";
import AnniversaryTimeline from "@/components/anniversary/AnniversaryTimeline";
import AudioMemories from "@/components/anniversary/AudioMemories";
import MemorySharing from "@/components/anniversary/MemorySharing";
import PhotoCollection from "@/components/anniversary/PhotoCollection";
import VideoGallery from "@/components/anniversary/VideoGallery";

export default function AnniversaryPageClient() {
  return (
    <div className="bg-background min-h-screen">
      <AnniversaryLanding />
      <AnniversaryNavigation />
      <AnniversaryTimeline />
      <VideoGallery />
      <AudioMemories />
      <PhotoCollection />
      <MemorySharing />
    </div>
  );
}
