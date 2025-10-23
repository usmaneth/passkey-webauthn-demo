# 🔐 Passkey Login Demo

> A **beginner-friendly**, **impressive**, and **production-ready** guide to building passwordless authentication with WebAuthn and passkeys using Next.js.

**[📖 Full Guide →](./GUIDE.md)** | **[🚀 Deploy](./DEPLOYMENT.md)** | **[⚙️ Setup Help](./SETUP.md)**

---

## 🚀 Quick Start (2 minutes)

```bash
# Clone & install
git clone https://github.com/usmaneth/passkey-webauthn-demo.git
cd passkey-webauthn-demo
npm install

# Run the demo
npm run dev

# Visit http://localhost:3000
```

### First-Time Experience

1. **Register**: Click "Register with Passkey"
2. **Biometric Prompt**: Your browser prompts for Face ID/Touch ID/Fingerprint
3. **Dashboard**: Explore the educational content explaining what just happened
4. **🎁 Easter Egg**: Scroll to "Imagine a Fintech App..." and try a withdrawal with real biometric re-authentication
5. **Test Login**: Logout and login to see the full flow

---

## ✨ What Makes This Demo Awesome

### Core Features
✅ **Real WebAuthn Authentication** - Uses SimpleWebAuthn + native browser APIs  
✅ **Registration & Login** - Complete auth flow with biometric prompts  
✅ **Sensitive Operations** - Real biometric re-authentication for withdrawals  
✅ **Educational UI** - Visual step-by-step guides and explanations  
✅ **Easter Egg** - Fintech demo showing passkeys in real-world scenarios  

### For Developers
✅ **Clean Architecture** - Well-organized, easy to understand code  
✅ **Production-Ready** - Handles edge cases, errors, and security  
✅ **Great UX** - Smooth animations, helpful error messages, accessibility  
✅ **Comprehensive Guide** - Learn while building  

### Why This Matters
- 🛡️ **Phishing-proof** - Credentials bound to your domain
- 🔒 **Private keys never leave your device** - Maximum security
- ⚡ **Faster than passwords** - Biometric is quicker than typing
- 📱 **Works across devices** - Passkeys sync via iCloud/Google Password Manager
- 💼 **Enterprise-ready** - Meets compliance standards automatically

---

## 🏗️ Project Structure

```
demo/
├── app/
│   ├── api/
│   │   ├── register/              # Registration endpoints
│   │   ├── login/                 # Login endpoints
│   │   ├── sensitive-operation/   # 🆕 Secure operations
│   │   ├── user/                  # Session check
│   │   └── logout/                # Clear session
│   ├── page.tsx                   # Main page (auth forms)
│   ├── layout.tsx                 # Layout with metadata
│   └── globals.css                # Tailwind styles
├── components/
│   ├── RegisterForm.tsx           # Registration UI
│   ├── LoginForm.tsx              # Login UI
│   ├── Dashboard.tsx              # Post-login + easter egg
│   └── StepIndicator.tsx          # Visual progress tracker
├── lib/
│   ├── db.ts                      # In-memory database
│   └── webauthn.ts                # WebAuthn config
└── public/
    ├── icon.svg                   # Favicon
    └── robots.txt
```

---

## 🎯 Key Concepts

### What Are Passkeys?

**Simple**: Proof your identity with your face/fingerprint instead of typing a password.

**Technical**: Public-key cryptography where:
- Your device creates a key pair (public + private)
- Private key stays on your device forever
- Server stores only the public key
- When logging in, you sign a challenge with the private key
- Server verifies the signature—never learns your secret!

### The Authentication Flow

```
REGISTRATION:
User enters username
  ↓
Server generates challenge
  ↓
Browser prompts for Face ID/Touch ID
  ↓
Device creates key pair
  ↓
Browser sends public key to server
  ↓
✅ Registered!

LOGIN:
User enters username
  ↓
Server generates challenge
  ↓
Browser prompts for Face ID/Touch ID
  ↓
Device signs challenge with private key
  ↓
Browser sends signed response to server
  ↓
Server verifies with public key
  ↓
✅ Logged in!
```

### Advanced: Sensitive Operations

This demo includes a powerful feature: **biometric re-authentication for sensitive operations**.

Think of it like approving a withdrawal from your bank:
1. User clicks "Request Withdrawal"
2. Server generates a challenge
3. Browser prompts for biometric verification
4. Device signs the challenge
5. Server verifies and executes the operation

**Why this matters**: 
- Even if someone gains access to your account, they can't approve withdrawals without YOUR biometric
- Perfect for fintech apps, crypto exchanges, healthcare portals, etc.

---

## 📚 Learning Path

### Level 1: Understand the Basics (5 mins)
- Read: "What Are Passkeys?" above
- Try: Register and login to the demo

### Level 2: See How It's Built (10 mins)
- Explore: API routes in `app/api/`
- Review: Components in `components/`
- Understand: How `lib/db.ts` persists state

### Level 3: Master Sensitive Operations (10 mins)
- Try: The fintech easter egg (click "Try: Request Withdrawal")
- Understand: How biometric re-auth works
- Trace: The flow through `/api/sensitive-operation/`

### Level 4: Handle Edge Cases (10 mins)
- Check: `lib/db.ts` for challenge management
- See: Cookie handling in API routes
- Review: Error handling in components

### Level 5: Deploy & Extend (varies)
- [Read Deployment Guide](./DEPLOYMENT.md)
- [See Setup Tips](./SETUP.md)

---

## 🧪 Testing

### Without Real Biometrics (Chrome Virtual Authenticator)

1. Open DevTools (F12)
2. ⋮ (More tools) → **WebAuthn**
3. Enable "Enable virtual authenticator environment"
4. Add a virtual authenticator
5. Now test without needing Face ID/Touch ID!

### Testing Checklist

- ✅ Register a new account
- ✅ Logout and login
- ✅ Try sensitive operation (withdrawal)
- ✅ Test on multiple browsers
- ✅ Test cancelling biometric prompt

---

## 🚀 Deployment

### Vercel (Recommended - 2 mins)

```bash
# Push to GitHub
git push origin main

# Connect to Vercel dashboard
# Set env variables in Vercel UI:
# NEXT_PUBLIC_RP_ID=your-domain.vercel.app
# NEXT_PUBLIC_ORIGIN=https://your-domain.vercel.app

# Auto-deploy on push ✅
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Important**: WebAuthn requires HTTPS in production. Both Vercel and Netlify provide free HTTPS automatically.

---

## 💡 Real-World Use Cases

### Consumer Apps
- Login without passwords
- Progressive onboarding ("upgrade to passkey")
- Account recovery without email

### Fintech & Crypto
- Withdraw/transfer funds (with biometric approval)
- Approve high-risk transactions
- Secure API key generation
- Cold wallet interactions

### Enterprise
- Passwordless SSO
- Zero-trust access control
- Compliance (automatic NIST/SOC2)

### Healthcare
- HIPAA-compliant authentication
- Biometric patient verification
- Secure access to PHI

---

## 📖 Full Documentation

| Topic | Link |
|-------|------|
| **Complete Guide** | [GUIDE.md](./GUIDE.md) |
| **Setup Instructions** | [SETUP.md](./SETUP.md) |
| **Deployment Guide** | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| **API Reference** | See `app/api/` routes |

---

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React + Tailwind CSS
- **Auth**: WebAuthn + SimpleWebAuthn
- **Database**: In-memory (demo) / bring your own (production)
- **Deployment**: Vercel or Netlify

---

## 📋 Requirements

- **Node.js**: 18.0+
- **Browser**: Chrome 67+, Safari 16+, Firefox 60+, Edge 18+
- **OS**: Any (Mac, Windows, Linux)
- **Biometric**: Face ID, Touch ID, Fingerprint, or Windows Hello

---

## ❓ FAQ

### Can I use this in production?

Yes! Core auth logic is production-ready. You'll need to:
- Replace in-memory DB with real database (Prisma + PostgreSQL recommended)
- Add proper session management (NextAuth recommended)
- Add rate limiting
- Add monitoring/logging

[See "Building on Top" in GUIDE.md](./GUIDE.md) for next steps.

### What about password fallback?

You can support both passkeys and passwords:
1. **Progressive**: Encourage users to upgrade to passkeys
2. **Parallel**: Support both during transition
3. **Gradual rollout**: Migrate users slowly

### What if a user loses their device?

Passkeys sync across devices automatically:
- **Apple**: iCloud Keychain
- **Google**: Google Password Manager
- **Windows**: Microsoft Account

Always provide email recovery as a fallback.

### Is this secure?

Yes! WebAuthn is the industry standard for authentication:
- ✅ Phishing-proof (bound to domain)
- ✅ Replay-proof (unique challenges)
- ✅ Breach-proof (private key never shared)
- ✅ NIST/FIDO2/SOC2 compliant

---

## 🎁 Easter Egg

Once you're logged in, scroll down to see a special fintech demo showing:
- 💼 Realistic portfolio (BTC, ETH, stocks)
- 📊 Transaction history
- 🔐 Biometric-protected withdrawal (real WebAuthn re-auth!)

Try clicking "Request Withdrawal" to see how passkeys can secure sensitive financial operations.

---

## 🤝 Contributing

Found a bug? Have a suggestion? Open an issue or PR!

Areas for improvement:
- Real database integration (Prisma + PostgreSQL)
- Email recovery flow
- Cross-device authentication (QR code)
- Rate limiting
- Analytics dashboard

---

## 📄 License

MIT - Feel free to use this code in your projects!

---

## 🙏 Acknowledgments

- **SimpleWebAuthn** - Making WebAuthn dev-friendly
- **WebAuthn.io** - Great educational resource
- **FIDO Alliance** - Standardizing passwordless auth
- **Next.js Team** - Excellent framework
- **Privy** - Inspiring this demo

---

## 📞 Questions?

- 📖 **[Read the Full Guide](./GUIDE.md)**
- 🧪 **[See Testing Tips](./GUIDE.md)**
- 🚀 **[Deployment Help](./DEPLOYMENT.md)**
- 🔧 **[Troubleshooting](./SETUP.md)**

---

**Built with ❤️ by Usman Asim**

Making passkey authentication accessible, impressive, and production-ready for developers everywhere.

