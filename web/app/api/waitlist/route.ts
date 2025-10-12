import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const appIdentifier = process.env.WAITLIST_APP_ID;
    const appSecret = process.env.WAITLIST_APP_SECRET;

    if (!appIdentifier || !appSecret) {
      console.error(
        "Missing WAITLIST_APP_ID or WAITLIST_APP_SECRET environment variables"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Call the waitlist API
    const response = await fetch("https://www.stateless.cx/api/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        app_identifier: appIdentifier,
        app_secret: appSecret,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to add to waitlist" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: data.message || "Successfully added to waitlist",
      entry: data.entry,
    });
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
