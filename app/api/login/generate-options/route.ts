import { NextRequest, NextResponse } from "next/server";
import {
  generateAuthenticationOptions,
  GenerateAuthenticationOptionsOpts,
} from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { RP_ID, generateSessionId } from "@/lib/webauthn";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = db.findUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.credentials.length === 0) {
      return NextResponse.json(
        { error: "No credentials registered for this user" },
        { status: 400 }
      );
    }

    const opts: GenerateAuthenticationOptionsOpts = {
      rpID: RP_ID,
      // Allow users to use any of their registered credentials
      allowCredentials: user.credentials.map((cred) => ({
        id: cred.credentialID,
        type: "public-key",
        transports: cred.transports,
      })),
      userVerification: "preferred",
    };

    const options = await generateAuthenticationOptions(opts);

    // Generate a session ID and store the challenge
    const sessionId = generateSessionId();
    db.saveChallenge(sessionId, options.challenge, username);

    console.log("🔵 [Login Generate] Created session:", sessionId);
    console.log("🔵 [Login Generate] Stored challenge for username:", username);
    
    // Verify it was saved
    const savedChallenge = db.getChallenge(sessionId);
    console.log("🔵 [Login Generate] Verified saved challenge:", savedChallenge ? "YES" : "NO");

    // Return options to the client
    const response = NextResponse.json(options);
    // Store session ID in a cookie
    response.cookies.set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 5, // 5 minutes
    });

    console.log("🔵 [Login Generate] Set cookie with sessionId:", sessionId);

    return response;
  } catch (error) {
    console.error("Error generating authentication options:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication options" },
      { status: 500 }
    );
  }
}

