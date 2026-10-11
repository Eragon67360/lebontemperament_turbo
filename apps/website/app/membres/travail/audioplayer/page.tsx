import AudioPlayer from "@/components/travail/AudioPlayer";
import { Suspense } from "react";

const AudioplayerPage = () => {
  return (
    <Suspense fallback={<p role="status">Chargement du lecteur en cours…</p>}>
      <AudioPlayer />
    </Suspense>
  );
};

export default AudioplayerPage;
