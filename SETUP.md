# Quick Setup Guide

## Prerequisites

- **Node.js 18.17.0 or higher** (check with `node --version`)
- A modern browser (Chrome 67+, Safari 16+, Firefox 60+, Edge 18+)
- A device with biometric authentication

## Installation

```bash
# Install dependencies
npm install

# Create environment file (for local development)
cat > .env.local << EOF
NEXT_PUBLIC_RP_ID=localhost
NEXT_PUBLIC_ORIGIN=http://localhost:3000
EOF

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Test

1. Click **"Don't have an account? Register"**
2. Enter a username (e.g., "testuser")
3. Click **"Register with Passkey"**
4. Your browser will prompt you to use Face ID/Touch ID
5. After registering, try logging out and back in!

## Troubleshooting

### "Passkeys are not supported"

**Cause**: Your browser or device doesn't support WebAuthn.

**Fix**: 
- Use Chrome, Safari, Firefox, or Edge (latest versions)
- Make sure you have biometric authentication enabled
- Try Chrome DevTools Virtual Authenticator (see below)

### "Authentication was cancelled"

**Cause**: You clicked "Cancel" or the prompt timed out.

**Fix**: Just try again!

### "User not found" when logging in

**Cause**: The username doesn't exist or the in-memory database was cleared (restart).

**Fix**: Register the username first, or use the same username you registered with.

### Testing Without Biometrics (Chrome DevTools)

1. Open Chrome DevTools (F12 or Cmd+Opt+I)
2. Click the three dots (⋮) → "More tools" → "WebAuthn"
3. Check "Enable virtual authenticator environment"
4. Click "Add authenticator"
5. Now you can test without Face ID/Touch ID!

## Node Version Issue

If you see warnings about Node version, upgrade to Node 18+:

```bash
# Using nvm (recommended)
nvm install 18
nvm use 18

# Or download from nodejs.org
```

## Deployment to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_RP_ID=your-domain.vercel.app
# NEXT_PUBLIC_ORIGIN=https://your-domain.vercel.app
```

## Project Structure

```
demo/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── register/      # Registration endpoints
│   │   ├── login/         # Login endpoints
│   │   ├── user/          # User info endpoint
│   │   └── logout/        # Logout endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── LoginForm.tsx      # Login form
│   ├── RegisterForm.tsx   # Registration form
│   └── Dashboard.tsx      # User dashboard
├── lib/                   # Utilities
│   ├── db.ts             # In-memory database
│   └── webauthn.ts       # WebAuthn configuration
├── README.md             # Comprehensive guide
├── GUIDE.md              # Beginner-friendly guide
└── package.json          # Dependencies
```

## Key Files to Read

1. **GUIDE.md** - Beginner-friendly tutorial (START HERE!)
2. **README.md** - Comprehensive documentation
3. **app/api/register/generate-options/route.ts** - Registration flow
4. **components/RegisterForm.tsx** - Client-side registration

## Next Steps

- Read **GUIDE.md** for a beginner-friendly walkthrough
- Read **README.md** for comprehensive documentation
- Experiment with the code!
- Try deploying to Vercel

## Questions?

Open an issue on GitHub or reach out!

