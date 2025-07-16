"use client";
import React, { useState, useEffect } from "react";
import GoogleCalendar from "@/components/GoogleCalendar";
import { IoCalendarClear, IoList } from "react-icons/io5";
import { MdCalendarMonth } from "react-icons/md";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Rehearsal, GroupType } from "@/types/rehearsals"; // adjust import path

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

  const filteredRehearsals = rehearsals.filter(
    (rehearsal) =>
      selectedGroup === "all" || rehearsal.group_type === selectedGroup,
  );

  const groupColors: Record<GroupType, string> = {
    Orchestre: "bg-blue-100 text-blue-700",
    Hommes: "bg-green-100 text-green-700",
    Femmes: "bg-purple-100 text-purple-700",
    "Jeunes/Enfants": "bg-yellow-100 text-yellow-700",
    "Choeur complet": "bg-red-100 text-red-700",
    Tous: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="w-full p-2 md:p-4 lg:p-6">
      <div className="rounded-xl bg-white shadow-sm">
        {/* Header */}
        <div className="border-b p-2 md:p-4 lg:p-6">
          <div className="flex flex-col items-start justify-between gap-2 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-md p-2">
                <IoCalendarClear className="text-primary h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Calendrier
                </h2>
                <p className="text-sm text-gray-500">
                  Consultez les répétitions à venir
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGoogleCalendar(!showGoogleCalendar)}
              className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              {showGoogleCalendar ? (
                <>
                  <IoList className="h-4 w-4" />
                  Vue liste
                </>
              ) : (
                <>
                  <MdCalendarMonth className="h-4 w-4" />
                  Calendrier complet
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        {!showGoogleCalendar && (
          <div className="border-b p-2 md:p-4 lg:p-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGroup("all")}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  selectedGroup === "all"
                    ? "bg-primary/10 text-primary"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Pas de filtre
              </button>
              {Object.keys(groupColors).map((group) => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group as GroupType)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    selectedGroup === group
                      ? "bg-primary/10 text-primary"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-2 md:p-4 lg:p-6">
          {showGoogleCalendar ? (
            <div className="overflow-hidden rounded-lg bg-gray-50">
              <GoogleCalendar embedId={"lebontemperament@gmail.com"} />
            </div>
          ) : (
            <div className="space-y-4">
              {loadingRehearsals ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 rounded-lg bg-gray-100" />
                  ))}
                </div>
              ) : filteredRehearsals.length > 0 ? (
                filteredRehearsals.map((rehearsal) => (
                  <div
                    key={rehearsal.id}
                    className="hover:border-primary/20 rounded-lg border bg-white p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {rehearsal.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {rehearsal.place}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${groupColors[rehearsal.group_type]}`}
                      >
                        {rehearsal.group_type}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <IoCalendarClear className="h-4 w-4" />
                        {format(parseISO(rehearsal.date), "dd MMMM yyyy", {
                          locale: fr,
                        })}
                      </div>
                      <div>
                        {rehearsal.start_time.slice(0, 5)} -{" "}
                        {rehearsal.end_time.slice(0, 5)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-500">
                  Aucune répétition trouvée
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendrier;
