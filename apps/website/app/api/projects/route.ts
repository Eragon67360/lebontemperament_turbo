// app/api/projects/route.ts
import { DatabaseProject } from "@/types/projects";
import { transformProjectForFrontend } from "@/utils/projects";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    let projects: DatabaseProject | DatabaseProject[] | null;
    let error;

    if (slug) {
      const { data, error: queryError } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      projects = data;
      error = queryError;
    } else {
      const { data, error: queryError } = await supabase
        .from("projects")
        .select("*")
        .order("display_order", { ascending: false })
        .order("date", { ascending: false });
      projects = data;
      error = queryError;
    }

    if (error) throw error;

    if (!projects) {
      return NextResponse.json([]);
    }

    // Transform database projects to frontend format
    const transformedProjects = Array.isArray(projects)
      ? projects.map((p: DatabaseProject) => transformProjectForFrontend(p))
      : [transformProjectForFrontend(projects as DatabaseProject)];

    return NextResponse.json(
      Array.isArray(projects) ? transformedProjects : transformedProjects[0],
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error fetching projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const json = await request.json();

    const { data, error } = await supabase
      .from("projects")
      .insert(json)
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error creating project" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("id");
  try {
    const supabase = await createClient();
    const json = await request.json();

    const { data, error } = await supabase
      .from("projects")
      .update(json)
      .eq("id", projectId)
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error updating project" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("id");
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error deleting project" },
      { status: 500 },
    );
  }
}
