"use client";

import { useSearchParams } from "next/navigation";

const AudioPlayer = () => {
  const searchParams = useSearchParams();
  const fileUrl = searchParams.get("fileUrl");
  const fileName = searchParams.get("fileName");
  return (
    <div>
      {fileUrl ? (
        <div className="flex h-screen flex-col items-center justify-center">
          <h1 className="text-xl font-bold">Lecture de : {fileName}</h1>
          <iframe
            width="420"
            height="100"
            src={fileUrl}
            className="h-full max-h-[100px] rounded-lg border-2 border-gray-300 shadow-lg"
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <p>Chargement en cours...</p>
      )}
    </div>
  );
};

export default AudioPlayer;
