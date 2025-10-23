import { NextRequest, NextResponse } from "next/server";
import {
  verifyAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { RP_ID, ORIGIN } from "@/lib/webauthn";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server/script/deps";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const credential: AuthenticationResponseJSON = body;

    console.log("\n🟢 ====== VERIFY AUTHENTICATION ======");
    console.log("🟢 [Login Verify] All cookies:", request.cookies.getAll());

    // Get session ID from cookie
    const sessionId = request.cookies.get("sessionId")?.value;
    console.log("🟢 [Login Verify] Looking for sessionId:", sessionId);
    
    if (!sessionId) {
      console.error("❌ [Login Verify] No session cookie found!");
      return NextResponse.json(
        { error: "Session not found" },
        { status: 400 }
      );
    }

    // Get the challenge associated with this session
    console.log("🟢 [Login Verify] About to call getChallenge...");
    const challengeData = db.getChallenge(sessionId);
    console.log("🟢 [Login Verify] Challenge data:", challengeData);
    
    if (!challengeData || !challengeData.username) {
      console.error("❌ [Login Verify] Challenge not found or expired for session:", sessionId);
      return NextResponse.json(
        { error: "Challenge not found or expired" },
        { status: 400 }
      );
    }

    console.log("🟢 [Login Verify] Challenge found for user:", challengeData.username);

    const { challenge, username } = challengeData;

    // Find the user
    const user = db.findUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // Find the authenticator that matches the credential ID
    const authenticator = user.credentials.find((cred) =>
      db.areBuffersEqual(cred.credentialID, credential.rawId ? 
        new Uint8Array(Buffer.from(credential.rawId, 'base64')) : 
        new Uint8Array()
      )
    );

    if (!authenticator) {
      return NextResponse.json(
        { error: "Authenticator not found" },
        { status: 400 }
      );
    }

    const opts: VerifyAuthenticationResponseOpts = {
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: authenticator.credentialID,
        credentialPublicKey: authenticator.credentialPublicKey,
        counter: authenticator.counter,
        transports: authenticator.transports,
      },
    };

    const verification = await verifyAuthenticationResponse(opts);

    if (!verification.verified) {
      return NextResponse.json(
        { error: "Authentication verification failed" },
        { status: 400 }
      );
    }

    // Update the authenticator's counter
    db.updateCredentialCounter(
      user.id,
      authenticator.credentialID,
      verification.authenticationInfo.newCounter
    );

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
    console.error("Error verifying authentication:", error);
    return NextResponse.json(
      { error: "Failed to verify authentication" },
      { status: 500 }
    );
  }
}

