"use client";

import { membersButtonClass } from "@/components/membres/MembersButton";
import { CA } from "@repo/domain/types/ca";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { IoDocumentTextOutline } from "react-icons/io5";

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
      <p role="status" className="text-muted">
        Chargement…
      </p>
    );
  }

  if (caMinutes.length === 0) {
    return (
      <p className="text-muted">
        Aucun compte-rendu disponible pour l’instant.
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-3">
      {caMinutes.map((minute) => (
        <li key={minute.id}>
          <Link
            href={minute.file_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={membersButtonClass("solid", "text-base", "md")}
          >
            <IoDocumentTextOutline aria-hidden="true" className="h-5 w-5" />
            <span>
              CA du {formatDate(minute.date_from)}
              <span className="sr-only"> (PDF, nouvel onglet)</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default CAMinutesList;
