"use client";

import { useResetOnChange } from "@/hooks/useResetOnChange";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
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

  // Reset state when a new document is opened
  useResetOnChange([isOpen, url], () => {
    if (isOpen) {
      setPageNumber(1);
      setNumPages(null);
      setLoading(true);
      setError(null);
    }
  });

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
            className="bg-background relative flex h-full max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl"
          >
            {/* Header */}
            <header className="border-separator flex shrink-0 items-center justify-between border-b p-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-foreground truncate text-lg font-medium">
                  {title}
                </h2>
                {numPages && !loading && (
                  <p className="text-muted text-sm">
                    Page {pageNumber} sur {numPages}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="text-muted hover:bg-surface-tertiary hover:text-foreground rounded-lg p-2 transition-colors"
                  title="Télécharger"
                >
                  <FaDownload className="h-5 w-5" />
                </button>
                <button
                  onClick={onClose}
                  className="text-muted hover:bg-surface-tertiary hover:text-foreground rounded-lg p-2 transition-colors"
                  aria-label="Fermer la vue"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
            </header>

            {/* PDF Content */}
            <main className="bg-surface-secondary relative flex-1 overflow-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                {loading && (
                  <div className="text-center">
                    <div className="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
                    <p className="text-muted mt-4 text-sm">
                      Chargement du document...
                    </p>
                  </div>
                )}
                {error && (
                  <div className="text-center">
                    <p className="font-medium text-red-500">{error}</p>
                    <p className="text-muted mt-1 text-sm">
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
                    // react-pdf 11 renders through Suspense by default, which
                    // would bypass the loading and error state kept above.
                    suspense={false}
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
              <footer className="border-separator flex shrink-0 items-center justify-between border-t p-2 sm:p-4">
                <button
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="border-separator bg-background text-foreground hover:bg-surface-secondary flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Précédent</span>
                </button>
                <div className="text-muted text-sm font-medium">
                  {pageNumber} / {numPages}
                </div>
                <button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="border-separator bg-background text-foreground hover:bg-surface-secondary flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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
