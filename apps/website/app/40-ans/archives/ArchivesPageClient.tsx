"use client";

// import { PDFViewer } from "@/components/anniversary/PDFViewer"; // We will remove this static import
import type { Archive, ArchiveType } from "@/types/anniversary";
import { Input, Select, SelectItem } from "@heroui/react";
import { motion, useInView, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic"; // STEP 1: Import 'dynamic' from Next.js
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  FaArchive,
  FaArrowLeft,
  FaChartLine,
  FaDownload,
  FaEye,
  FaFileAlt,
  FaFilePdf,
  FaFilter,
  FaMusic,
  FaNewspaper,
  FaSearch,
  FaSort,
  FaTimes,
  FaUsers,
} from "react-icons/fa";

// STEP 2: Create a dynamic version of the PDFViewer with SSR turned off
const PDFViewer = dynamic(
  () =>
    import("@/components/anniversary/PDFViewer").then((mod) => mod.PDFViewer),
  {
    ssr: false, // This is the crucial part
    loading: () => (
      // Provide a nice loading skeleton
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-4">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    ),
  },
);

interface ArchivesPageClientProps {
  archives: Archive[];
}

// --- LABELS & ICONS (No changes here) ---
const typeLabels: Record<ArchiveType, string> = {
  "assemblée-générale": "Assemblée Générale",
  "rapport-annuel": "Rapport Annuel",
  "rapport-financier": "Rapport Financier",
  gazette: "Gazette",
  programme: "Programme",
  "document-historique": "Document Historique",
};
const typeIcons: Record<
  ArchiveType,
  React.ComponentType<{ className?: string }>
> = {
  "assemblée-générale": FaUsers,
  "rapport-annuel": FaFileAlt,
  "rapport-financier": FaChartLine,
  gazette: FaNewspaper,
  programme: FaMusic,
  "document-historique": FaArchive,
};
type SortOption = "year-desc" | "year-asc" | "title-asc" | "title-desc";
const sortOptions: { key: SortOption; label: string }[] = [
  { key: "year-desc", label: "Année (plus récent)" },
  { key: "year-asc", label: "Année (plus ancien)" },
  { key: "title-asc", label: "Titre (A-Z)" },
  { key: "title-desc", label: "Titre (Z-A)" },
];

// --- COMPONENT (No changes to logic) ---
export default function ArchivesPageClient({
  archives,
}: ArchivesPageClientProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const shouldReduceMotion = useReducedMotion();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTheme, setSelectedTheme] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("year-desc");
  const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const themes = useMemo(
    () => Array.from(new Set(archives.map((doc) => doc.theme))).sort(),
    [archives],
  );
  const types = useMemo(
    () => Array.from(new Set(archives.map((doc) => doc.type))).sort(),
    [archives],
  );

  const filteredDocuments = useMemo(() => {
    let filtered = archives.filter((doc) => {
      const matchesSearch =
        searchQuery === "" ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.description &&
          doc.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectedType === "all" || doc.type === selectedType;
      const matchesTheme =
        selectedTheme === "all" || doc.theme === selectedTheme;
      return matchesSearch && matchesType && matchesTheme;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "year-desc":
          return b.year - a.year;
        case "year-asc":
          return a.year - b.year;
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  }, [archives, searchQuery, selectedType, selectedTheme, sortBy]);

  const openViewer = (doc: Archive) => {
    setSelectedArchive(doc);
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
  };

  return (
    <div className="bg-background min-h-screen">
      <section
        ref={sectionRef}
        className="relative overflow-hidden bg-slate-50 py-16 text-slate-800 sm:py-24 dark:bg-slate-900 dark:text-slate-200"
      >
        <div className="absolute inset-0 z-0">
          <div className="bg-primary/5 absolute top-1/4 right-0 h-112 w-md rounded-full blur-[100px]" />
          <div className="bg-primary/5 absolute bottom-1/4 left-0 h-75 w-75 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header and Filters remain the same */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <Link
              href="/40-ans"
              className="text-primary hover:text-primary/80 mb-8 inline-flex items-center gap-2 font-medium transition-colors"
            >
              <FaArrowLeft />
              <span>Retour à la page 40 ans</span>
            </Link>
            <div className="text-center">
              <div className="bg-primary/5 text-primary dark:bg-primary/10 mb-6 inline-flex rounded-full p-4">
                <FaArchive className="text-3xl sm:text-4xl" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-white">
                Archives Publiques
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg font-light text-slate-500 dark:text-slate-400">
                Plongez dans notre histoire à travers les documents qui ont
                jalonné notre parcours.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8 space-y-4 rounded-xl border border-slate-200/80 bg-white/30 p-4 backdrop-blur-md sm:p-6 dark:border-slate-800/50 dark:bg-slate-900/30"
          >
            <Input
              aria-label="Rechercher dans les archives"
              placeholder="Rechercher par titre ou mot-clé..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<FaSearch className="text-slate-400" />}
              endContent={
                searchQuery && (
                  <button
                    aria-label="Effacer la recherche"
                    onClick={() => setSearchQuery("")}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <FaTimes />
                  </button>
                )
              }
              classNames={{
                inputWrapper:
                  "border-slate-300 bg-white/50 text-sm font-light text-slate-800 placeholder-slate-400 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:placeholder-slate-500",
                input: "text-sm",
              }}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Select
                items={[
                  { key: "all", label: "Tous les types" },
                  ...types.map((t) => ({ key: t, label: typeLabels[t] })),
                ]}
                aria-label="Filtrer par type"
                placeholder="Filtrer par type"
                startContent={<FaFilter className="text-slate-400" />}
                selectedKeys={[selectedType]}
                onSelectionChange={(keys) =>
                  setSelectedType(Array.from(keys)[0] as string)
                }
                classNames={{
                  trigger:
                    "border-slate-300 bg-white/50 text-sm font-light text-slate-800 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:placeholder-slate-500",
                }}
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>
              <Select
                items={[
                  { key: "all", label: "Tous les thèmes" },
                  ...themes.map((t) => ({ key: t, label: t })),
                ]}
                aria-label="Filtrer par thème"
                placeholder="Filtrer par thème"
                startContent={<FaFilter className="text-slate-400" />}
                selectedKeys={[selectedTheme]}
                onSelectionChange={(keys) =>
                  setSelectedTheme(Array.from(keys)[0] as string)
                }
                classNames={{
                  trigger:
                    "border-slate-300 bg-white/50 text-sm font-light text-slate-800 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:placeholder-slate-500",
                }}
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>
              <Select
                items={sortOptions}
                aria-label="Trier par"
                placeholder="Trier par..."
                startContent={<FaSort className="text-slate-400" />}
                selectedKeys={[sortBy]}
                onSelectionChange={(keys) =>
                  setSortBy(Array.from(keys)[0] as SortOption)
                }
                classNames={{
                  trigger:
                    "border-slate-300 bg-white/50 text-sm font-light text-slate-800 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:placeholder-slate-500",
                }}
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>
            </div>
          </motion.div>

          <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
            {filteredDocuments.length} document
            {filteredDocuments.length !== 1 ? "s" : ""} trouvé
            {filteredDocuments.length !== 1 ? "s" : ""}
          </p>

          {/* Grid remains the same */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredDocuments.map((doc) => {
              const IconComponent = typeIcons[doc.type] || FaFileAlt;
              return (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{
                    opacity: 0,
                    y: shouldReduceMotion ? 0 : 20,
                    scale: shouldReduceMotion ? 1 : 0.95,
                  }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    y: shouldReduceMotion ? 0 : -20,
                    scale: shouldReduceMotion ? 1 : 0.95,
                  }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white/30 p-5 backdrop-blur-md transition-shadow duration-300 hover:shadow-xl dark:border-slate-800/50 dark:bg-slate-900/30"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="bg-primary/5 text-primary dark:bg-primary/10 rounded-lg p-3">
                      <IconComponent className="text-2xl" />
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {doc.year}
                    </span>
                  </div>
                  <h3 className="mb-2 line-clamp-2 text-lg font-medium text-slate-900 dark:text-white">
                    {doc.title}
                  </h3>
                  <p className="mb-5 line-clamp-3 grow text-sm font-light text-slate-500 dark:text-slate-400">
                    {doc.description}
                  </p>
                  <div className="mt-auto flex items-end justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                      <FaFilePdf /> {doc.file_size}
                    </span>
                    <div className="flex shrink-0 gap-2">
                      <motion.button
                        onClick={() => openViewer(doc)}
                        className="group/btn relative inline-flex items-center justify-center overflow-hidden rounded-md border border-slate-300 bg-white/50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-white/80 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                      >
                        <FaEye />
                      </motion.button>
                      <Link
                        href={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload/${doc.file_url}`}
                        passHref
                        legacyBehavior
                      >
                        <motion.a
                          target="_blank"
                          rel="noopener noreferrer"
                          variants={{
                            initial: { color: "var(--color-primary)" },
                            hover: { color: "#ffffff" },
                          }}
                          initial="initial"
                          whileHover="hover"
                          transition={{ duration: 0.3 }}
                          className="group/btn border-primary/40 text-primary hover:border-primary/80 dark:border-primary/50 dark:text-primary relative inline-flex items-center justify-center overflow-hidden rounded-md border bg-transparent px-3 py-2 text-sm font-medium transition-colors duration-300"
                        >
                          <motion.div
                            className="bg-primary absolute inset-0 -z-10"
                            variants={{
                              initial: { y: "100%" },
                              hover: { y: "0%" },
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          />
                          <FaDownload />
                        </motion.a>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {filteredDocuments.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <FaArchive className="mx-auto mb-4 text-5xl text-slate-300 dark:text-slate-700" />
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                Aucun document trouvé
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Essayez de modifier vos critères de recherche ou de filtrage.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* STEP 3: The dynamic PDFViewer is called here. It will only render on the client. */}
      {selectedArchive && (
        <PDFViewer
          url={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload/${selectedArchive.file_url}`}
          title={selectedArchive.title}
          isOpen={isViewerOpen}
          onClose={closeViewer}
        />
      )}
    </div>
  );
}
