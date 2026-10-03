"use client";

// import { PDFViewer } from "@/components/anniversary/PDFViewer"; // We will remove this static import
import AnniversaryCTA from "@/components/anniversary/AnniversaryCTA";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Archive, ArchiveType } from "@/types/anniversary";
import { ListBox, SearchField, Select } from "@heroui/react";
import { motion, useInView } from "motion/react";
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
  /** Back-link to /40-ans, shown only while the anniversary flag is on. */
  showAnniversaryLink?: boolean;
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
  showAnniversaryLink = true,
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
        className="bg-background text-foreground relative overflow-hidden py-16 sm:py-24"
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
            {showAnniversaryLink && (
              <Link
                href="/40-ans"
                className="text-primary-600 hover:text-primary-600/80 dark:text-primary-500 dark:hover:text-primary-500/80 mb-8 inline-flex items-center gap-2 font-medium transition-colors"
              >
                <FaArrowLeft />
                <span>Retour à la page 40 ans</span>
              </Link>
            )}
            <div className="text-center">
              <div className="bg-primary/5 text-primary dark:bg-primary/10 mb-6 inline-flex rounded-full p-4">
                <FaArchive className="text-3xl sm:text-4xl" />
              </div>
              <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Archives Publiques
              </h1>
              <p className="text-muted mx-auto mt-4 max-w-2xl text-lg font-light">
                Plongez dans notre histoire à travers les documents qui ont
                jalonné notre parcours.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="border-separator bg-surface-secondary/30 mb-8 space-y-4 rounded-xl border p-4 backdrop-blur-md sm:p-6"
          >
            <SearchField
              aria-label="Rechercher dans les archives"
              value={searchQuery}
              onChange={setSearchQuery}
              fullWidth
            >
              <SearchField.Group className="focus-within:border-primary focus-within:ring-primary border-separator bg-background/50 text-foreground placeholder:text-muted text-sm font-light focus-within:ring-1">
                <SearchField.SearchIcon>
                  <FaSearch className="text-muted" />
                </SearchField.SearchIcon>
                <SearchField.Input
                  className="w-full text-sm"
                  placeholder="Rechercher par titre ou mot-clé..."
                />
                <SearchField.ClearButton aria-label="Effacer la recherche" />
              </SearchField.Group>
            </SearchField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Select
                aria-label="Filtrer par type"
                placeholder="Filtrer par type"
                value={selectedType}
                onChange={(key) => setSelectedType(key as string)}
                className="w-full"
              >
                <Select.Trigger className="focus:border-primary focus:ring-primary border-separator bg-background/50 text-foreground placeholder:text-muted text-sm font-light focus:ring-1">
                  <FaFilter className="text-muted" />
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="all" textValue="Tous les types">
                      Tous les types
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {types.map((t) => (
                      <ListBox.Item key={t} id={t} textValue={typeLabels[t]}>
                        {typeLabels[t]}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <Select
                aria-label="Filtrer par thème"
                placeholder="Filtrer par thème"
                value={selectedTheme}
                onChange={(key) => setSelectedTheme(key as string)}
                className="w-full"
              >
                <Select.Trigger className="focus:border-primary focus:ring-primary border-separator bg-background/50 text-foreground placeholder:text-muted text-sm font-light focus:ring-1">
                  <FaFilter className="text-muted" />
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="all" textValue="Tous les thèmes">
                      Tous les thèmes
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {themes.map((t) => (
                      <ListBox.Item key={t} id={t} textValue={t}>
                        {t}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <Select
                aria-label="Trier par"
                placeholder="Trier par..."
                value={sortBy}
                onChange={(key) => setSortBy(key as SortOption)}
                className="w-full"
              >
                <Select.Trigger className="focus:border-primary focus:ring-primary border-separator bg-background/50 text-foreground placeholder:text-muted text-sm font-light focus:ring-1">
                  <FaSort className="text-muted" />
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {sortOptions.map((o) => (
                      <ListBox.Item key={o.key} id={o.key} textValue={o.label}>
                        {o.label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </motion.div>

          <p className="text-muted mb-8 text-sm">
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
                  className="group border-separator bg-surface-secondary/30 flex flex-col overflow-hidden rounded-xl border p-5 backdrop-blur-md transition-shadow duration-300 hover:shadow-xl"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="bg-primary/5 text-primary dark:bg-primary/10 rounded-lg p-3">
                      <IconComponent className="text-2xl" />
                    </div>
                    <span className="bg-surface-tertiary text-foreground shrink-0 rounded-full px-3 py-1 text-xs font-semibold">
                      {doc.year}
                    </span>
                  </div>
                  <h3 className="text-foreground mb-2 line-clamp-2 text-lg font-medium">
                    {doc.title}
                  </h3>
                  <p className="text-muted mb-5 line-clamp-3 grow text-sm font-light">
                    {doc.description}
                  </p>
                  <div className="mt-auto flex items-end justify-between">
                    <span className="text-muted flex items-center gap-1.5 text-xs">
                      <FaFilePdf /> {doc.file_size}
                    </span>
                    <div className="flex shrink-0 gap-2">
                      <motion.button
                        onClick={() => openViewer(doc)}
                        aria-label={`Consulter ${doc.title}`}
                        className="group/btn border-separator bg-background/50 text-muted hover:border-muted hover:bg-background/80 hover:text-foreground relative inline-flex items-center justify-center overflow-hidden rounded-md border px-3 py-2 text-sm font-medium transition-colors"
                      >
                        <FaEye />
                      </motion.button>
                      <AnniversaryCTA
                        href={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload/${doc.file_url}`}
                        external
                        size="sm"
                        ariaLabel={`Télécharger ${doc.title}`}
                      >
                        <FaDownload />
                      </AnniversaryCTA>
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
              <FaArchive className="text-muted/40 mx-auto mb-4 text-5xl" />
              <p className="text-muted text-lg font-medium">
                Aucun document trouvé
              </p>
              <p className="text-muted mt-2 text-sm">
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
