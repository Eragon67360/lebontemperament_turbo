// « Commandes »: what the /api/orders routes share. The rules for each value
// live in @repo/domain/utils/orders; the database enforces the same limits
// and RLS keeps every table superadmin-only.
import { checkDriverAuthorization } from "@/utils/auth";
import type { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export const NOT_INSTALLED_MESSAGE =
  "Les commandes ne sont pas encore installées sur cette base : la migration doit d'abord être appliquée.";

/** 42P01 / PGRST205: the migration isn't applied on this database yet. */
export function isMissingTable(error: { code?: string | null } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

export type DbErrorLike = {
  code?: string | null;
  message?: string | null;
} | null;

export type DescribedError = {
  status: 400 | 403 | 404 | 409 | 500 | 503;
  error: string;
  notInstalled?: true;
};

/**
 * The HTTP answer for a database error, worded for the admin. The functions
 * of the migration raise their own French messages (`RAISE EXCEPTION … USING
 * ERRCODE`), passed through for the codes they use; a foreign key on delete
 * (an ordered product) becomes a 409 the page explains; anything else is a
 * plain 500 with `fallback`.
 */
export function describeDbError(
  error: DbErrorLike,
  fallback: string,
): DescribedError {
  if (isMissingTable(error)) {
    return { status: 503, error: NOT_INSTALLED_MESSAGE, notInstalled: true };
  }
  const message = error?.message?.trim();
  switch (error?.code) {
    case "42501":
      return { status: 403, error: "Réservé aux superadmins" };
    case "P0002":
      return { status: 404, error: message || "Introuvable" };
    case "PGRST116":
      return { status: 404, error: "Introuvable" };
    case "23503":
      return {
        status: 409,
        error:
          "Ce produit figure dans des commandes : rendez-le indisponible plutôt que de le supprimer.",
      };
    case "22023":
    case "23514":
      return { status: 400, error: message || fallback };
    default:
      return { status: 500, error: fallback };
  }
}

/** The JSON answer for a database error (see `describeDbError`). */
export function dbErrorResponse(error: DbErrorLike, fallback: string) {
  const described = describeDbError(error, fallback);
  if (described.status === 500) console.error(fallback, error);
  return NextResponse.json(described, { status: described.status });
}

/**
 * Every /api/orders route starts here: 401 when signed out, 403 for any
 * role but superadmin (the database's policies say the same).
 */
export async function requireSuperadmin() {
  const auth = await checkDriverAuthorization();
  if (!auth.authorized) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: auth.error },
        { status: auth.status },
      ),
    };
  }
  return { ok: true as const, user: auth.user };
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** Display names of the given accounts (« vendu par », drivers). */
export async function displayNames(
  supabase: Client,
  ids: readonly (string | null)[],
): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", unique);
  if (error || !data) return {};
  return Object.fromEntries(
    data.map((profile) => [
      profile.id,
      profile.display_name?.trim() || profile.email?.split("@")[0] || "Membre",
    ]),
  );
}

/** The products of a sale, or null when the sale does not exist. */
export async function saleProductIds(
  supabase: Client,
  saleId: string,
): Promise<
  { ok: true; ids: Set<string> } | { ok: false; response: NextResponse }
> {
  const { data: sale, error: saleError } = await supabase
    .from("order_sales")
    .select("id")
    .eq("id", saleId)
    .maybeSingle();
  if (saleError) {
    return {
      ok: false,
      response: dbErrorResponse(saleError, "La vente n'a pas pu être lue"),
    };
  }
  if (!sale) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Vente introuvable" },
        { status: 404 },
      ),
    };
  }
  const { data, error } = await supabase
    .from("order_products")
    .select("id")
    .eq("sale_id", saleId);
  if (error) {
    return {
      ok: false,
      response: dbErrorResponse(error, "Le catalogue n'a pas pu être lu"),
    };
  }
  return { ok: true, ids: new Set(data.map((p) => p.id)) };
}
