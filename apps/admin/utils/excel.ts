// utils/excel.ts
/**
 * Get the Excel CSV URL from environment variable
 * Falls back to a default URL if not set
 */
export function getExcelCsvUrl(): string {
  const url =
    process.env.EXCEL_CSV_URL ||
    "https://docs.google.com/spreadsheets/d/1hOotB84m3sRtyzQTWygULucYYHYe_HDss8XAJ_vrDJE/pub?gid=0&single=true&output=csv";

  if (!url) {
    throw new Error(
      "EXCEL_CSV_URL environment variable is not set. Please configure it in your .env file.",
    );
  }

  return url;
}
