"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FaRegFilePdf } from "react-icons/fa6";

type PdfListProps = {
  jsonFileName: string;
  context: string;
};

type PdfFile = {
  name: string;
  date: string;
};

const contextPreposition: { [key: string]: string } = {
  CA: "du ",
  AG: "de ",
  Gazettes: "du ",
  PM: "N°",
};

const contextTitre: { [key: string]: string } = {
  CA: "CA",
  AG: "AG",
  Gazettes: "Gazette",
  PM: "Pêle-Mêle",
};

const PdfList: React.FC<PdfListProps> = ({ jsonFileName, context }) => {
  const [pdfFiles, setPdfFiles] = useState([]);

  useEffect(() => {
    fetch(`/json/${jsonFileName}.json`)
      .then((response) => response.json())
      .then((data) => setPdfFiles(data));
  }, [jsonFileName]);

  const formatDate = (dateStr: string): string => {
    // Check if dateStr is just a year (e.g., '2023')
    if (dateStr.length === 4 && /^\d{4}$/.test(dateStr)) {
      return dateStr;
    }
    if (dateStr.length === 1) {
      //if the date is a version number
      return dateStr;
    }

    // Assuming the dateStr format is YY-MM-DD for complete dates
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      // Convert YY-MM-DD to DD/MM/YYYY
      // Assuming '20' prefix for year for simplicity; adjust based on your data if needed
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }

    // If the input doesn't match expected formats, return the original string or handle as needed
    return dateStr;
  };

  const getResultForContext = (context: string) => {
    const contextResult =
      contextTitre[context] + " " + contextPreposition[context];

    return contextResult || "";
  };

  return (
    <div className="mt-2 md:mt-4 lg:mt-8 flex flex-wrap gap-6">
      {pdfFiles.map((file: PdfFile, index: number) => (
        <Link
          href={`/pdf/${context}/${file.name}`}
          key={index}
          target="_blank"
          rel="noopener"
          className="p-2 lg:p-4 rounded-lg bg-primary text-white flex gap-4 items-center hover:bg-[#18858ba7] text-xs md:text-sm"
        >
          <FaRegFilePdf />{" "}
          <span>
            {getResultForContext(context)}
            {formatDate(file.date)}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default PdfList;
