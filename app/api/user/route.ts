import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookie
    const userId = request.cookies.get("userId")?.value;
    
    if (!userId) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Find the user
    const user = db.findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      username: user.username,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

