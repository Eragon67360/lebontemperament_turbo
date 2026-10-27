import type { transformProjectForFrontend } from "@repo/domain/utils/projects";

/**
 * A public concert story as the pages and components show it: what
 * `transformProjectForFrontend` builds from a `projects` row (its
 * `ProjectStory` lists the columns read).
 */
export type ConcertProject = ReturnType<typeof transformProjectForFrontend>;
