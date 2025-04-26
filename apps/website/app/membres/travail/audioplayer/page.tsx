import React, { Suspense } from "react";
import AudioPlayer from "@/components/travail/AudioPlayer";

const AudioplayerPage = () => {
  return (
    <Suspense fallback={<div>Chargement du lecteur en cours...</div>}>
      <AudioPlayer />
    </Suspense>
  );
};

export default AudioplayerPage;
