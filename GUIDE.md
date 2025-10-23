# 🔐 Building a Passkey Login with WebAuthn

> **For**: Developers new to passkeys  
> **Read time**: 20 minutes + code exploration  
> **Prerequisites**: Basic TypeScript/React knowledge  

---

# PART 1: Understanding Passkeys & This Demo

## What Are Passkeys?

**Passkeys** are a passwordless authentication system using biometrics (Face ID, Touch ID, Fingerprint). Instead of typing a password, you authenticate with your face or fingerprint.

Think of it this way:
- 🔓 **Old way**: You remember a secret (password). Anyone who learns it can pretend to be you.
- 🔐 **New way**: Your biometric is the secret. No one can steal it, and you can't forget it.

### The Technical Foundation

Passkeys use **public-key cryptography**:

1. **Registration**: Your device creates a keypair
   - **Private key** ✔️ stays on your device forever
   - **Public key** 📤 gets sent to the server

2. **Login**: Server sends a challenge, your device signs it with the private key
   - Server verifies the signature with the public key
   - Private key never leaves your device 🔒

3. **Result**: Without the private key, no one can log in as you—even if they hack the server!

This is standardized via the **WebAuthn API** (W3C standard, supported by all modern browsers).

### Why This Demo?

This demo shows:
- ✅ **Full registration & login flow** with real biometric prompts
- ✅ **Sensitive operations** with re-authentication (e.g., crypto withdrawals)
- ✅ **Beautiful UI** that explains every step visually
- ✅ **Production-ready code** ready to extend

You can run it locally, understand how it works, and then build on it.

---

## Running the Demo

### Setup

```bash
git clone <repo-url>
cd demo
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### First Experience

1. **Register**: Click "Register with Passkey", choose username
2. **Biometric**: Your browser prompts for Face ID/Touch ID/Fingerprint
3. **Dashboard**: Explore the educational content explaining what just happened
4. **Easter Egg**: Scroll to "🎁 Imagine a Fintech App..." section
5. **Sensitive Op**: Click "Try: Request Withdrawal" → real biometric re-auth
6. **Logout & Login**: Test the full flow

---

## What's Inside

### Project Structure

```
demo/
├── app/api/
│   ├── register/                    # Passkey registration
│   │   ├── generate-options/        # Get registration options
│   │   └── verify/                  # Verify & save credential
│   ├── login/                       # Passkey login
│   │   ├── generate-options/        # Get login challenge
│   │   └── verify/                  # Verify authentication
│   ├── sensitive-operation/         # 🆕 Re-auth for withdrawals
│   │   ├── authenticate/            # Get challenge for operation
│   │   └── verify/                  # Verify & execute operation
│   └── [user, logout]/
├── components/
│   ├── RegisterForm.tsx             # Registration UI + flow
│   ├── LoginForm.tsx                # Login UI + flow
│   ├── Dashboard.tsx                # Post-login + fintech demo
│   └── StepIndicator.tsx            # Visual progress tracker
├── lib/
│   ├── db.ts                        # In-memory database
│   └── webauthn.ts                  # WebAuthn config
└── public/icon.svg
```

### Key Technology Stack

- **Next.js 14** - Full-stack framework
- **SimpleWebAuthn** - Handles all the cryptography
- **TypeScript** - Type safety
- **Tailwind CSS** - Beautiful UI
- **In-memory DB** - For demo (replace with real DB in production)

---

## Core Concepts

### The 3-Step Authentication Dance

Every authentication (login or sensitive operation) follows this pattern:

```
┌─ STEP 1: Get Challenge ─────────┐
│  Client → /api/.../authenticate │ → Server generates challenge
│  Server sets session cookie       │
└───────────────────────────────────┘
           ↓
┌─ STEP 2: Biometric Prompt ──────┐
│  Browser shows biometric UI      │ → User approves with face/finger
│  Device signs challenge           │
└───────────────────────────────────┘
           ↓
┌─ STEP 3: Verify Response ───────┐
│  Client → /api/.../verify        │ → Server verifies signature
│  Send signed response             │ → Session established / Op executed
└───────────────────────────────────┘
```

This same flow works for:
- **Registration** (new passkey)
- **Login** (authenticate user)
- **Sensitive operations** (approve withdrawal)

---

# PART 2: Building It Yourself

## Step 1: Project Setup

```bash
npx create-next-app@latest demo --typescript --tailwind
cd demo
npm install @simplewebauthn/browser @simplewebauthn/server
```

### Initialize Git

```bash
git init
git add .
git commit -m "Initial Next.js project"
```

---

## Step 2: WebAuthn Configuration

Create `lib/webauthn.ts`:

```typescript
export const RP_ID = process.env.NEXT_PUBLIC_RP_ID || "localhost";
export const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000";
export const RP_NAME = "Passkey Demo";

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
```

**Why these values matter:**
- `RP_ID` (Relying Party ID) - Your domain, binds passkeys to your site
- `ORIGIN` - Your full URL, prevents phishing attacks
- Session ID - Uniquely tracks each authentication attempt

---

## Step 3: In-Memory Database

Create `lib/db.ts`:

```typescript
interface User {
  id: string;
  username: string;
  credentials: StoredCredential[];
}

interface StoredCredential {
  credentialID: Uint8Array;
  credentialPublicKey: Uint8Array;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
}

interface Challenge {
  challenge: string;
  username: string;
  timestamp: number;
}

// Persist across hot-reloads using global scope
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

  addUser: (username: string, credential: StoredCredential) => {
    const user = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      username,
      credentials: [credential],
    };
    global.dbInstance.users.push(user);
    return user;
  },

  saveChallenge: (sessionId: string, challenge: string, username?: string) => {
    global.dbInstance.challenges.set(sessionId, {
      challenge,
      username: username || '',
      timestamp: Date.now(),
    });
  },

  getChallenge: (sessionId: string) =>
    global.dbInstance.challenges.get(sessionId),

  deleteChallenge: (sessionId: string) =>
    global.dbInstance.challenges.delete(sessionId),

  updateCredentialCounter: (userId: string, credentialID: Uint8Array, newCounter: number) => {
    const user = global.dbInstance.users.find(u => u.id === userId);
    if (user) {
      const cred = user.credentials.find(c => db.areBuffersEqual(c.credentialID, credentialID));
      if (cred) cred.counter = newCounter;
    }
  },

  areBuffersEqual: (a: Uint8Array, b: Uint8Array) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  },
};
```

**Key insight**: We use global scope so the database persists during Next.js hot-reloads in development.

---

## Step 4: Registration - Generate Options

Create `app/api/register/generate-options/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { RP_ID, RP_NAME, ORIGIN, generateSessionId } from '@/lib/webauthn';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    // Check if username exists
    if (db.findUserByUsername(username)) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    // Generate WebAuthn registration options
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: username,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use device's biometric
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
    });

    // Store challenge for verification
    const sessionId = generateSessionId();
    db.saveChallenge(sessionId, options.challenge, username);

    // Return options + set session cookie
    const response = NextResponse.json(options);
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 5, // 5 minutes
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to generate registration options' },
      { status: 500 }
    );
  }
}
```

**What's happening:**
1. Get username from client
2. Generate cryptographic challenge
3. Store challenge + sessionId
4. Return challenge to client via cookie
5. Client will show biometric prompt with this challenge

---

## Step 5: Registration - Verify Response

Create `app/api/register/verify/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { RP_ID, ORIGIN } from '@/lib/webauthn';
import type { RegistrationResponseJSON } from '@simplewebauthn/server/script/deps';

export async function POST(request: NextRequest) {
  try {
    const credential: RegistrationResponseJSON = await request.json();
    const sessionId = request.cookies.get('sessionId')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 400 }
      );
    }

    const challengeData = db.getChallenge(sessionId);
    if (!challengeData) {
      return NextResponse.json(
        { error: 'Challenge not found or expired' },
        { status: 400 }
      );
    }

    // Verify the credential signature
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 400 }
      );
    }

    // Extract credential info
    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo!;

    // Save user + credential
    const user = db.addUser(challengeData.username, {
      credentialID,
      credentialPublicKey,
      counter,
      transports: credential.response.transports,
    });

    // Clean up
    db.deleteChallenge(sessionId);

    // Set session cookie to log user in
    const response = NextResponse.json({ success: true });
    response.cookies.set('userId', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
```

**What's happening:**
1. Get signed credential from client
2. Retrieve stored challenge
3. Use SimpleWebAuthn to verify signature
4. If valid, save user + credential
5. Set userId cookie to establish session

---

## Step 6: Client-Side Registration

Create `components/RegisterForm.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

interface RegisterFormProps {
  onSuccess: (username: string) => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // STEP 1: Get registration options from server
      const optionsResponse = await fetch('/api/register/generate-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
        credentials: 'include', // Important: send cookies!
      });

      if (!optionsResponse.ok) {
        const data = await optionsResponse.json();
        throw new Error(data.error || 'Failed to get options');
      }

      const options = await optionsResponse.json();

      // STEP 2: Show biometric prompt
      const credential = await startRegistration(options);

      // STEP 3: Send signed credential to server for verification
      const verifyResponse = await fetch('/api/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
        credentials: 'include',
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || 'Registration failed');
      }

      // Success!
      onSuccess(username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Choose a username"
          disabled={loading}
          pattern="[a-zA-Z0-9_\-]+"
          minLength={3}
          maxLength={20}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating passkey...' : 'Register with Passkey'}
      </button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </form>
  );
}
```

**The flow:**
1. User enters username → clicks "Register"
2. Fetch generates options, sets session cookie
3. Browser prompts: "Use Face ID?"
4. User approves → device signs challenge
5. Send signature to /verify endpoint
6. Server verifies → creates user account
7. Client now logged in!

---

## Step 7: Login (Similar Pattern)

Create `app/api/login/generate-options/route.ts`:

```typescript
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { RP_ID, generateSessionId } from '@/lib/webauthn';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    const user = db.findUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    // Generate login challenge
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: user.credentials.map(cred => ({
        id: cred.credentialID,
        type: 'public-key' as const,
        transports: cred.transports,
      })),
      userVerification: 'preferred',
    });

    // Store challenge
    const sessionId = generateSessionId();
    db.saveChallenge(sessionId, options.challenge, username);

    const response = NextResponse.json(options);
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 5,
    });

    return response;
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

Create `app/api/login/verify/route.ts` - similar to registration verify, but uses `verifyAuthenticationResponse` instead.

---

## Step 8: Sensitive Operations (The Cool Part!)

This is where you can re-authenticate for important actions like withdrawals.

Create `app/api/sensitive-operation/authenticate/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const user = db.findUserById(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 400 });

  // Same as login, but with userVerification: "required"
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: user.credentials.map(cred => ({
      id: cred.credentialID,
      type: 'public-key' as const,
      transports: cred.transports,
    })),
    userVerification: 'required', // Must verify identity for sensitive ops
  });

  const sessionId = generateSessionId();
  db.saveChallenge(sessionId, options.challenge);

  const response = NextResponse.json(options);
  response.cookies.set('operationSessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5,
  });

  return response;
}
```

Then verify in `app/api/sensitive-operation/verify/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  const credential = await request.json();
  const userId = request.cookies.get('userId')?.value;
  const sessionId = request.cookies.get('operationSessionId')?.value;

  const challengeData = db.getChallenge(sessionId);
  if (!challengeData) return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });

  const user = db.findUserById(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 400 });

  // Verify signature
  const verification = await verifyAuthenticationResponse({
    response: credential,
    expectedChallenge: challengeData.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    authenticator: {
      credentialID: user.credentials[0].credentialID,
      credentialPublicKey: user.credentials[0].credentialPublicKey,
      counter: user.credentials[0].counter,
    },
  });

  if (!verification.verified) {
    return NextResponse.json({ error: 'Failed' }, { status: 400 });
  }

  // ✅ Operation approved! Now execute it
  // - Transfer funds
  // - Approve withdrawal
  // - Delete account
  // - Anything requiring biometric approval

  db.deleteChallenge(sessionId);
  return NextResponse.json({ operationApproved: true });
}
```

**Why this is powerful:**
- User already logged in ✅
- For sensitive action, require biometric again 🔐
- No codes, no prompts, just one fingerprint
- Phishing-proof: attacker can't fake it

---

## Common Issues & Fixes

### Challenge Not Found or Expired

**Problem**: "Challenge not found or expired" after registration  
**Fix**: Add `credentials: 'include'` to fetch calls

```typescript
// ❌ Wrong
const response = await fetch('/api/register/verify', {
  method: 'POST',
  body: JSON.stringify(credential),
});

// ✅ Correct
const response = await fetch('/api/register/verify', {
  method: 'POST',
  body: JSON.stringify(credential),
  credentials: 'include', // Send cookies!
});
```

### RP_ID vs Origin Confusion

- **RP_ID**: Domain WITHOUT protocol → `localhost`, `example.com`
- **Origin**: Domain WITH protocol → `http://localhost:3000`, `https://example.com`

```typescript
// ✅ Correct
const RP_ID = "localhost";
const ORIGIN = "http://localhost:3000";

// ❌ Wrong
const RP_ID = "https://localhost"; // Don't include https://
const ORIGIN = "localhost:3000";   // Missing protocol
```

### Works on Localhost, Fails in Production

WebAuthn requires HTTPS in production (HTTP only works on localhost).

Set environment variables:
```
NEXT_PUBLIC_RP_ID=yourdomain.com
NEXT_PUBLIC_ORIGIN=https://yourdomain.com
```

---

## Testing Without Biometrics

Use Chrome's Virtual Authenticator:

1. Open DevTools (F12)
2. ⋮ → **WebAuthn**
3. Enable "Enable virtual authenticator environment"
4. Add authenticator
5. Now test without real fingerprint!

---

## Deploying

### To Vercel (Easiest)

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_RP_ID=your-domain.vercel.app
   NEXT_PUBLIC_ORIGIN=https://your-domain.vercel.app
   ```
4. Deploy!

### Important: HTTPS Required

WebAuthn requires HTTPS in production. Vercel provides free HTTPS automatically.

---

## Next Steps: Production Checklist

Before going live:
- [ ] Replace in-memory DB with PostgreSQL/MongoDB
- [ ] Add proper session management (NextAuth, Auth0)
- [ ] Add rate limiting on API routes
- [ ] Add logging and monitoring
- [ ] Handle lost device (recovery codes)
- [ ] Add email fallback
- [ ] Test across browsers and devices
- [ ] Add admin panel
- [ ] Create documentation for your team

---

## Resources

- **[WebAuthn Guide](https://webauthn.guide/)** - Deep dive
- **[SimpleWebAuthn Docs](https://simplewebauthn.dev/)** - Library reference
- **[Can I Use WebAuthn](https://caniuse.com/webauthn)** - Browser support
- **[FIDO Alliance](https://fidoalliance.org/)** - Standards
- **[Passkeys.dev](https://www.passkeys.dev/)** - Official resource

---

## Questions?

The code in this repo is heavily commented. Open an issue or reach out!

**Built by Usman Asim** ❤️

