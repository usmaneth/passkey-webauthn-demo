import { NextRequest, NextResponse } from "next/server";
import {
  verifyRegistrationResponse,
  VerifyRegistrationResponseOpts,
} from "@simplewebauthn/server";
import { db, Authenticator } from "@/lib/db";
import { RP_ID, getOrigin } from "@/lib/webauthn";
import type { RegistrationResponseJSON } from "@simplewebauthn/server/script/deps";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const credential: RegistrationResponseJSON = body;

    console.log("\n🟢 ====== VERIFY REGISTRATION ======");
    console.log("🟢 [Register Verify] All cookies:", request.cookies.getAll());

    // Get session ID from cookie
    const sessionId = request.cookies.get("sessionId")?.value;
    console.log("🟢 [Register Verify] Looking for sessionId:", sessionId);
    
    if (!sessionId) {
      console.error("❌ [Register Verify] No session cookie found!");
      return NextResponse.json(
        { error: "Session not found" },
        { status: 400 }
      );
    }

    // Get the challenge associated with this session
    console.log("🟢 [Register Verify] About to call getChallenge...");
    const challengeData = db.getChallenge(sessionId);
    console.log("🟢 [Register Verify] Challenge data:", challengeData);
    console.log("🟢 [Register Verify] Challenge data found:", challengeData ? "YES" : "NO");
    
    if (!challengeData || !challengeData.username) {
      console.error("❌ [Register Verify] Challenge not found or expired for session:", sessionId);
      console.error("❌ [Register Verify] Expected to find: ", sessionId);
      return NextResponse.json(
        { error: "Challenge not found or expired" },
        { status: 400 }
      );
    }

    console.log("🟢 [Register Verify] Challenge found for user:", challengeData.username);

    const { challenge, username } = challengeData;

    // Find the user
    const user = db.findUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // Get the actual origin from the request
    const origin = getOrigin(request);
    console.log("🟢 [Register Verify] Using origin:", origin);

    const opts: VerifyRegistrationResponseOpts = {
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: RP_ID,
    };

    const verification = await verifyRegistrationResponse(opts);

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: "Registration verification failed" },
        { status: 400 }
      );
    }

    const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    // Save the authenticator
    const newAuthenticator: Authenticator = {
      credentialID,
      credentialPublicKey,
      counter,
      credentialDeviceType,
      credentialBackedUp,
      transports: credential.response.transports,
    };

    db.addCredentialToUser(user.id, newAuthenticator);

    // Clean up the challenge
    db.deleteChallenge(sessionId);

    // Create a response with a session cookie for the authenticated user
    const response = NextResponse.json({
      verified: true,
      username: user.username,
    });

    // Set an authentication cookie
    response.cookies.set("userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Error verifying registration:", error);
    return NextResponse.json(
      { error: "Failed to verify registration" },
      { status: 500 }
    );
  }
}

