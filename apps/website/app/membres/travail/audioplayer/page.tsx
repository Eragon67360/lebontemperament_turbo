import AudioPlayer from "@/components/travail/AudioPlayer";
import { Suspense } from "react";

const AudioplayerPage = () => {
  return (
    <Suspense fallback={<div>Chargement du lecteur en cours...</div>}>
      <AudioPlayer />
    </Suspense>
  );
};

export default AudioplayerPage;
