"use client";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import {
  IoCallOutline,
  IoHomeOutline,
  IoMailOutline,
  IoMusicalNotesOutline,
  IoPersonCircle,
  IoPhonePortraitOutline,
} from "react-icons/io5";

interface Member {
  "NOM Prénom": string;
  "Adresse mail": string;
  "Adresse postale": string;
  Domicile: string;
  Portable: string;
  Voix: string;
  photoUrl?: string; // Optional field for future photo implementation
}

// Extract all unique words from voice values (e.g., "jeune", "basse", "orchestre" from "jeune & basse" or "orchestre & ténor")
const extractVoiceWords = (voices: string[]): string[] => {
  const words = new Set<string>();

  voices.forEach((voice) => {
    if (!voice) return;
    // Split by common separators and extract individual words
    const parts = voice
      .toLowerCase()
      .split(/[&\s,]+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    parts.forEach((word) => {
      words.add(word);
    });
  });

  return Array.from(words).sort();
};

const Membres = () => {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/membres");
        if (!response.ok) {
          throw new Error("Failed to fetch members");
        }

        const members = await response.json();

        // Filter out empty rows and normalize data
        const validData = members
          .filter((member: Member) => member["NOM Prénom"]?.trim())
          .map((member: Member) => ({
            "NOM Prénom": member["NOM Prénom"]?.trim() || "",
            "Adresse mail": member["Adresse mail"]?.trim() || "",
            "Adresse postale": member["Adresse postale"]?.trim() || "",
            Domicile: member.Domicile?.trim() || "",
            Portable: member.Portable?.trim() || "",
            Voix: member.Voix?.trim() || "",
            photoUrl: member.photoUrl,
          }));

        setData(validData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get all unique words from voice values - memoized to recompute when data changes
  const voiceWords = useMemo(() => {
    if (data.length === 0) return [];

    const uniqueVoices = Array.from(
      new Set(
        data
          .map((member) => member.Voix?.trim())
          .filter((voix) => voix && voix.length > 0),
      ),
    ).sort();

    return extractVoiceWords(uniqueVoices);
  }, [data]);
  const filteredData = data.filter((member) => {
    // Filter by search term
    const matchesSearch =
      searchTerm === "" ||
      Object.values(member).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      );

    // Filter by voice (case-insensitive substring match)
    const matchesVoice =
      selectedVoice === "" ||
      (member.Voix?.trim() || "")
        .toLowerCase()
        .includes(selectedVoice.trim().toLowerCase());

    return matchesSearch && matchesVoice;
  });

  const getVoiceColor = (voix: string) => {
    const voixLower = voix?.toLowerCase() || "";
    if (voixLower.includes("soprane"))
      return "from-pink-500/20 to-rose-500/20 text-pink-700 dark:text-pink-300";
    if (voixLower.includes("alte"))
      return "from-purple-500/20 to-violet-500/20 text-purple-700 dark:text-purple-300";
    if (voixLower.includes("ténor") || voixLower.includes("tenor"))
      return "from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300";
    if (voixLower.includes("basse"))
      return "from-indigo-500/20 to-blue-900/20 text-indigo-700 dark:text-indigo-300";
    if (voixLower.includes("orchestre"))
      return "from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300";
    if (voixLower.includes("chef") || voixLower.includes("soliste"))
      return "from-emerald-500/20 to-green-500/20 text-emerald-700 dark:text-emerald-300";
    if (voixLower.includes("jeune") || voixLower.includes("enfant"))
      return "from-yellow-500/20 to-lime-500/20 text-yellow-700 dark:text-yellow-300";
    return "from-default-500/20 to-default-700/20 text-muted";
  };

  const getInitials = (name: string) => {
    if (!name?.trim()) return "?";
    const parts = name.split(" ").filter((part) => part.trim().length > 0);

    if (parts.length >= 2) {
      const firstPart = parts.at(0);
      const lastPart = parts.at(-1);
      if (firstPart?.[0] && lastPart?.[0]) {
        return (firstPart[0] + lastPart[0]).toUpperCase();
      }
    }

    const firstPart = parts.at(0);
    if (firstPart) {
      return firstPart.substring(0, 2).toUpperCase();
    }

    return name.trim().substring(0, 2).toUpperCase() || "?";
  };

  return (
    <div className="container mx-auto w-full px-2 py-6 md:px-4 md:py-8 lg:px-6 lg:py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 flex items-center gap-4 md:mb-8"
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 360 }}
          transition={{ duration: 0.6 }}
          className="bg-primary/10 rounded-xl p-3"
        >
          <IoPersonCircle className="text-primary h-7 w-7" />
        </motion.div>
        <div>
          <h1 className="from-primary via-foreground bg-gradient-to-r to-purple-500 bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl lg:text-4xl">
            Membres
          </h1>
          <p className="text-foreground/60 mt-1 text-sm md:text-base">
            Liste des membres du Bon Tempérament
          </p>
        </div>
      </motion.div>

      {/* Search, Filter and Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6 flex flex-col gap-4"
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface-secondary/80 text-foreground focus:ring-primary/30 w-full rounded-xl border-0 py-3 pr-4 pl-12 text-sm shadow-sm backdrop-blur-sm transition-all focus:ring-2 focus:outline-none md:text-base"
              />
              <FaSearch className="text-foreground/40 absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
            </div>
            <div className="relative w-full sm:w-64">
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                disabled={voiceWords.length === 0}
                className="bg-surface-secondary/80 text-foreground focus:ring-primary/30 w-full appearance-none rounded-xl border-0 py-3 pr-10 pl-4 text-sm shadow-sm backdrop-blur-sm transition-all focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
              >
                <option value="">Toutes les voix</option>
                {voiceWords.map((word) => (
                  <option key={word} value={word}>
                    {word.charAt(0).toUpperCase() + word.slice(1)}
                  </option>
                ))}
              </select>
              <IoMusicalNotesOutline className="text-foreground/40 pointer-events-none absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2" />
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="from-primary shrink-0 rounded-xl bg-gradient-to-r to-purple-500 px-5 py-3 font-medium text-white shadow-lg"
          >
            {filteredData.length} membre{filteredData.length !== 1 && "s"}
          </motion.div>
        </div>
      </motion.div>

      {/* Member Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-surface-secondary/80 animate-pulse rounded-xl p-6 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center">
                <div className="bg-surface-tertiary/80 mb-4 h-24 w-24 rounded-full" />
                <div className="bg-surface-tertiary/80 mb-2 h-6 w-32 rounded-lg" />
                <div className="bg-surface-tertiary/80 h-4 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredData.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredData.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              className="group relative flex overflow-hidden rounded-xl"
            >
              <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-br to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="bg-surface-secondary/80 group-hover:bg-surface-tertiary/80 relative z-10 flex w-full flex-col p-6 backdrop-blur-sm transition-all duration-300">
                {/* Profile Picture */}
                <div className="mb-4 flex justify-center">
                  <div className="from-primary relative h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br to-purple-500 p-1 shadow-lg">
                    <div className="bg-surface-secondary flex h-full w-full items-center justify-center rounded-full">
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={member["NOM Prénom"]}
                          className="h-full w-full rounded-full object-cover"
                          crossOrigin="anonymous"
                          loading="lazy"
                          onError={(e) => {
                            // If image fails to load, hide it and show initials
                            const img = e.currentTarget;
                            img.style.display = "none";
                            const parent = img.parentElement;
                            if (parent && !parent.querySelector("span")) {
                              const fallback = document.createElement("span");
                              fallback.className =
                                "text-primary text-2xl font-bold";
                              fallback.textContent = getInitials(
                                member["NOM Prénom"],
                              );
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-primary text-2xl font-bold">
                          {getInitials(member["NOM Prénom"])}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-foreground mb-2 text-center text-lg font-bold">
                  {member["NOM Prénom"]}
                </h3>

                {/* Voice Type Badge */}
                <div className="mb-4 flex min-h-[2rem] justify-center">
                  {member.Voix && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg bg-gradient-to-r px-3 py-1.5 text-xs font-semibold ${getVoiceColor(member.Voix)}`}
                    >
                      <IoMusicalNotesOutline className="h-4 w-4" />
                      {member.Voix}
                    </span>
                  )}
                </div>

                {/* Contact Info */}
                <div className="text-foreground/70 space-y-2 text-sm">
                  {member["Adresse mail"] && (
                    <div className="flex items-center gap-2">
                      <IoMailOutline className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                      <a
                        href={`mailto:${member["Adresse mail"]}`}
                        className="text-primary break-all transition-colors hover:underline"
                      >
                        {member["Adresse mail"]}
                      </a>
                    </div>
                  )}

                  {member.Portable && (
                    <div className="flex items-center gap-2">
                      <IoPhonePortraitOutline className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                      <a
                        href={`tel:${member.Portable.replace(/\s/g, "")}`}
                        className="text-foreground/70 hover:text-primary transition-colors"
                      >
                        {member.Portable}
                      </a>
                    </div>
                  )}

                  {member.Domicile && (
                    <div className="flex items-center gap-2">
                      <IoCallOutline className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                      <a
                        href={`tel:${member.Domicile.replace(/\s/g, "")}`}
                        className="text-foreground/70 hover:text-primary transition-colors"
                      >
                        {member.Domicile}
                      </a>
                    </div>
                  )}

                  {member["Adresse postale"] && (
                    <div className="my-auto flex h-fit items-center gap-2">
                      <IoHomeOutline className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span className="text-foreground/70 text-xs">
                        {member["Adresse postale"]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-foreground/60 bg-surface-secondary/80 rounded-xl py-16 text-center backdrop-blur-sm"
        >
          <IoPersonCircle className="text-foreground/30 mx-auto mb-4 h-16 w-16" />
          <p className="text-lg font-medium">Aucun résultat trouvé</p>
          <p className="text-foreground/50 mt-2 text-sm">
            Essayez de modifier votre recherche
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Membres;
