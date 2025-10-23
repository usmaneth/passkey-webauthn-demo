# 🔐 Building a Passkey Login with WebAuthn: Complete Guide

> **For**: Developers new to passkeys and WebAuthn  
> **Time to read**: 15-20 minutes  
> **Prerequisites**: Basic TypeScript/React knowledge  
> **Project size**: Lightweight, impressive, production-ready demo

---

## Table of Contents

1. [What Are Passkeys?](#what-are-passkeys)
2. [Why Should You Care?](#why-should-you-care)
3. [Quick Start: Run the Demo](#quick-start-run-the-demo)
4. [Architecture Overview](#architecture-overview)
5. [Building the Demo from Scratch](#building-the-demo-from-scratch)
6. [Advanced: Securing Sensitive Operations](#advanced-securing-sensitive-operations)
7. [Common Gotchas & Fixes](#common-gotchas--fixes)
8. [Testing & Debugging](#testing--debugging)
9. [Deployment](#deployment)
10. [Building on Top](#building-on-top)

---

## What Are Passkeys?

### The Simple Explanation

**Passkeys** are a passwordless authentication system using your device's built-in biometrics (Face ID, Touch ID, Fingerprint, Windows Hello). Instead of typing a password, you prove who you are with your face or fingerprint.

**Think of it like this:**
- 🔓 **Old way (passwords)**: You remember and type a secret. Anyone who overhears it or finds it written down can pretend to be you.
- 🔐 **New way (passkeys)**: Your face/fingerprint is the secret. No one can steal it, and you can't forget it.

### The Technical Explanation

Passkeys use **public-key cryptography** (the same tech that secures your bank transactions):

1. **Registration**: Your device creates a unique key pair
   - **Private key** stays on your device forever ✔️
   - **Public key** is sent to the server 📤

2. **Login**: Server sends a challenge, your device signs it with the private key
   - Server verifies the signature with the public key
   - Private key never leaves your device! 🔒

3. **Security**: Without the private key, no one can log in as you—even if they hack the server!

This is standardized via the **WebAuthn API** (W3C standard, supported by all modern browsers).

---

## Why Should You Care?

### For Your Users
- ✅ **No passwords to remember** - Use Face ID/Touch ID instead
- ✅ **Faster login** - 1 biometric scan vs typing + "forgot password?"
- ✅ **More secure** - Immune to phishing, credential stuffing, breaches
- ✅ **Works everywhere** - Passkeys sync via iCloud Keychain, Google Password Manager, etc.

### For You (The Developer)
- ✅ **Less code** - No password hashing, strength validation, reset flows
- ✅ **Less liability** - No passwords to leak in a breach
- ✅ **Easier compliance** - Meets NIST, FIDO2, and SOC2 standards automatically
- ✅ **Future-proof** - Big tech (Apple, Google, Microsoft) is all-in on passkeys

### Real-World Use Cases
- **Consumer apps**: Authentication without passwords
- **Fintech**: Securing sensitive transactions (withdrawals, transfers)
- **Healthcare**: HIPAA-compliant access control
- **Enterprise**: Passwordless SSO
- **API keys**: Replacing static tokens with biometric-secured access

---

## Quick Start: Run the Demo

### Prerequisites

- **Node.js 18+** (we use Next.js 14 which requires v18)
- **Modern browser** (Chrome 67+, Safari 16+, Firefox 60+, Edge 18+)
- **Biometric-capable device** (Face ID, Touch ID, Windows Hello, or Chrome's Virtual Authenticator)

### Installation & Running

```bash
# Clone the repo
git clone <repo-url>
cd demo

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First-Time Experience

1. **Register**: Click "Register with Passkey", choose a username
2. **Biometric Prompt**: Your browser prompts for Face ID/Touch ID/Fingerprint
3. **Dashboard**: You're logged in! Explore the educational content
4. **Easter Egg**: Scroll down to "🎁 Imagine a Fintech App..." section
5. **Try Withdrawal**: Click "Try: Request Withdrawal" to see real biometric re-authentication for sensitive operations
6. **Logout & Login**: Test the full flow

---

## Architecture Overview

### Project Structure

```
demo/
├── app/
│   ├── api/
│   │   ├── register/
│   │   │   ├── generate-options/route.ts    # Step 1: Get registration options
│   │   │   └── verify/route.ts              # Step 3: Verify & save credential
│   │   ├── login/
│   │   │   ├── generate-options/route.ts    # Step 1: Get login options
│   │   │   └── verify/route.ts              # Step 3: Verify authentication
│   │   ├── sensitive-operation/             # 🆕 Secure sensitive operations
│   │   │   ├── authenticate/route.ts        # Step 1: Get challenge
│   │   │   └── verify/route.ts              # Step 2: Verify & execute operation
│   │   ├── user/route.ts                    # Check auth status
│   │   └── logout/route.ts                  # Clear session
│   ├── page.tsx                             # Main page (register/login)
│   ├── layout.tsx                           # App layout with metadata
│   └── globals.css                          # Tailwind CSS
├── components/
│   ├── RegisterForm.tsx                     # Registration UI + flow
│   ├── LoginForm.tsx                        # Login UI + flow
│   ├── Dashboard.tsx                        # Post-login dashboard + easter egg
│   ├── StepIndicator.tsx                    # Visual step tracker
│   └── ...
├── lib/
│   ├── db.ts                                # In-memory database
│   └── webauthn.ts                          # WebAuthn config constants
├── public/
│   ├── icon.svg                             # Favicon
│   └── robots.txt
└── package.json
```

### Key Files Explained

#### `lib/webauthn.ts` - Configuration
```typescript
export const RP_ID = process.env.NEXT_PUBLIC_RP_ID || "localhost";
export const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000";

// These values bind passkeys to YOUR domain
```

#### `lib/db.ts` - In-Memory Database
```typescript
// Stores users and their credentials
interface User {
  id: string;
  username: string;
  credentials: StoredCredential[];
}

// Persists across hot-reloads in development using global scope
declare global {
  var dbInstance: { users: User[]; challenges: Map<...> };
}
```

---

## Building the Demo from Scratch

### Step 1: Project Setup

```bash
npx create-next-app@latest passkey-demo --typescript --tailwind
cd passkey-demo
npm install @simplewebauthn/browser @simplewebauthn/server
```

### Step 2: Create WebAuthn Configuration

```typescript
// lib/webauthn.ts
export const RP_ID = process.env.NEXT_PUBLIC_RP_ID || "localhost";
export const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000";
export const RP_NAME = "Passkey Demo";

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
```

### Step 3: Set Up Database

```typescript
// lib/db.ts
interface User {
  id: string;
  username: string;
  credentials: StoredCredential[];
}

interface Challenge {
  challenge: string;
  username: string;
  timestamp: number;
}

// Use global scope to persist across hot-reloads
declare global {
  var dbInstance: {
    users: User[];
    challenges: Map<string, Challenge>;
  };
}

if (!global.dbInstance) {
  global.dbInstance = { users: [], challenges: new Map() };
}

export const db = {
  findUserByUsername: (username: string) => 
    global.dbInstance.users.find(u => u.username === username),
  
  findUserById: (id: string) => 
    global.dbInstance.users.find(u => u.id === id),
  
  saveChallenge: (sessionId: string, challenge: string) => {
    global.dbInstance.challenges.set(sessionId, { challenge, timestamp: Date.now() });
  },
  
  getChallenge: (sessionId: string) => 
    global.dbInstance.challenges.get(sessionId),
  
  deleteChallenge: (sessionId: string) => 
    global.dbInstance.challenges.delete(sessionId),
  
  // ... more methods
};
```

### Step 4: Registration API Route

```typescript
// app/api/register/generate-options/route.ts
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { RP_ID, RP_NAME, ORIGIN, generateSessionId } from "@/lib/webauthn";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { username } = await request.json();

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: username,
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",  // Use device's biometric
      userVerification: "preferred",        // Biometric is recommended
      residentKey: "preferred",             // Discoverable credentials
    },
  });

  // Store challenge for verification
  const sessionId = generateSessionId();
  db.saveChallenge(sessionId, options.challenge);

  const response = NextResponse.json(options);
  response.cookies.set("sessionId", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5, // 5 minutes
  });

  return response;
}
```

### Step 5: Verify Registration

```typescript
// app/api/register/verify/route.ts
import { verifyRegistrationResponse } from "@simplewebauthn/server";

export async function POST(request: NextRequest) {
  const credential = await request.json();
  const sessionId = request.cookies.get("sessionId")?.value;
  const challengeData = db.getChallenge(sessionId);

  if (!challengeData) {
    return NextResponse.json(
      { error: "Challenge not found or expired" },
      { status: 400 }
    );
  }

  const verification = await verifyRegistrationResponse({
    response: credential,
    expectedChallenge: challengeData.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (!verification.verified) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  // Extract and save the public key
  const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

  db.addUser(username, {
    credentialID,
    credentialPublicKey,
    counter,
    transports: credential.response.transports,
  });

  db.deleteChallenge(sessionId);

  return NextResponse.json({ success: true });
}
```

### Step 6: Client-Side Registration Component

```typescript
// components/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

export default function RegisterForm({ onSuccess }: { onSuccess: (username: string) => void }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Get registration options from server
      const optionsResponse = await fetch('/api/register/generate-options', {
        method: 'POST',
        body: JSON.stringify({ username }),
        credentials: 'include', // Important: send cookies!
      });

      if (!optionsResponse.ok) throw new Error('Failed to get options');

      const options = await optionsResponse.json();

      // 2. Show biometric prompt
      const credential = await startRegistration(options);

      // 3. Verify with server
      const verifyResponse = await fetch('/api/register/verify', {
        method: 'POST',
        body: JSON.stringify(credential),
        credentials: 'include',
      });

      if (!verifyResponse.ok) throw new Error('Registration failed');

      onSuccess(username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Choose a username"
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating passkey...' : 'Register with Passkey'}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
```

---

## Advanced: Securing Sensitive Operations

One of the most powerful features we've built is **real biometric re-authentication for sensitive operations**. This is perfect for fintech apps!

### Use Case: Withdrawing Cryptocurrency

In the dashboard, users can trigger a withdrawal. This requires **real biometric authentication** via WebAuthn—same as login!

### How It Works

```typescript
// 1. User clicks "Request Withdrawal"
// 2. Frontend calls /api/sensitive-operation/authenticate
// 3. Server generates a challenge (same as login)
// 4. Browser prompts: "Use biometric to approve withdrawal"
// 5. Device signs the challenge
// 6. Frontend sends signed response to /api/sensitive-operation/verify
// 7. Server verifies and approves the operation
```

### Implementation

```typescript
// app/api/sensitive-operation/authenticate/route.ts
export async function POST(request: NextRequest) {
  const userId = request.cookies.get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const user = db.findUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 400 });

  // Generate authentication challenge (same as login)
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: user.credentials.map(cred => ({
      id: cred.credentialID,
      type: "public-key",
      transports: cred.transports,
    })),
    userVerification: "required", // MUST verify identity
  });

  const sessionId = generateSessionId();
  db.saveChallenge(sessionId, options.challenge);

  const response = NextResponse.json(options);
  response.cookies.set("operationSessionId", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5,
  });

  return response;
}
```

```typescript
// app/api/sensitive-operation/verify/route.ts
export async function POST(request: NextRequest) {
  const credential = await request.json();
  const userId = request.cookies.get("userId")?.value;
  const sessionId = request.cookies.get("operationSessionId")?.value;

  const challengeData = db.getChallenge(sessionId);
  if (!challengeData) {
    return NextResponse.json(
      { error: "Challenge not found or expired" },
      { status: 400 }
    );
  }

  // Verify same as login
  const verification = await verifyAuthenticationResponse({
    response: credential,
    expectedChallenge: challengeData.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    authenticator: userCredential,
  });

  if (!verification.verified) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  db.deleteChallenge(sessionId);

  // ✅ Operation approved! Now you can execute it
  // - Transfer funds
  // - Approve withdrawal
  // - Delete account
  // - Change settings
  // - Anything sensitive!

  return NextResponse.json({ operationApproved: true });
}
```

### Frontend Usage

```typescript
// components/Dashboard.tsx
const handleWithdrawalApproval = async () => {
  try {
    // 1. Get authentication challenge for sensitive operation
    const optionsResponse = await fetch('/api/sensitive-operation/authenticate', {
      method: 'POST',
      credentials: 'include',
    });
    const options = await optionsResponse.json();

    // 2. Show biometric prompt
    const credential = await startAuthentication(options);

    // 3. Verify with server
    const verifyResponse = await fetch('/api/sensitive-operation/verify', {
      method: 'POST',
      body: JSON.stringify(credential),
      credentials: 'include',
    });

    const result = await verifyResponse.json();

    if (result.operationApproved) {
      // ✅ Withdrawal approved!
      showSuccess('Withdrawal successful!');
    }
  } catch (err) {
    handleError(err);
  }
};
```

### Why This is Powerful

✅ **Phishing-proof**: Attack site can't get your biometric  
✅ **No extra factor needed**: Biometric IS the second factor  
✅ **User-friendly**: One biometric per action, not codes or prompts  
✅ **Compliant**: Meets PCI-DSS, SOC2, and financial regulations  
✅ **Scalable**: Works the same across all operations  

---

## Common Gotchas & Fixes

### 1. Challenge Not Found or Expired

**Problem**: You see "Challenge not found or expired" even though you just registered.

**Causes**:
- Cookies aren't being sent (missing `credentials: 'include'` in fetch)
- In-memory database cleared by hot-reload (Next.js development issue)
- Challenge expired (5-minute timeout)

**Fix**:
```typescript
// ✅ Always include credentials in fetch
const response = await fetch('/api/register/verify', {
  method: 'POST',
  body: JSON.stringify(credential),
  credentials: 'include', // This is critical!
});

// Use global scope for database to persist across hot-reloads
declare global {
  var dbInstance: { challenges: Map<string, Challenge> };
}
if (!global.dbInstance) global.dbInstance = { challenges: new Map() };
```

### 2. RP_ID vs. Origin Confusion

**Problem**: WebAuthn fails with cryptic errors about RP ID.

**Understanding**:
- **RP ID**: Your domain WITHOUT protocol (`localhost`, `example.com`)
- **Origin**: Your domain WITH protocol (`http://localhost:3000`, `https://example.com`)

**Fix**:
```typescript
// ✅ CORRECT
const RP_ID = "localhost"; // NO https://
const ORIGIN = "http://localhost:3000"; // WITH protocol

// ❌ WRONG
const RP_ID = "https://localhost"; // ❌ Don't include https://
const ORIGIN = "localhost:3000"; // ❌ Missing protocol
```

### 3. Credentials Work on Localhost, Fail in Production

**Problem**: Everything works at `http://localhost:3000`, but fails when deployed.

**Cause**: WebAuthn requires HTTPS in production (HTTP only allowed on localhost).

**Fix**:
```typescript
// Use environment variables
export const RP_ID = process.env.NEXT_PUBLIC_RP_ID || "localhost";
export const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000";
```

In production, set:
```
NEXT_PUBLIC_RP_ID=yourdomain.com
NEXT_PUBLIC_ORIGIN=https://yourdomain.com
```

### 4. "NotAllowedError: The operation either timed out or was not allowed"

**Problem**: Biometric prompt shows but returns this error.

**Causes**:
- User cancelled the prompt
- Timeout (too strict settings)
- Authenticator attachment too restrictive

**Fix**:
```typescript
// ✅ Use "preferred" for broader compatibility
authenticatorSelection: {
  authenticatorAttachment: "platform",    // But still prefer platform auth
  userVerification: "preferred",          // Not "required"
  residentKey: "preferred",               // Not "required"
}
```

### 5. Username Regex Pattern Error

**Problem**: Input validation fails with "Invalid regular expression".

**Cause**: Hyphen in regex character class needs escaping.

**Fix**:
```typescript
// ❌ WRONG
pattern="[a-zA-Z0-9_-]+"

// ✅ CORRECT (escape or put hyphen at end)
pattern="[a-zA-Z0-9_\-]+"
// OR
pattern="[a-zA-Z0-9_-]+" // hyphen at end works too
```

### 6. Favicon 404 Errors

**Problem**: Browser requests `/favicon.ico` and gets 404.

**Fix**:
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: "Passkey Login Demo",
  icons: {
    icon: '/icon.svg', // Point to actual file
  },
};
```

Then create `public/icon.svg` with your favicon.

### 7. "Module not found: Can't resolve './StepIndicator'"

**Problem**: Components can't find `StepIndicator`.

**Fix**:
```bash
# Make sure the file exists
touch components/StepIndicator.tsx

# And is properly exported
'use client';
export default function StepIndicator(...) { ... }
```

---

## Testing & Debugging

### Testing Without Biometrics (Chrome Virtual Authenticator)

1. Open DevTools (F12)
2. ⋮ (More tools) → **WebAuthn**
3. Enable "Enable virtual authenticator environment"
4. Add a virtual authenticator
5. Now you can test without a real fingerprint!

### Testing Checklist

- ✅ Register a new account
- ✅ Logout
- ✅ Login with username
- ✅ Cancel biometric prompt (should show error)
- ✅ Try registering same username twice (should fail)
- ✅ Try logging in non-existent user (should fail)
- ✅ Try sensitive operation (withdrawal)
- ✅ Cancel sensitive operation (should show error)
- ✅ Complete sensitive operation (should succeed)

### Debugging Tips

```typescript
// Add logging to understand the flow
console.log('🔵 [Register] Generated options');
console.log('🟢 [Verify] Received credential');
console.log('🔓 [Sensitive] Challenge verified');

// Check what's in cookies
console.log('Cookies:', document.cookie);

// Verify public key format
console.log('Public key:', Buffer.from(publicKey).toString('base64'));
```

---

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables:
   ```
   NEXT_PUBLIC_RP_ID=your-domain.vercel.app
   NEXT_PUBLIC_ORIGIN=https://your-domain.vercel.app
   ```
4. Deploy!

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

Then set the same environment variables in Netlify UI.

### Important: HTTPS Required

WebAuthn requires HTTPS in production. Both Vercel and Netlify provide free HTTPS, so you're good!

### Testing Deployment

After deploying:
1. Visit your URL (must be HTTPS!)
2. Register a new account
3. Logout and login
4. Test sensitive operations

---

## Building on Top

Now that you understand the architecture, here's how to extend this demo:

### 1. Add Real Database

Replace `lib/db.ts` with Prisma:

```bash
npm install @prisma/client
npx prisma init
```

```prisma
// prisma/schema.prisma
model User {
  id        String     @id @default(cuid())
  username  String     @unique
  email     String?    @unique
  createdAt DateTime   @default(now())
  credentials Credential[]
}

model Credential {
  id                 String   @id @default(cuid())
  userId             String
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  credentialID       Bytes    @unique
  credentialPublicKey Bytes
  counter            Int
  transports         String[]
  createdAt          DateTime @default(now())
}
```

### 2. Add Session Management

```bash
npm install @auth/core next-auth
```

Create proper session middleware instead of cookie hacks.

### 3. Add Email Recovery

When a user loses their device:

```typescript
// Send recovery email
await sendEmail({
  to: user.email,
  subject: 'Passkey Recovery Link',
  link: `${ORIGIN}/recovery?token=${recoveryToken}`,
});

// Recovery page lets user register a new passkey after verifying email
```

### 4. Add Multiple Devices

Let users register passkeys on multiple devices:

```typescript
// User can have multiple credentials
const credentials = db.findCredentialsByUserId(userId);
// credentials = [
//   { device: 'iPhone', ...},
//   { device: 'MacBook', ...},
//   { device: 'Windows', ...}
// ]
```

### 5. Add Cross-Device Auth (QR Code)

Let users sign in using a phone even if they never registered on this device:

```typescript
// Show QR code on desktop → user scans with phone
// Phone biometric authenticates, sends response back to desktop
// Desktop completes login
```

### 6. Add Conditional UI

Show passkey button only on supported browsers:

```typescript
'use client';
import { useEffect, useState } from 'react';

export default function AuthButtons() {
  const [supportsPasskeys, setSupportsPasskeys] = useState(false);

  useEffect(() => {
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setSupportsPasskeys);
    }
  }, []);

  return (
    <>
      {supportsPasskeys && <PasskeyButton />}
      <PasswordButton /> {/* Fallback */}
    </>
  );
}
```

### 7. Production Checklist

Before going live:
- [ ] Replace in-memory DB with real database
- [ ] Add proper session management (NextAuth, Auth0, etc.)
- [ ] Add rate limiting (prevent brute force)
- [ ] Add logging and monitoring
- [ ] Handle credential revocation (lost device)
- [ ] Add account recovery (email backup)
- [ ] Test across all major browsers
- [ ] Test on iOS, Android, Mac, Windows
- [ ] Add analytics (track adoption)
- [ ] Document for your team
- [ ] Create admin panel (for support)

---

## Resources

- **[WebAuthn Guide](https://webauthn.guide/)** - Deep dive into WebAuthn
- **[SimpleWebAuthn Docs](https://simplewebauthn.dev/)** - Library documentation
- **[WebAuthn.io](https://webauthn.io/)** - Interactive demo
- **[Can I Use WebAuthn](https://caniuse.com/webauthn)** - Browser support
- **[FIDO Alliance](https://fidoalliance.org/)** - Standards organization
- **[Passkey Usernames](https://www.passkeys.dev/)** - Official passkeys info

---

## Frequently Asked Questions

### Can I use this in production?

Yes! The core auth logic is production-ready. You just need to:
- Replace in-memory DB with real database
- Add proper session management
- Add monitoring and logging
- Handle edge cases

### What happens if a user loses their device?

Passkeys sync across devices via:
- **iCloud Keychain** (Apple)
- **Google Password Manager** (Android/Chrome)
- **Windows Hello** (Windows)

Always provide email recovery as a fallback.

### Can I use this with passwords?

Yes! Common patterns:
1. **Progressive**: Let users upgrade to passkeys
2. **Parallel**: Support both passwords and passkeys
3. **Migration**: Prompt to switch on next login

### Do I need passwords anymore?

For a consumer app: No, passkeys alone are fine (with email recovery)  
For enterprise: Keep passwords as fallback for edge cases

### Is this just for login?

No! Use it for:
- Login
- Sensitive operations (withdrawals, transfers)
- Permission approval
- Device registration
- API key generation
- Anything requiring strong authentication

---

## Final Thoughts

**Passkeys are the future.** They're not just "better passwords"—they're a paradigm shift toward genuinely secure, user-friendly authentication.

The tech is here, browsers support it, and users love it. If you're building authentication in 2024-2025, passkeys should be your first choice.

---

**Built with ❤️ by Usman Asim**

Questions? Open an issue or reach out!

