import { Badge } from "@/components/ui/badge";
import type { Program } from "@/types/work";
import RouteNames from "@/utils/routes";
import { FolderArchive } from "lucide-react";
import Link from "next/link";

type LegacyProgram = Pick<
  Program,
  "id" | "name" | "start_date" | "end_date" | "is_active"
>;

const MONTH = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

function formatSeason(start: string, end: string) {
  return `${MONTH.format(new Date(start))} – ${MONTH.format(new Date(end))}`;
}

/**
 * The old « Espace de travail »: programmes whose files were uploaded to
 * Supabase Storage from the admin and never shown to members. Kept reachable
 * (read, upload and delete as before) until the owner retires it.
 */
export function LegacyStorageSection({
  programs,
  failed,
}: {
  programs: LegacyProgram[];
  failed: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-detail text-muted-foreground">
        Fichiers déposés autrefois dans l&apos;admin. Les membres ne les ont
        jamais vus : ce qu&apos;ils consultent vient du Drive ci-dessus.
      </p>
      {failed ? (
        <p role="alert" className="text-detail text-danger">
          Les anciens programmes n&apos;ont pas pu être chargés. Rechargez la
          page pour réessayer.
        </p>
      ) : programs.length === 0 ? (
        <p className="text-detail text-muted-foreground">
          Aucun ancien programme.
        </p>
      ) : (
        <ul className="border-border divide-border divide-y rounded-md border">
          {programs.map((program) => (
            <li
              key={program.id}
              className="flex min-h-(--row-h) items-center gap-3 px-4 py-2"
            >
              <FolderArchive
                className="text-foreground-faint size-5 shrink-0"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`${RouteNames.DASHBOARD.MEMBERS.TRAVAIL_ROOT}/${program.id}`}
                  className="text-foreground hover:text-primary-text font-medium underline-offset-4 hover:underline"
                >
                  {program.name}
                </Link>
                <p className="text-note text-muted-foreground">
                  {formatSeason(program.start_date, program.end_date)}
                </p>
              </div>
              {program.is_active && <Badge variant="secondary">En cours</Badge>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
