/**
 * The feature-flag keys and shapes shared by server and client code. Kept
 * apart from `lib/featureFlags.ts`, whose reader needs the server Supabase
 * client: a client component importing a value from there would ship
 * supabase-js to every visitor.
 */
export const ANNIVERSARY_FLAG_KEY = "anniversary_40_years";

/** The flags the website reads; every page render gets them from one cached row set. */
export type PublicFeatureFlags = {
  anniversary: boolean;
};
