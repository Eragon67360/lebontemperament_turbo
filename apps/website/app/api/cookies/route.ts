import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { action, cookies } = await request.json();
  const response = NextResponse.json({ message: "Cookies updated" });

  if (!cookies || !Array.isArray(cookies)) {
    return NextResponse.json(
      { message: "Cookies array is required" },
      { status: 400 },
    );
  }

  cookies.forEach(({ name, value }) => {
    if (!name) return; // skip invalid entries

    if (action === "accept") {
      response.cookies.set(name, value, { path: "/" });
    } else if (action === "reject") {
      response.cookies.set(name, "", { path: "/", maxAge: -1 });
    }
  });

  return response;
}
