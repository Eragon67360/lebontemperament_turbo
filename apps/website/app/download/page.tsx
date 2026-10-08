"use client";

import type { ListedCollection } from "@/lib/siteDocuments";
import { Button, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { IoIosArrowRoundForward } from "react-icons/io";

type Programme = { title: string; dateLabel: string | null; href: string };

/** Until a programme is managed in the admin (or if the list can't load). */
const FALLBACK: Programme = {
  title: "Entre Terre et Ciel",
  dateLabel: "2025",
  href: "/pdf/Programmes/Entre_Terre_et_Ciel_2025.pdf",
};

/**
 * The concert programme the QR codes point to: the newest document of the
 * « Programmes de concert » collection, managed in the admin
 * (« Documents de l'association »).
 */
async function currentProgramme(): Promise<Programme> {
  try {
    const response = await fetch("/api/documents");
    if (!response.ok) return FALLBACK;
    const { collections } = (await response.json()) as {
      collections: ListedCollection[];
    };
    const latest = collections.find((c) => c.slug === "programmes")
      ?.documents[0];
    return latest ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}

const fileNameOf = (href: string) =>
  decodeURIComponent(href.split("/").pop() || "programme.pdf");

export default function DownloadPage() {
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  const download = async (target: Programme) => {
    try {
      const response = await fetch(target.href);
      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameOf(target.href);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadError(false);
      setDownloadStarted(true);
    } catch (error) {
      console.error("Download failed:", error);
      setDownloadError(true);
    }
  };

  useEffect(() => {
    let cancelled = false;
    // Small delay to ensure page is fully loaded
    const timer = setTimeout(async () => {
      const target = await currentProgramme();
      if (cancelled) return;
      setProgramme(target);
      await download(target);
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const handleManualDownload = async () => {
    const target = programme ?? (await currentProgramme());
    setProgramme(target);
    await download(target);
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
            className="text-primary-400 dark:text-primary text-title mb-4 leading-none font-light"
          >
            {programme?.title ?? "Programme du concert"}
          </h1>
          <p className="mb-8 text-base font-light text-gray-500 md:text-lg lg:text-xl">
            {programme?.dateLabel
              ? `Programme ${programme.dateLabel}`
              : "Programme"}
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
              className="flex items-center gap-2"

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
