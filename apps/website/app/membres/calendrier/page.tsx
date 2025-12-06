"use client";
import GoogleCalendar from "@/components/GoogleCalendar";
import { GroupType, Rehearsal } from "@/types/rehearsals";
import { format, isAfter, isSameDay, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { IoCalendarClear, IoList } from "react-icons/io5";
import { MdCalendarMonth } from "react-icons/md";

const Calendrier = () => {
  const [showGoogleCalendar, setShowGoogleCalendar] = useState(false);
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [loadingRehearsals, setLoadingRehearsals] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<GroupType | "all">("all");

  useEffect(() => {
    const fetchRehearsals = async () => {
      try {
        const response = await fetch("/api/rehearsals");
        const data = await response.json();
        setRehearsals(data);
      } finally {
        setLoadingRehearsals(false);
      }
    };

    fetchRehearsals();
  }, []);

  const today = startOfDay(new Date());

  // Helper function to parse date string as local date (not UTC)
  // Dates are stored as "YYYY-MM-DD" strings and should be treated as local dates
  const parseLocalDate = (dateString: string): Date => {
    const parts = dateString.split("-");
    if (parts.length !== 3) {
      // Fallback to current date if format is invalid
      return new Date();
    }
    const year = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10);
    const day = parseInt(parts[2]!, 10);
    return new Date(year, month - 1, day);
  };

  const filteredRehearsals = rehearsals.filter((rehearsal) => {
    // Filter by date: only show today's and future rehearsals
    // Parse as local date to avoid timezone issues
    const rehearsalDate = startOfDay(parseLocalDate(rehearsal.date));
    const isTodayOrFuture =
      isSameDay(rehearsalDate, today) || isAfter(rehearsalDate, today);

    // Filter by group type
    const matchesGroup =
      selectedGroup === "all" || rehearsal.group_type === selectedGroup;

    return isTodayOrFuture && matchesGroup;
  });

  const groupColors: Record<GroupType, string> = {
    Orchestre:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Hommes:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    Femmes:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "Jeunes/Enfants":
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "Choeur complet":
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    Tous: "bg-default-100 text-default-700",
  };

  return (
    <div className="container mx-auto w-full px-2 py-6 md:px-4 md:py-8 lg:px-6 lg:py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 flex flex-col items-start justify-between gap-4 md:mb-8 lg:flex-row lg:items-center"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="bg-primary/10 rounded-xl p-3"
          >
            <IoCalendarClear className="text-primary h-7 w-7" />
          </motion.div>
          <div>
            <h1 className="from-primary via-foreground bg-gradient-to-r to-purple-500 bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl lg:text-4xl">
              Calendrier
            </h1>
            <p className="text-foreground/60 mt-1 text-sm md:text-base">
              Consultez les répétitions à venir
            </p>
          </div>
        </div>
        <motion.button
          onClick={() => setShowGoogleCalendar(!showGoogleCalendar)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="from-primary flex items-center gap-2 rounded-xl bg-gradient-to-r to-purple-500 px-5 py-3 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl md:text-base"
        >
          {showGoogleCalendar ? (
            <>
              <IoList className="h-5 w-5" />
              Vue liste
            </>
          ) : (
            <>
              <MdCalendarMonth className="h-5 w-5" />
              Calendrier complet
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Filters */}
      {!showGoogleCalendar && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          <motion.button
            onClick={() => setSelectedGroup("all")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedGroup === "all"
                ? "from-primary bg-gradient-to-r to-purple-500 text-white shadow-lg"
                : "bg-default-100/80 text-foreground hover:bg-default-200/80 backdrop-blur-sm"
            }`}
          >
            Pas de filtre
          </motion.button>
          {Object.keys(groupColors).map((group) => (
            <motion.button
              key={group}
              onClick={() => setSelectedGroup(group as GroupType)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedGroup === group
                  ? "from-primary bg-gradient-to-r to-purple-500 text-white shadow-lg"
                  : "bg-default-100/80 text-foreground hover:bg-default-200/80 backdrop-blur-sm"
              }`}
            >
              {group}
            </motion.button>
          ))}
        </motion.div>
      )}

      <div>
        {showGoogleCalendar ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden rounded-xl shadow-xl"
          >
            <GoogleCalendar embedId={"lebontemperament@gmail.com"} />
          </motion.div>
        ) : (
          <div className="space-y-4">
            {loadingRehearsals ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-default-100/80 h-32 rounded-xl" />
                ))}
              </div>
            ) : filteredRehearsals.length > 0 ? (
              filteredRehearsals.map((rehearsal, index) => (
                <motion.div
                  key={rehearsal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-xl"
                >
                  <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-r to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="bg-default-100/80 group-hover:bg-default-200/80 relative z-10 p-4 backdrop-blur-sm transition-all duration-300 md:p-6">
                    <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                      <div className="flex-1">
                        <h3 className="text-foreground mb-1 text-lg font-bold">
                          {rehearsal.name}
                        </h3>
                        <p className="text-foreground/60 text-sm md:text-base">
                          {rehearsal.place}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap md:text-sm ${groupColors[rehearsal.group_type]}`}
                      >
                        {rehearsal.group_type}
                      </span>
                    </div>
                    <div className="text-foreground/70 mt-4 flex flex-wrap items-center gap-4 text-sm md:text-base">
                      <div className="flex items-center gap-2">
                        <IoCalendarClear className="text-primary h-5 w-5" />
                        {format(
                          parseLocalDate(rehearsal.date),
                          "dd MMMM yyyy",
                          {
                            locale: fr,
                          },
                        )}
                      </div>
                      <div className="font-medium">
                        {rehearsal.start_time.slice(0, 5)} -{" "}
                        {rehearsal.end_time.slice(0, 5)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-foreground/60 bg-default-100/80 rounded-xl py-16 text-center backdrop-blur-sm"
              >
                Aucune répétition trouvée
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendrier;
