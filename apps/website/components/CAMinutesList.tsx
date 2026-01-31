"use client";

import { CA } from "@/types/ca";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FaRegFilePdf } from "react-icons/fa6";

const CAMinutesList: React.FC = () => {
  const [caMinutes, setCaMinutes] = useState<CA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCA = async () => {
      try {
        const response = await fetch("/api/cas");
        if (!response.ok) throw new Error("Failed to fetch CA minutes");
        const data = await response.json();
        setCaMinutes(data);
      } catch (error) {
        console.error("Error fetching CA minutes:", error);
        setCaMinutes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCA();
  }, []);

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      // Format as DD/MM/YYYY
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="mt-2 flex flex-wrap gap-6 md:mt-4 lg:mt-8">
        <p className="text-default-500 text-sm">Chargement...</p>
      </div>
    );
  }

  if (caMinutes.length === 0) {
    return (
      <div className="mt-2 flex flex-wrap gap-6 md:mt-4 lg:mt-8">
        <p className="text-default-500 text-sm">
          Aucun compte-rendu disponible
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-6">
      {caMinutes.map((minute) => (
        <Link
          href={minute.file_url || "#"}
          key={minute.id}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary flex items-center gap-4 rounded-lg p-2 text-xs text-white hover:bg-[#18858ba7] md:text-sm lg:p-4"
        >
          <FaRegFilePdf />
          <span>CA du {formatDate(minute.date_from)}</span>
        </Link>
      ))}
    </div>
  );
};

export default CAMinutesList;
