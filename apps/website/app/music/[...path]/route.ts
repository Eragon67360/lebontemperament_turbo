import { mediaRedirect } from "@/lib/media";

// Old URL of a file that moved to Storage (#344): see lib/media.ts.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return mediaRedirect("music", (await params).path);
}

export const HEAD = GET;
