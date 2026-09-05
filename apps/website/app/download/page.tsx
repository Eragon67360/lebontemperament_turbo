"use client";

import { Button, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { IoIosArrowRoundForward } from "react-icons/io";

export default function DownloadPage() {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  useEffect(() => {
    // Automatically start download when page loads
    const startDownload = async () => {
      try {
        const response = await fetch(
          "/pdf/Programmes/Entre_Terre_et_Ciel_2025.pdf",
        );
        if (!response.ok) {
          throw new Error("Failed to fetch file");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "Entre_Terre_et_Ciel_2025.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setDownloadStarted(true);
      } catch (error) {
        console.error("Download failed:", error);
        setDownloadError(true);
      }
    };

    // Small delay to ensure page is fully loaded
    const timer = setTimeout(startDownload, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleManualDownload = async () => {
    try {
      const response = await fetch(
        "/pdf/Programmes/Entre_Terre_et_Ciel_2025.pdf",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Entre_Ciel_et_Terre_2025.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadStarted(true);
    } catch (error) {
      console.error("Download failed:", error);
      setDownloadError(true);
    }
  };

  return (
    <section
      className="container mx-auto flex h-full w-full grow justify-center bg-white"
      aria-labelledby="download-title"
    >
      <div className="my-auto h-fit w-full max-w-[1440px] px-8 lg:px-24">
        <div className="flex flex-col items-center justify-center">
          {/* Title */}
          <h1
            id="download-title"
            className="text-primary/50 dark:text-primary text-title mb-4 leading-none font-light"
          >
            Entre Terre et Ciel
          </h1>
          <p className="mb-8 text-base font-light text-gray-500 md:text-lg lg:text-xl">
            Programme 2025
          </p>

          {/* Status Messages */}
          {downloadStarted && !downloadError && (
            <div className="mb-8">
              <div className="inline-flex items-center rounded-lg bg-green-100 px-6 py-3 text-green-800">
                <svg
                  className="mr-3 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Téléchargement terminé !
              </div>
            </div>
          )}

          {downloadError && (
            <div className="mb-8">
              <div className="inline-flex items-center rounded-lg bg-red-100 px-6 py-3 text-red-800">
                <svg
                  className="mr-3 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Erreur lors du téléchargement
              </div>
            </div>
          )}

          {!downloadStarted && !downloadError && (
            <div className="mb-8">
              <div className="inline-flex items-center rounded-lg bg-blue-100 px-6 py-3 text-blue-800">
                <Spinner size="sm" className="mr-3" />
                Préparation du téléchargement...
              </div>
            </div>
          )}

          {/* Download Button */}
          <div className="mb-6">
            <Button
              onPress={handleManualDownload}
              size="lg"
              className="flex items-center gap-2 rounded-sm"

              variant="primary"
            >
              {downloadError ? (
                <>
                  <span className="text-xs tracking-[2.4px] uppercase">
                    Réessayer le téléchargement
                  </span>
                  <IoIosArrowRoundForward className="scale-110" />
                </>
              ) : (
                <>
                  <span className="text-xs tracking-[2.4px] uppercase">
                    Télécharger le programme
                  </span>
                  <IoIosArrowRoundForward className="scale-110" />
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <p className="max-w-md text-center text-sm text-gray-500">
            Si le téléchargement ne démarre pas automatiquement, cliquez sur le
            bouton ci-dessus.
          </p>
        </div>
      </div>
    </section>
  );
}
