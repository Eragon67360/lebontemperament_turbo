"use client";

import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { useSearchParams } from "next/navigation";

const AudioPlayer = () => {
  const searchParams = useSearchParams();
  const fileUrl = searchParams.get("fileUrl");
  const fileName = searchParams.get("fileName");

  return (
    <div className="flex h-full items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg !border-none shadow-lg">
        <CardHeader className="flex items-center justify-center">
          <h1 className="text-lg font-bold text-gray-800">
            {fileName ? `Lecture de : ${fileName}` : "Lecture Audio"}
          </h1>
        </CardHeader>
        <CardBody className="flex flex-col items-center">
          {fileUrl ? (
            <>
              <audio
                controls
                src={fileUrl}
                className="w-full rounded-full shadow-md"
                aria-label={`Lecture audio de ${fileName}`}
              >
                Votre navigateur ne supporte pas l&apos;élément audio.
              </audio>
              <Button
                variant="solid"
                size="sm"
                className="mt-4"
                as="a"
                href={fileUrl + "&export=download"}
                download={fileName || "audio"}
                aria-label={`Télécharger ${fileName || "le fichier audio"}`}
              >
                Télécharger
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative h-16 w-16">
                <div className="border-primary absolute top-0 left-0 h-full w-full animate-spin rounded-full border-4 border-t-transparent"></div>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Chargement en cours...
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default AudioPlayer;
