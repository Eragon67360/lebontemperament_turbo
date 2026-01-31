"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaTimes,
} from "react-icons/fa";
import { Document, Page, pdfjs } from "react-pdf";
// Use modern ESM build for CSS
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// --- THE MODERN, ROBUST WORKER SETUP ---
// This uses the bundler to find the worker file in node_modules and avoids all CORS/path issues.
// This is the officially recommended approach.
// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.min.js",
//   import.meta.url,
// ).toString();

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PDFViewer({ url, title, isOpen, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state when a new document is opened
      setPageNumber(1);
      setNumPages(null);
      setLoading(true);
      setError(null);
    }
  }, [isOpen, url]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("Failed to load PDF:", error);
    setError("Erreur lors du chargement du document.");
    setLoading(false);
  };

  const goToPrevPage = () => setPageNumber((prev) => Math.max(1, prev - 1));
  const goToNextPage = () =>
    setPageNumber((prev) => Math.min(numPages!, prev + 1));
  const handleDownload = () => window.open(url, "_blank");

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-full max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900"
          >
            {/* Header */}
            <header className="flex shrink-0 items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-medium text-slate-900 dark:text-white">
                  {title}
                </h2>
                {numPages && !loading && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Page {pageNumber} sur {numPages}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  title="Télécharger"
                >
                  <FaDownload className="h-5 w-5" />
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label="Fermer la vue"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
            </header>

            {/* PDF Content */}
            <main className="relative flex-1 overflow-auto bg-slate-100 dark:bg-slate-800/50">
              <div className="flex min-h-full items-center justify-center p-4">
                {loading && (
                  <div className="text-center">
                    <div className="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                      Chargement du document...
                    </p>
                  </div>
                )}
                {error && (
                  <div className="text-center">
                    <p className="font-medium text-red-500">{error}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Veuillez essayer de le télécharger directement.
                    </p>
                  </div>
                )}
                <div className={loading || error ? "hidden" : "block"}>
                  <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading="" // We use our own custom loader above
                  >
                    <Page
                      pageNumber={pageNumber}
                      renderTextLayer
                      renderAnnotationLayer
                      className="flex! justify-center!"
                      // Responsive width for the PDF page
                      width={Math.min(
                        900,
                        typeof window !== "undefined"
                          ? window.innerWidth > 768
                            ? window.innerWidth * 0.7
                            : window.innerWidth * 0.85
                          : 900,
                      )}
                    />
                  </Document>
                </div>
              </div>
            </main>

            {/* Navigation Controls */}
            {numPages && numPages > 1 && !loading && !error && (
              <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 p-2 sm:p-4 dark:border-slate-800">
                <button
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <FaChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Précédent</span>
                </button>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {pageNumber} / {numPages}
                </div>
                <button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <FaChevronRight className="h-4 w-4" />
                </button>
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
