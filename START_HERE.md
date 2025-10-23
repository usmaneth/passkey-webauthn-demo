# 🚀 Quick Start

## ⚠️ Important: Node.js Version

This project requires **Node.js 18.17.0 or higher**. 

Check your version:
```bash
node --version
```

If you see `v16.x.x`, you need to upgrade:

### Using nvm (recommended):
```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 18
nvm install 18

# Use Node 18
nvm use 18

# Verify
node --version  # Should show v18.x.x
```

### Without nvm:
Download from [nodejs.org](https://nodejs.org/) (get the LTS version)

---

## Run the App

```bash
# Make sure you're in the project directory
cd /Users/usmanasim/Documents/code/privy/demo

# Start the development server
npm run dev
```

You should see:
```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
```

Open **http://localhost:3000** in your browser!

---

## First Test

1. **Register a new account**
   - Click "Don't have an account? Register"
   - Enter a username (e.g., "usman")
   - Click "Register with Passkey"
   - Your device will prompt for Face ID/Touch ID/fingerprint
   - You're in! 🎉

2. **Test login**
   - Click "Logout"
   - Enter your username
   - Click "Login with Passkey"
   - Authenticate with your biometric
   - You're back in!

---

## Browser Requirements

Works on:
- ✅ Chrome 67+ (Mac, Windows, Android)
- ✅ Safari 16+ (Mac, iOS)
- ✅ Firefox 60+ (Mac, Windows)
- ✅ Edge 18+ (Windows)

**Note**: You need a device with biometric authentication (Face ID, Touch ID, Windows Hello, fingerprint sensor)

---

## Testing Without Biometrics (Chrome Only)

1. Open Chrome DevTools (F12 or Cmd+Opt+I)
2. Click ⋮ (three dots) → "More tools" → "WebAuthn"
3. Check "Enable virtual authenticator environment"
4. Click "Add authenticator"
5. Now you can test without real biometrics!

---

## Troubleshooting

### Error: "Unsupported engine" during npm install
**Cause**: Node.js version too old  
**Fix**: Upgrade to Node.js 18+ (see above)

### Server won't start
**Cause**: Port 3000 might be in use  
**Fix**: 
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### "Passkeys are not supported"
**Cause**: Browser doesn't support WebAuthn  
**Fix**: Use Chrome, Safari, Firefox, or Edge (latest versions)

### "User not found" when logging in
**Cause**: In-memory database was cleared (server restart)  
**Fix**: Register again with the same username

---

## Next Steps

1. **Read the guides**:
   - `GUIDE.md` - Beginner-friendly tutorial
   - `README.md` - Comprehensive documentation
   - `SETUP.md` - Setup instructions

2. **Explore the code**:
   - `app/page.tsx` - Main UI
   - `components/` - React components
   - `app/api/` - API routes
   - `lib/` - Utilities

3. **Deploy it**:
   - See `DEPLOYMENT.md` for instructions

---

## Questions?

Read the docs or open an issue!

**Enjoy building with passkeys! 🔐**

