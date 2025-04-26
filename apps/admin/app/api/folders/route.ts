// app/api/folders/route.ts
import { CreateFolderDTO } from "@/types/files";
import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("programId");
  const groupId = searchParams.get("groupId");

  const supabase = await createClient();

  const query = supabase
    .from("folders")
    .select("*")
    .eq("program_id", programId)
    .eq("group_id", groupId)
    .order("name");

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
      { status: authCheck.status },
    );
  }

  const supabase = await createClient();
  const folder: CreateFolderDTO = await request.json();

  // Generate path based on parent folder
  let path = folder.name;
  if (folder.parent_folder_id) {
    const { data: parentFolder } = await supabase
      .from("folders")
      .select("path")
      .eq("id", folder.parent_folder_id)
      .single();
    if (parentFolder) {
      path = `${parentFolder.path}/${folder.name}`;
    }
  }

  const { data, error } = await supabase
    .from("folders")
    .insert([{ ...folder, path }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
