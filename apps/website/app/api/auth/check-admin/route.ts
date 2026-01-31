import { checkAdminAuth } from "@/utils/auth";
import { NextResponse } from "next/server";

/**
 * API endpoint to check if the current authenticated user is an admin
 * Used by client components to determine admin status
 */
export async function GET() {
  try {
    const { isAdmin } = await checkAdminAuth();
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("Error checking admin status:", error);
    // Default to false on error for security
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
}
