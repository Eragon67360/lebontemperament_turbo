import { requireSuperadmin } from "@/utils/orders/server";
import {
  addressQuery,
  addressSearchUrl,
  parseAddressSuggestions,
} from "@repo/domain/utils/addressSearch";
import { NextResponse } from "next/server";

/**
 * GET ?q=: address suggestions for a buyer (« Commandes »), from the national
 * address base. Asked from the server so the browser only talks to the
 * admin. A query too short to search answers no suggestion; a geocoder that
 * fails answers 502 and the field stays a plain text field.
 */
export async function GET(request: Request) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;

  const q = addressQuery(new URL(request.url).searchParams.get("q") ?? "");
  if (!q) return NextResponse.json({ suggestions: [] });

  try {
    const res = await fetch(addressSearchUrl(q), {
      signal: AbortSignal.timeout(4000),
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`geocoder ${res.status}`);
    return NextResponse.json({
      suggestions: parseAddressSuggestions(await res.json()),
    });
  } catch (error) {
    console.error(
      "Address search failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Les suggestions d'adresse sont indisponibles" },
      { status: 502 },
    );
  }
}
