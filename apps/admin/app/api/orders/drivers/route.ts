import { currentRound } from "@/utils/orders/round";
import { dbErrorResponse, requireSuperadmin } from "@/utils/orders/server";
import type { Driver, DriverRound } from "@/utils/orders/types";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * The round each driver's next « Ajouter à la tournée » would join, by driver
 * id (see `currentRound`; null: none, a new one is created). Three reads in
 * turn: the latest round of each driver, the stops of those rounds, then the
 * sale of each stop's order. Null when one fails: the round only informs the
 * dialog, so the drivers go out without it rather than as an error.
 */
async function currentRounds(
  supabase: Client,
  driverIds: readonly string[],
): Promise<Map<string, DriverRound | null | undefined> | null> {
  const unreadable = (error: unknown) => {
    console.error("Les tournées en cours n'ont pas pu être lues", error);
    return null;
  };

  const latest = await Promise.all(
    driverIds.map(async (driverId) => ({
      driverId,
      result: await supabase
        .from("deliveries")
        .select("id, created_at, scheduled_at, scheduled_end_at")
        .eq("driver_id", driverId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    })),
  );
  const latestFailed = latest.find(({ result }) => result.error)?.result.error;
  if (latestFailed) return unreadable(latestFailed);

  const roundIds = latest.flatMap(({ result }) =>
    result.data ? [result.data.id] : [],
  );
  const stopsResult =
    roundIds.length > 0
      ? await supabase
          .from("delivery_recipients")
          .select("id, delivery_id, sort_order, delivered_at")
          .in("delivery_id", roundIds)
      : null;
  if (stopsResult?.error) return unreadable(stopsResult.error);
  const stops = stopsResult?.data ?? [];

  const titles = new Map<string, string>();
  if (stops.length > 0) {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("delivery_recipient_id, order_sales(title)")
      .in(
        "delivery_recipient_id",
        stops.map((stop) => stop.id),
      );
    if (error) return unreadable(error);
    for (const order of orders) {
      if (order.delivery_recipient_id && order.order_sales) {
        titles.set(order.delivery_recipient_id, order.order_sales.title);
      }
    }
  }

  const rounds = new Map<string, DriverRound | null | undefined>();
  for (const { driverId, result } of latest) {
    const round = result.data;
    rounds.set(
      driverId,
      round
        ? currentRound(
            round,
            stops.filter((stop) => stop.delivery_id === round.id),
            titles,
          )
        : null,
    );
  }
  return rounds;
}

/**
 * GET: who can drive a delivery round (the superadmins), for « Ajouter à la
 * tournée ». The caller is listed too: they are the default driver. Each
 * driver carries the `round` their next add would join (null: they have none
 * and a new one will be created), left out when it could not be read.
 */
export async function GET() {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.response;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .eq("role", "superadmin")
    .order("display_name", { ascending: true });
  if (error) {
    return dbErrorResponse(error, "Les livreurs n'ont pas pu être chargés");
  }
  const rounds = await currentRounds(
    supabase,
    data.map((profile) => profile.id),
  );
  const drivers: Driver[] = data.map((profile) => ({
    id: profile.id,
    name:
      profile.display_name?.trim() || profile.email?.split("@")[0] || "Membre",
    round: rounds?.get(profile.id),
  }));
  return NextResponse.json({ drivers, me: auth.user.id });
}
