"use client";

import { useBugScreenshots } from "@/hooks/useBugScreenshots";

/**
 * The screenshots a member attached to a report, as thumbnails that open the
 * full image in a new tab. Nothing when there are none.
 */
export function BugScreenshots({
  paths,
  title,
}: {
  paths: string[] | undefined;
  title: string;
}) {
  const { data: shots = [], isPending, isError } = useBugScreenshots(paths);
  const count = paths?.length ?? 0;
  if (count === 0) return null;

  return (
    <section aria-label="Captures d'écran" className="space-y-2">
      <h3 className="text-detail text-foreground font-medium">
        {count === 1 ? "Capture d'écran" : `${count} captures d'écran`}
      </h3>
      {isPending ? (
        <p className="text-note text-muted-foreground">
          Chargement des captures…
        </p>
      ) : isError || shots.length === 0 ? (
        <p className="text-note text-muted-foreground">
          Les captures n&apos;ont pas pu être chargées.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {shots.map((shot, i) => (
            <li key={shot.path} className="list-none">
              <a
                href={shot.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border focus-visible:ring-ring block overflow-hidden rounded-md border focus-visible:ring-2 focus-visible:outline-none"
              >
                {/* Signed Storage links: next/image would need the host configured and gains nothing here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shot.url}
                  alt={`Capture ${i + 1} sur ${shots.length} du signalement « ${title} » (ouvre l'image en grand)`}
                  className="bg-muted h-40 w-auto max-w-[10rem] object-contain"
                  loading="lazy"
                />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
