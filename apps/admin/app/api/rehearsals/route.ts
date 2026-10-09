// app/api/rehearsals/route.ts
import { REHEARSAL_COLUMNS } from "@/lib/columns";
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import type { TablesInsert } from "@repo/domain/database.types";
import { NextResponse } from "next/server";

/** The fields a client may send for a rehearsal (bulk insert). */
type RehearsalInput = Pick<
  TablesInsert<"rehearsals">,
  | "name"
  | "place"
  | "address"
  | "room"
  | "date"
  | "start_time"
  | "end_time"
  | "group_type"
>;

export async function GET() {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    // Session client: rehearsals are readable under RLS (the members' app
    // reads them the same way), so the service role isn't needed here.
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("rehearsals")
      .select(REHEARSAL_COLUMNS)
      .order("date", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error fetching rehearsals" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    const supabase = await createClient();
    const json = await request.json();

    // Check if it's an array (bulk insert) or single object
    const isBulk = Array.isArray(json);

    if (isBulk) {
      // Bulk insert
      const rehearsals = json.map((item: RehearsalInput) => ({
        name: item.name,
        place: item.place,
        address: item.address,
        room: item.room,
        date: item.date,
        start_time: item.start_time,
        end_time: item.end_time,
        group_type: item.group_type,
      }));

      const { data, error } = await supabase
        .from("rehearsals")
        .insert(rehearsals)
        .select(REHEARSAL_COLUMNS);

      if (error) throw error;

      return NextResponse.json(data, { status: 201 });
    } else {
      // Single insert
      const { name, place, address, room, date, start_time, end_time } = json;
      const { group_type } = json;

      const { data, error } = await supabase
        .from("rehearsals")
        .insert([
          {
            name,
            place,
            address,
            room,
            date,
            start_time,
            end_time,
            group_type,
          },
        ])
        .select(REHEARSAL_COLUMNS)
        .single();

      if (error) throw error;

      return NextResponse.json(data, { status: 201 });
    }
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error creating rehearsal" },
      { status: 500 },
    );
  }
}
