import { NextRequest, NextResponse } from "next/server";
import {
  generateRegistrationOptions,
  GenerateRegistrationOptionsOpts,
} from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { RP_NAME, RP_ID, generateSessionId } from "@/lib/webauthn";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = db.findUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    // Create a new user (without credentials yet)
    const user = db.createUser(username);

    const opts: GenerateRegistrationOptionsOpts = {
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: username,
      userDisplayName: username,
      // Don't prompt users for additional information about the authenticator
      attestationType: "none",
      // Prevent users from re-registering existing authenticators
      excludeCredentials: [],
      authenticatorSelection: {
        // "platform" = bound to device (like Touch ID, Face ID, Windows Hello)
        // "cross-platform" = can be used across devices (like hardware security keys)
        // undefined = allow both
        authenticatorAttachment: "platform",
        // Require authenticators that can verify the user
        userVerification: "preferred",
        // Prefer passkeys that can be backed up (but don't require it)
        residentKey: "preferred",
      },
    };

    const options = await generateRegistrationOptions(opts);

    // Generate a session ID and store the challenge
    const sessionId = generateSessionId();
    db.saveChallenge(sessionId, options.challenge, username);

    console.log("🔵 [Register Generate] Created session:", sessionId);
    console.log("🔵 [Register Generate] Stored challenge for username:", username);
    console.log("🔵 [Register Generate] Challenge:", options.challenge.substring(0, 20) + "...");
    
    // Verify it was saved
    const savedChallenge = db.getChallenge(sessionId);
    console.log("🔵 [Register Generate] Verified saved challenge:", savedChallenge ? "YES" : "NO");

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

    console.log("🔵 [Register Generate] Set cookie with sessionId:", sessionId);

    return response;
  } catch (error) {
    console.error("Error generating registration options:", error);
    return NextResponse.json(
      { error: "Failed to generate registration options" },
      { status: 500 }
    );
  }
}

