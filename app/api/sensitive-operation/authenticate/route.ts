import { NextRequest, NextResponse } from "next/server";
import {
  generateAuthenticationOptions,
  GenerateAuthenticationOptionsOpts,
} from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { RP_ID, generateSessionId } from "@/lib/webauthn";

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = db.findUserById(userId);
    if (!user || user.credentials.length === 0) {
      return NextResponse.json(
        { error: "No credentials found" },
        { status: 400 }
      );
    }

    const opts: GenerateAuthenticationOptionsOpts = {
      rpID: RP_ID,
      allowCredentials: user.credentials.map((cred) => ({
        id: cred.credentialID,
        type: "public-key",
        transports: cred.transports,
      })),
      userVerification: "required",
    };

    const options = await generateAuthenticationOptions(opts);

    // Generate a session ID and store the challenge
    const sessionId = generateSessionId();
    db.saveChallenge(sessionId, options.challenge);

    console.log("🔓 [Sensitive Op] Generated authentication challenge for sensitive operation");

    // Return options to the client
    const response = NextResponse.json(options);
    // Store session ID in a cookie
    response.cookies.set("operationSessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 5, // 5 minutes
    });

    return response;
  } catch (error) {
    console.error("Error generating authentication options:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication options" },
      { status: 500 }
    );
  }
}
