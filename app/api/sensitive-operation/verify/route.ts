import { NextRequest, NextResponse } from "next/server";
import {
  verifyAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { RP_ID, getOrigin } from "@/lib/webauthn";
import type { AuthenticationResponseJSON } from "@simplewebauthn/browser";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const credential: AuthenticationResponseJSON = body;

    const userId = request.cookies.get("userId")?.value;
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const sessionId = request.cookies.get("operationSessionId")?.value;
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 400 }
      );
    }

    // Get the challenge associated with this session
    const challengeData = db.getChallenge(sessionId);
    if (!challengeData) {
      return NextResponse.json(
        { error: "Challenge not found or expired" },
        { status: 400 }
      );
    }

    const user = db.findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // Find the authenticator that matches the credential ID
    const authenticator = user.credentials.find((cred) =>
      db.areBuffersEqual(
        cred.credentialID,
        credential.rawId
          ? new Uint8Array(Buffer.from(credential.rawId, "base64"))
          : new Uint8Array()
      )
    );

    if (!authenticator) {
      return NextResponse.json(
        { error: "Authenticator not found" },
        { status: 400 }
      );
    }

    // Get the actual origin from the request
    const origin = getOrigin(request);
    console.log("🔓 [Sensitive Op] Using origin:", origin);

    const opts: VerifyAuthenticationResponseOpts = {
      response: credential,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: origin,
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

    console.log("🔓 [Sensitive Op] Sensitive operation verified successfully");

    // Create a response confirming the operation
    const response = NextResponse.json({
      verified: true,
      operationApproved: true,
    });

    // Clear the operation session
    response.cookies.delete("operationSessionId");

    return response;
  } catch (error) {
    console.error("Error verifying sensitive operation:", error);
    return NextResponse.json(
      { error: "Failed to verify operation" },
      { status: 500 }
    );
  }
}
