// utils/memberLists.ts
//
// The member roster (a private Google Sheet) and the Google Groups lists
// (read through the Apps Script) are the association's real member lists, so
// only production reads them. Staging and PR previews work on the staging
// database, whose members are fake: there the roster and Groups routes answer
// 403 with `productionOnly: true`, and the two pages say so instead of
// loading.
//
// Local development refuses them too, unless the admin's .env.local sets
// ALLOW_MEMBER_LISTS_IN_DEVELOPMENT=1 (for work on these pages, knowing that
// « Appliquer » would then invite real members into the database the local
// keys point at). A Vercel deployment other than production never reads them,
// whatever its variables.

/** Title of the notice the pages show outside production. */
export const PRODUCTION_ONLY_TITLE = "Disponible uniquement en production";

/** Answer of the roster routes outside production. */
export const ROSTER_PRODUCTION_ONLY_MESSAGE =
  "Disponible uniquement en production : le site de test n'a pas accès au tableau des membres.";

/** Answer of the Google Groups routes outside production. */
export const GROUPS_PRODUCTION_ONLY_MESSAGE =
  "Disponible uniquement en production : le site de test n'a pas accès aux groupes Google.";

/**
 * Whether this deployment may read the roster and the Google Groups lists:
 * production, or local development (no VERCEL_ENV, or `development` as
 * `vercel env pull` writes it) with the opt-in set to "1". Preview (staging
 * and PR previews) and any other value: never.
 */
export function memberListsAvailable(
  vercelEnv: string | undefined = process.env.VERCEL_ENV,
  optIn: string | undefined = process.env.ALLOW_MEMBER_LISTS_IN_DEVELOPMENT,
): boolean {
  if (vercelEnv === "production") return true;
  const local = !vercelEnv || vercelEnv === "development";
  return local && optIn === "1";
}

/** The 403 a roster or Groups route answers outside production. */
export function productionOnlyResponse(message: string): Response {
  return Response.json(
    { error: message, productionOnly: true },
    { status: 403 },
  );
}
