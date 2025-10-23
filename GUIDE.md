# 🔐 Passkey Demo - Complete Technical Guide

> Deep dive into how this demo works. Learn the concepts, understand the code, extend it.

---

## Table of Contents

1. [Passkeys 101](#passkeys-101)
2. [Architecture Overview](#architecture-overview)
3. [The Three Flows](#the-three-flows)
4. [Code Walkthrough](#code-walkthrough)
5. [Sensitive Operations](#sensitive-operations)
6. [Common Gotchas](#common-gotchas)
7. [Testing & Debugging](#testing--debugging)
8. [Building on Top](#building-on-top)

---

## Passkeys 101

### What Are Passkeys?

Passkeys are passwordless authentication using **public-key cryptography**:

**Registration:**
1. User enters username
2. Server generates random challenge
3. Browser prompts: "Use Face ID?"
4. Device creates keypair:
   - **Private key** → Stays on device forever 🔒
   - **Public key** → Sent to server 📤
5. Server stores public key (can't fake login with it)

**Login:**
1. User enters username
2. Server generates challenge
3. Browser prompts: "Use Face ID?"
4. Device signs challenge with private key
5. Server verifies signature with public key
6. ✅ Authenticated! (Private key never leaves device)

### Why This Matters

| Feature | Passwords | Passkeys |
|---------|-----------|----------|
| Phishing-proof | ❌ | ✅ (bound to domain) |
| Leaked password | 💀 Compromised | ✅ Never leaves device |
| Reusable secret | ❌ Bad practice | ✅ Unique per site |
| Biometric fallback | ❌ | ✅ Face ID/Touch ID |
| Crosses devices | ❌ | ✅ iCloud/Google Sync |

---

## Architecture Overview

### The Four Key Pieces

```
┌─────────────────────────────────────────────────────────┐
│ CLIENT (Browser)                                        │
│ ┌──────────────┐  ┌──────────────┐                      │
│ │ React Forms  │  │ WebAuthn API │ (native, no lib)    │
│ └──────────────┘  └──────────────┘                      │
│                                                         │
│ (Components: RegisterForm, LoginForm, Dashboard)        │
└─────────────────────────────────────────────────────────┘
          ↕ HTTP + Cookies
┌─────────────────────────────────────────────────────────┐
│ SERVER (Next.js API Routes)                             │
│ ┌──────────────────────────────────────────────────┐    │
│ │ SimpleWebAuthn (handles crypto)                 │    │
│ │ - generateRegistrationOptions()                 │    │
│ │ - verifyRegistrationResponse()                  │    │
│ │ - generateAuthenticationOptions()               │    │
│ │ - verifyAuthenticationResponse()                │    │
│ └──────────────────────────────────────────────────┘    │
│                                                         │
│ (Routes: /api/register/*, /api/login/*, etc.)          │
└─────────────────────────────────────────────────────────┘
          ↕ Read/Write
┌─────────────────────────────────────────────────────────┐
│ DATABASE (In-memory for demo)                           │
│ - Users & credentials                                   │
│ - Challenges (temp, 5 min expiry)                       │
│ - Sessions (cookies)                                    │
└─────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/webauthn.ts` | RP_ID, ORIGIN, session generation |
| `lib/db.ts` | User/credential storage, challenge management |
| `app/api/register/generate-options/route.ts` | Start registration |
| `app/api/register/verify/route.ts` | Finish registration |
| `app/api/login/generate-options/route.ts` | Start login |
| `app/api/login/verify/route.ts` | Finish login |
| `app/api/sensitive-operation/authenticate/route.ts` | Start re-auth for operations |
| `app/api/sensitive-operation/verify/route.ts` | Finish operation |
| `components/RegisterForm.tsx` | Registration UI |
| `components/LoginForm.tsx` | Login UI |
| `components/Dashboard.tsx` | Post-login + fintech demo |
| `components/StepIndicator.tsx` | Visual progress tracker |

---

## The Three Flows

### Flow 1: Registration (New User)

```
User Form
  ↓
[RegisterForm.tsx]
  │ username = "alice"
  ↓
POST /api/register/generate-options
  │ Server: generateRegistrationOptions()
  │ Stores: challenge + sessionId cookie
  ↓
[Browser WebAuthn API]
  │ Browser: "Alice, use your face?"
  │ Device: Creates keypair, signs challenge
  ↓
[RegisterForm.tsx]
  │ credential = signed response
  ↓
POST /api/register/verify
  │ Server: verifyRegistrationResponse()
  │ Validates: signature, origin, rpId
  │ Stores: User + public key
  │ Sets: userId cookie
  ↓
✅ REGISTERED & LOGGED IN
```

**Key Code Section**: `app/api/register/verify/route.ts`

```typescript
// Extract public key from credential
const { credentialID, credentialPublicKey, counter } = verification.registrationInfo!;

// Save user
const user = db.addUser(challengeData.username, {
  credentialID,      // Will match future logins
  credentialPublicKey,  // Used to verify signatures
  counter,           // Prevents replay attacks
  transports,        // Platform-specific (e.g., "platform" = biometric)
});
```

### Flow 2: Login (Existing User)

```
User Form
  ↓
[LoginForm.tsx]
  │ username = "alice"
  ↓
POST /api/login/generate-options
  │ Server: Finds Alice's public key
  │ Server: generateAuthenticationOptions()
  │ Stores: challenge + sessionId cookie
  ↓
[Browser WebAuthn API]
  │ Browser: "Alice, use your face?"
  │ Device: Looks for matching keypair, signs challenge
  ↓
[LoginForm.tsx]
  │ credential = signed response
  ↓
POST /api/login/verify
  │ Server: verifyAuthenticationResponse()
  │ Validates: signature matches public key
  │ Updates: counter (prevents cloning)
  │ Sets: userId cookie
  ↓
✅ LOGGED IN → Dashboard
```

**Key Concept**: We never see the private key. We only verify its signature.

### Flow 3: Sensitive Operation (Logged-In User)

```
[Dashboard.tsx]
  │ "Try: Request Withdrawal" button
  ↓
POST /api/sensitive-operation/authenticate
  │ Server: Requires userVerification: "required"
  │ (enforces biometric, not just unlock)
  │ Stores: operationSessionId cookie
  ↓
[Browser WebAuthn API]
  │ Browser: "Approve withdrawal? Use Face ID"
  │ Device: Signs challenge (AGAIN - re-auth)
  ↓
[Dashboard.tsx]
  │ credential = re-signed response
  ↓
POST /api/sensitive-operation/verify
  │ Server: Verifies signature (same as login)
  │ If valid: Process withdrawal
  │ Clear: operationSessionId
  ↓
✅ WITHDRAWAL APPROVED
```

**Why This Matters**: Even if someone steals the userId cookie, they can't approve transactions without the device's biometric.

---

## Code Walkthrough

### 1. Configuration (`lib/webauthn.ts`)

```typescript
export const RP_ID = process.env.NEXT_PUBLIC_RP_ID || "localhost";
export const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000";
export const RP_NAME = "Passkey Demo";

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
```

**Why:**
- `RP_ID` = Relying Party ID (your domain). Binds passkeys to your site → phishing-proof
- `ORIGIN` = Full URL. WebAuthn verifies this matches the challenge
- `generateSessionId()` = Unique per auth attempt (prevents replay attacks)

### 2. Database (`lib/db.ts`)

```typescript
declare global {
  var dbInstance: {
    users: User[];
    challenges: Map<string, Challenge>;
  };
}

if (!global.dbInstance) {
  global.dbInstance = { users: [], challenges: new Map() };
}
```

**Why global scope:**
- Next.js hot-reloading clears in-memory state
- Global scope persists across reloads
- Otherwise challenges expire immediately 😅

**Key Methods:**
```typescript
// Save challenge for 5 minutes
saveChallenge(sessionId, challenge, username)

// Retrieve during verification
getChallenge(sessionId)

// Clean up after use
deleteChallenge(sessionId)

// Store credentials
addUser(username, credential)

// Update counter (replay attack prevention)
updateCredentialCounter(userId, credentialID, newCounter)
```

### 3. Registration Start (`app/api/register/generate-options/route.ts`)

```typescript
const options = await generateRegistrationOptions({
  rpName: RP_NAME,
  rpID: RP_ID,
  userName: username,
  attestationType: 'none',
  authenticatorSelection: {
    authenticatorAttachment: 'platform', // Use device's biometric (not USB)
    userVerification: 'preferred',       // Try to verify, don't fail if not
    residentKey: 'preferred',            // Store on device if possible
  },
});

// Store challenge
const sessionId = generateSessionId();
db.saveChallenge(sessionId, options.challenge, username);

// Send via cookie (so browser remembers session)
response.cookies.set('sessionId', sessionId, {
  httpOnly: true,    // JS can't access (XSS protection)
  secure: true,      // HTTPS only
  sameSite: 'lax',   // CSRF protection
  path: '/',         // Sent to all paths
  maxAge: 60 * 5,    // 5 minutes
});
```

**Why each setting:**
- `authenticatorAttachment: 'platform'` → Use Mac's Touch ID, not security key
- `httpOnly` → Prevents JavaScript from stealing the cookie
- `sameSite: 'lax'` → Prevents cross-site request forgery

### 4. Registration Verify (`app/api/register/verify/route.ts`)

```typescript
const credential = await request.json();
const sessionId = request.cookies.get('sessionId')?.value;

// Step 1: Get stored challenge
const challengeData = db.getChallenge(sessionId);
if (!challengeData) throw new Error('Challenge expired');

// Step 2: Verify signature
const verification = await verifyRegistrationResponse({
  response: credential,
  expectedChallenge: challengeData.challenge,
  expectedOrigin: ORIGIN,      // Must match ORIGIN
  expectedRPID: RP_ID,         // Must match RP_ID
});

if (!verification.verified) throw new Error('Verification failed');

// Step 3: Extract and save credential
const user = db.addUser(challengeData.username, {
  credentialID: verification.registrationInfo!.credentialID,
  credentialPublicKey: verification.registrationInfo!.credentialPublicKey,
  counter: verification.registrationInfo!.counter,
});

// Step 4: Log user in
response.cookies.set('userId', user.id, { /* ... */ });

// Step 5: Clean up challenge
db.deleteChallenge(sessionId);
```

**The Critical Part**: SimpleWebAuthn verifies that:
- ✅ Signature is valid (proves device has private key)
- ✅ Origin matches (phishing protection)
- ✅ Challenge matches (replay protection)

If any fail → exception.

### 5. Login (Same Pattern, But Simpler)

Registration creates a keypair. Login just signs a challenge.

```typescript
// /api/login/generate-options
const user = db.findUserByUsername(username);

const options = await generateAuthenticationOptions({
  rpID: RP_ID,
  allowCredentials: user.credentials.map(cred => ({
    id: cred.credentialID,
    type: 'public-key' as const,
    transports: cred.transports,  // Tells browser: "use biometric"
  })),
  userVerification: 'preferred',
});
```

Then in `/api/login/verify`, we use `verifyAuthenticationResponse()` instead of `verifyRegistrationResponse()`, but the logic is identical.

### 6. Sensitive Operations (The Cool Part)

```typescript
// /api/sensitive-operation/authenticate
const options = await generateAuthenticationOptions({
  rpID: RP_ID,
  allowCredentials: user.credentials.map(/* ... */),
  userVerification: 'required',  // ← DIFFERENT: Enforce biometric
});
```

`userVerification: 'required'` tells the browser: "Don't just unlock the device, require biometric presence."

This means even if someone has the userId cookie (device is unlocked), they still need to authenticate to approve the operation.

---

## Sensitive Operations

### When to Use Re-auth

- 🏦 Withdrawals/transfers
- 🔑 API key generation
- 👤 Account deletion
- 📧 Email changes
- 💳 Payment method changes

### Implementation Example

```typescript
// Client (Dashboard.tsx)
const handleWithdrawalApproval = async () => {
  // Step 1: Get challenge
  const optionsResponse = await fetch('/api/sensitive-operation/authenticate', {
    method: 'POST',
    credentials: 'include',
  });
  const options = await optionsResponse.json();

  // Step 2: Biometric re-auth
  const credential = await startAuthentication(options);

  // Step 3: Verify
  const verifyResponse = await fetch('/api/sensitive-operation/verify', {
    method: 'POST',
    body: JSON.stringify(credential),
    credentials: 'include',
  });

  if (verifyResponse.ok) {
    // ✅ Operation approved - process withdrawal
    console.log('Withdrawal approved!');
  }
};
```

**What's Happening:**
1. User clicks "Request Withdrawal"
2. Browser: "Approve this operation? Use Face ID"
3. User approves
4. Server verifies biometric was actually used
5. Server processes withdrawal
6. No codes, no OTP, no push notifications - just biometric

---

## Common Gotchas

### 1. "Challenge Not Found or Expired"

**Problem**: Registration fails, says challenge expired

**Cause**: Browser doesn't send `sessionId` cookie

**Fix**: Add `credentials: 'include'` to fetch
```typescript
// ❌ Wrong
await fetch('/api/register/verify', {
  method: 'POST',
  body: JSON.stringify(credential),
});

// ✅ Correct
await fetch('/api/register/verify', {
  method: 'POST',
  body: JSON.stringify(credential),
  credentials: 'include',  // ← Send cookies!
});
```

### 2. "RP_ID must match origin"

**Problem**: Verification fails with RP_ID mismatch

**Cause**: Wrong RP_ID or ORIGIN format

**Fix**: Remember the format:
```typescript
// Local
NEXT_PUBLIC_RP_ID=localhost
NEXT_PUBLIC_ORIGIN=http://localhost:3000

// Production
NEXT_PUBLIC_RP_ID=example.com
NEXT_PUBLIC_ORIGIN=https://example.com
```

Note: RP_ID is JUST the domain, no `https://`, no `:3000`

### 3. "Works on localhost, fails on deploy"

**Problem**: WebAuthn works locally but fails after deploy

**Cause**: WebAuthn requires HTTPS in production (HTTP only works on localhost)

**Fix**: Set correct env vars, use HTTPS
```bash
# On Vercel
NEXT_PUBLIC_RP_ID=your-app.vercel.app
NEXT_PUBLIC_ORIGIN=https://your-app.vercel.app
```

### 4. Database Challenge Expires Immediately

**Problem**: In development, challenges always expire

**Cause**: Next.js hot-reloading clears in-memory state

**Fix**: This demo uses global scope to persist across reloads
```typescript
declare global {
  var dbInstance: { /* ... */ };  // ← Survives hot reload
}
```

---

## Testing & Debugging

### Using Chrome Virtual Authenticator

For testing without a real device:

1. Open DevTools (F12)
2. ⋮ → More tools → WebAuthn
3. Check "Enable virtual authenticator environment"
4. Click "Add authenticator"
5. Now test without Face ID/Touch ID

### Debugging Checklist

- [ ] RP_ID matches domain (no `https://`)
- [ ] ORIGIN is full URL (with `https://`)
- [ ] Cookies are being sent (`credentials: 'include'`)
- [ ] Challenge isn't expired (5 minute max)
- [ ] Browser tab stays open during biometric prompt
- [ ] Not using incognito mode (breaks some biometric APIs)
- [ ] Device supports WebAuthn ([check here](https://caniuse.com/webauthn))

### Console Logs to Watch

```typescript
// In the server logs:
🔵 [Register Generate] Set cookie with sessionId: session_xxx
🟢 [Register Verify] Challenge data found: YES
```

If you see `Challenge data found: NO`, the cookie isn't being sent.

---

## Building on Top

### Step 1: Replace In-Memory DB

Current: `lib/db.ts` stores everything in memory

Better for production:
```bash
npm install @prisma/client
npx prisma init
```

Then update `lib/db.ts` to use Prisma:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const db = {
  addUser: async (username: string, credential: StoredCredential) => {
    return prisma.user.create({
      data: {
        username,
        credentials: {
          create: {
            credentialID: Buffer.from(credential.credentialID).toString('base64'),
            credentialPublicKey: Buffer.from(credential.credentialPublicKey).toString('base64'),
            counter: credential.counter,
          },
        },
      },
    });
  },
  // ... rest of methods
};
```

### Step 2: Add Session Management

Current: Simple `userId` cookie

Better for production:
```bash
npm install next-auth @next-auth/prisma-adapter
```

### Step 3: Add Rate Limiting

Protect against brute force:
```bash
npm install @upstash/ratelimit
```

In `/api/register/verify`:
```typescript
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 regs per hour per IP
});

const { success } = await ratelimit.limit(request.ip);
if (!success) {
  return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
}
```

### Step 4: Add Password Fallback

During transition, support passwords too:

```bash
npm install bcryptjs
```

Add `password` column to User, check during login:
```typescript
// Try passkey first
if (passkey verified) {
  return login success;
}

// Fall back to password
if (password && bcrypt.compare(password, user.passwordHash)) {
  return login success;
}

return error;
```

### Step 5: Handle Lost Device

Let users add recovery codes during registration:

```typescript
// During registration
const recoveryCodes = generateRecoveryCodes(10);
await user.update({
  recoveryCodes: encrypt(recoveryCodes),
});
```

Then if device is lost:
```typescript
// Allow login with recovery code
if (recoveryCode && verifyRecoveryCode(user, recoveryCode)) {
  return login success;
  // Mark code as used
}
```

---

## Resources & Next Steps

- **[WebAuthn.io](https://webauthn.io)** - Official sandbox
- **[SimpleWebAuthn Docs](https://simplewebauthn.dev)** - Library reference
- **[Passkeys.dev](https://passkeys.dev)** - Industry guide
- **[FIDO2 Spec](https://fidoalliance.org/fido2)** - Technical standard

---

**Questions?** Open an issue on GitHub or check the code comments!

Built by Usman Asim ❤️

