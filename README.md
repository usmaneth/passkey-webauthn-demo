# 🔐 Passkey Login Demo

A **beginner-friendly**, **impressive**, and **production-ready** demo of passwordless authentication with WebAuthn and passkeys using Next.js.

[**📖 Full Guide** →](./GUIDE.md) | [**Setup** →](./SETUP.md) | [**Deployment** →](./DEPLOYMENT.md)

---

## 🚀 Quick Start

```bash
npm install && npm run dev
# Visit http://localhost:3000
```

**First time?** Register → Biometric prompt → Explore dashboard → Try the fintech withdrawal with real biometric re-auth! 🎁

---

## ✨ What's Inside

| Feature | Details |
|---------|---------|
| **WebAuthn Auth** | Real registration & login with biometric prompts |
| **Sensitive Operations** | Biometric re-authentication for withdrawals (fintech demo) |
| **Educational UI** | Visual step-by-step guides explaining the flow |
| **Production-Ready** | Clean architecture, error handling, accessibility |
| **Easy to Learn** | Well-commented code, comprehensive guide |

---

## 🎯 How It Works

**The Core Idea**
- Your device creates a key pair (public + private)
- Private key stays on your device forever
- Server stores only the public key
- Biometric (Face ID/Touch ID) unlocks your private key to sign challenges
- No passwords, no phishing, no breaches

**The Flow**
```
Register: Username → Challenge → Biometric → Public key to server
Login:    Username → Challenge → Biometric → Sign & verify
```

**Advanced: Sensitive Operations**
When withdrawing funds, the app asks for biometric re-authentication. Even if someone has your account, they can't approve transactions without YOUR face or fingerprint.

---

## 📁 Project Structure

```
app/api/
├── register/               # Generate challenge, verify registration
├── login/                  # Generate challenge, verify login
├── sensitive-operation/    # Biometric re-auth for sensitive actions
└── user/, logout/          # Session management

components/
├── RegisterForm.tsx        # Registration UI
├── LoginForm.tsx           # Login UI
├── Dashboard.tsx           # Post-login + fintech easter egg
└── StepIndicator.tsx       # Visual progress tracker

lib/
├── db.ts                   # In-memory database
└── webauthn.ts             # WebAuthn config
```

---

## 🧪 Testing

**With Real Biometrics**: Just use your Mac/Phone (Face ID, Touch ID, etc.)

**Without Biometrics** (Chrome DevTools):
1. Open DevTools (F12)
2. More tools → WebAuthn
3. Enable virtual authenticator
4. Now test locally without hardware! ✅

---

## 🚀 Deploy

**Vercel** (easiest):
```bash
git push origin main
# → Connect to Vercel, auto-deploys
```

**Netlify**:
```bash
netlify deploy --prod
```

Both provide free HTTPS (required for WebAuthn). Set env variables:
- `NEXT_PUBLIC_RP_ID=your-domain.com`
- `NEXT_PUBLIC_ORIGIN=https://your-domain.com`

---

## 🛡️ Why Passkeys Matter

| Aspect | Traditional Passwords | Passkeys |
|--------|----------------------|----------|
| **Phishing-proof** | ❌ No | ✅ Yes (bound to domain) |
| **Reusable** | ❌ Yes (bad!) | ✅ Unique per site |
| **Sync across devices** | ❌ No | ✅ Yes (iCloud, Google, Windows) |
| **Requires biometric** | ❌ No | ✅ Yes (more secure) |
| **Private key on device** | N/A | ✅ Yes (never leaves) |

---

## ❓ FAQ

**Can I use this in production?**  
Yes! Replace the in-memory DB with Postgres/MySQL. See GUIDE.md → "Building on Top".

**What about password fallback?**  
Use progressive rollout: offer passkeys, keep passwords as backup during transition.

**What if a user loses their device?**  
Passkeys sync (iCloud, Google Password Manager). Always provide email recovery.

**Is WebAuthn secure?**  
✅ Yes. Phishing-proof, replay-proof, breach-proof. NIST/FIDO2/SOC2 compliant.

---

## 🔧 Tech Stack

Next.js 14 (App Router) • TypeScript • React • Tailwind CSS • SimpleWebAuthn • In-memory DB

**Requirements**: Node.js 18+, modern browser (Chrome/Safari/Firefox/Edge)

---

## 📚 Learn More

| Topic | Time | Link |
|-------|------|------|
| **Basics** | 5 min | [GUIDE.md](./GUIDE.md) → Passkeys 101 |
| **Build it** | 15 min | [GUIDE.md](./GUIDE.md) → Building from Scratch |
| **Sensitive Ops** | 10 min | [GUIDE.md](./GUIDE.md) → Advanced |
| **Deploy** | 10 min | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| **Setup Issues** | - | [SETUP.md](./SETUP.md) |

---

## 🎁 Easter Egg

Once logged in, scroll down to the **"Imagine a Fintech App..."** section. See:
- 💼 Realistic portfolio (BTC, ETH, stocks)
- 📊 Transaction history  
- 🔐 **Try the withdrawal button** (real biometric re-auth!)

---

## 💡 Use Cases

| Domain | Use Case |
|--------|----------|
| **Consumer** | Passwordless login, account recovery |
| **Fintech/Crypto** | Fund withdrawals, high-risk tx approval |
| **Enterprise** | Passwordless SSO, zero-trust access |
| **Healthcare** | HIPAA auth, secure patient data access |

---

## 🤝 Contribute

Found a bug? Have ideas? Open an issue or PR!

**Ideas for improvement**:
- Real database (Prisma + PostgreSQL)
- Email recovery
- Cross-device auth (QR code)
- Rate limiting
- Analytics

---

## 📄 License

MIT - Use freely in your projects!

---

**Built with ❤️ by Usman Asim**

[📖 Full Guide](./GUIDE.md) | [Questions?](./GUIDE.md#common-gotchas--fixes)

