import { checkAuthorization } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

interface JsonProject {
  id: number;
  name: string;
  subName?: string;
  date: string;
  image: string; // Full Cloudinary URL
  slug: string;
  explanation?: string;
  banniere?: {
    url: string; // Cloudinary path
    photographer?: {
      name: string;
      url: string;
    };
  };
  image2?: {
    url: string; // Cloudinary path
    photographer?: {
      name: string;
      url: string;
    };
  };
  image3?: {
    url: string; // Cloudinary path
    photographer?: {
      name: string;
      url: string;
    };
  };
  text1?: string;
  text2?: string;
  author?: {
    name: string;
  };
  press_articles?: Array<{
    title: string;
    url: string;
    source: string;
  }>;
}

// Extract Cloudinary path from full URL
function extractCloudinaryPath(url: string): string | null {
  if (!url) return null;

  // If it's already a path (starts with "Site/"), return as is
  if (url.startsWith("Site/")) {
    return url;
  }

  // Extract path from full Cloudinary URL
  // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{path}
  // Example: https://res.cloudinary.com/dlt2j3dld/image/upload/f_auto,q_auto/v1/Site/home/concerts/voyage_operas
  // We want: Site/home/concerts/voyage_operas

  // Match everything after /image/upload/ and find the part that starts with "Site/"
  const uploadMatch = url.match(/\/image\/upload\/(.+)$/);
  if (uploadMatch && uploadMatch[1]) {
    const afterUpload = uploadMatch[1];
    // Find the part that starts with "Site/"
    const siteMatch = afterUpload.match(/(Site\/.+)$/);
    if (siteMatch && siteMatch[1]) {
      return siteMatch[1];
    }
    // If no "Site/" found, return everything after the last transformation segment
    // Split by "/" and find the last meaningful segment
    const parts = afterUpload.split("/");
    // Usually the path starts after version (v1, v2, etc.) or transformations
    // Look for segments that look like paths (contain multiple parts or start with common prefixes)
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (part && (part.includes("_") || part.match(/^[A-Z]/))) {
        return parts.slice(i).join("/");
      }
    }
    // Fallback: return the last segment
    return parts[parts.length - 1] || null;
  }

  return null;
}

export async function POST() {
  const authCheck = await checkAuthorization();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    // Fetch JSON data from the website's public folder
    const jsonUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3002"}/json/projects.json`;
    console.log("JSON URL:", jsonUrl);
    const response = await fetch(jsonUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch JSON: ${response.statusText}`);
    }

    const jsonProjects: JsonProject[] = await response.json();
    const supabase = await createClient();

    // Check if projects already exist
    const { data: existingProjects } = await supabase
      .from("projects")
      .select("slug");

    const existingSlugs = new Set(existingProjects?.map((p) => p.slug) || []);

    const projectsToInsert = jsonProjects
      .filter((p) => !existingSlugs.has(p.slug))
      .map((jsonProject, index) => {
        // Extract Cloudinary path from image URL
        const imagePath = extractCloudinaryPath(jsonProject.image);

        return {
          name: jsonProject.name,
          sub_name: jsonProject.subName || null,
          slug: jsonProject.slug,
          date: jsonProject.date,
          image: imagePath,
          explanation: jsonProject.explanation || null,
          banniere: jsonProject.banniere?.url || null,
          banniere_photographer_name:
            jsonProject.banniere?.photographer?.name || null,
          banniere_photographer_url:
            jsonProject.banniere?.photographer?.url || null,
          image2: jsonProject.image2?.url || null,
          image2_photographer_name:
            jsonProject.image2?.photographer?.name || null,
          image2_photographer_url:
            jsonProject.image2?.photographer?.url || null,
          image3: jsonProject.image3?.url || null,
          image3_photographer_name:
            jsonProject.image3?.photographer?.name || null,
          image3_photographer_url:
            jsonProject.image3?.photographer?.url || null,
          text1: jsonProject.text1 || null,
          text2: jsonProject.text2 || null,
          author_name: jsonProject.author?.name || null,
          press_articles: jsonProject.press_articles || null,
          display_order: jsonProjects.length - index, // Reverse order to maintain chronological order
        };
      });

    if (projectsToInsert.length === 0) {
      return NextResponse.json({
        message: "All projects already exist in the database",
        migrated: 0,
        skipped: jsonProjects.length,
      });
    }

    // Insert projects in batches to avoid overwhelming the database
    const batchSize = 10;
    let migrated = 0;
    const errors: string[] = [];

    for (let i = 0; i < projectsToInsert.length; i += batchSize) {
      const batch = projectsToInsert.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("projects")
        .insert(batch)
        .select();

      if (error) {
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      } else {
        migrated += data?.length || 0;
      }
    }

    return NextResponse.json({
      message: "Migration completed",
      migrated,
      skipped: jsonProjects.length - migrated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
