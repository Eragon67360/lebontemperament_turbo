// app/api/files/route.ts
import { CreateFileDTO } from "@/types/files";
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("programId");
  const groupId = searchParams.get("groupId");
  const folderId = searchParams.get("folderId");

  const supabase = await createClient();

  let query = supabase
    .from("files")
    .select("*")
    .eq("program_id", programId)
    .eq("group_id", groupId)
    .order("name");

  if (folderId) {
    query = query.eq("folder_id", folderId);
  } else {
    query = query.is("folder_id", null);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  const supabase = await createClient();
  const file: CreateFileDTO = await request.json();

  const { data, error } = await supabase
    .from("files")
    .insert([{ ...file, uploaded_by: authCheck?.user?.id }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
