import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message, year } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 },
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Insert new memory (will be pending approval by default)
    const { data, error } = await supabase
      .from("anniversary_memories")
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        year: year ? parseInt(year) : null,
        is_approved: false, // Requires admin approval
        is_featured: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error submitting memory:", error);
      return NextResponse.json(
        { error: "Failed to submit memory" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Memory submitted successfully",
      id: data.id,
    });
  } catch (error) {
    console.error("Error in POST /api/anniversary/submit-memory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
