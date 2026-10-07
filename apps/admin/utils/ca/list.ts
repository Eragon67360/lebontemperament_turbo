import { parseIsoDate } from "@/utils/concerts/schedule";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/** Most recent meeting first, as the page always listed them. */
export function sortByMeetingDate<T extends { date_from: string }>(
  cas: readonly T[],
): T[] {
  return [...cas].sort(
    (a, b) => new Date(b.date_from).getTime() - new Date(a.date_from).getTime(),
  );
}

/** « 25 mai 2025 », read as the local day (never shifted by the UTC offset). */
export function meetingDateLabel(value: string): string {
  const date = parseIsoDate(value);
  return date ? format(date, "d MMMM yyyy", { locale: fr }) : value;
}

/** « 1 compte rendu », « 12 comptes rendus ». */
export function caCountLabel(count: number): string {
  return count === 1 ? "1 compte rendu" : `${count} comptes rendus`;
}
