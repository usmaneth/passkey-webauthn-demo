# Deployment Guide

## Deploy to Netlify

Netlify is a great option for Next.js apps.

### Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

### Environment Variables

In Netlify dashboard, add:
- `NEXT_PUBLIC_RP_ID`: Your domain (e.g., `my-passkey-demo.netlify.app`)
- `NEXT_PUBLIC_ORIGIN`: Full origin (e.g., `https://my-passkey-demo.netlify.app`)

---

## Deploy to Custom Server

If you want to deploy to your own server:

### Build the App

```bash
npm run build
```

### Run in Production

```bash
# Set environment variables
export NEXT_PUBLIC_RP_ID=yourdomain.com
export NEXT_PUBLIC_ORIGIN=https://yourdomain.com

# Start the server
npm start
```

### With PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "passkey-demo" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then get SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## Important: Update RP_ID and Origin

**Critical**: After deploying, you MUST update your environment variables to match your production domain.

### Development (localhost)
```
NEXT_PUBLIC_RP_ID=localhost
NEXT_PUBLIC_ORIGIN=http://localhost:3000
```

### Production (your domain)
```
NEXT_PUBLIC_RP_ID=yourdomain.com
NEXT_PUBLIC_ORIGIN=https://yourdomain.com
```

**Why?** Passkeys are bound to your domain. If you create a passkey on `localhost`, it won't work on `yourdomain.com` (and vice versa).

---

## Database Considerations

This demo uses an in-memory database, which means:
- ❌ Data is lost on server restart
- ❌ Won't work with serverless functions (like Vercel)
- ❌ Can't scale to multiple instances

### For Production, Use a Real Database

**Option 1: Vercel Postgres**
```bash
# Install
npm install @vercel/postgres

# Add to Vercel project
vercel env add POSTGRES_URL
```

**Option 2: Supabase (PostgreSQL)**
```bash
# Install
npm install @supabase/supabase-js

# Sign up at supabase.com and get your URL and key
```

**Option 3: MongoDB Atlas**
```bash
# Install
npm install mongodb

# Sign up at mongodb.com and get your connection string
```

### Update db.ts

Replace the in-memory storage with database queries:

```typescript
// Example with Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export const db = {
  async findUserByUsername(username: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    return data;
  },
  
  // ... implement other methods
};
```

---

## Testing the Deployment

After deploying:

1. **Test Registration**
   - Open your production URL
   - Register a new user
   - Check that the passkey is created

2. **Test Login**
   - Logout
   - Login with the same username
   - Verify you can authenticate

3. **Test Across Devices** (if using synced passkeys)
   - Register on iPhone
   - Login on iPad (should work if using iCloud Keychain)

4. **Check Browser Console**
   - Look for any errors
   - Verify API calls are working

---

## Troubleshooting Deployment

### "Passkeys not working in production"

**Cause**: Environment variables not set or incorrect.

**Fix**: 
- Check `NEXT_PUBLIC_RP_ID` matches your domain (without `https://`)
- Check `NEXT_PUBLIC_ORIGIN` includes `https://`
- Redeploy after changing env vars

### "User not found after restart"

**Cause**: In-memory database lost data.

**Fix**: Implement a real database (see above).

### "Mixed content" errors

**Cause**: Your site is HTTPS but making HTTP requests.

**Fix**: Ensure all API calls use relative URLs (e.g., `/api/register`) not absolute URLs.

### Vercel function timeouts

**Cause**: Vercel serverless functions time out after 10 seconds.

**Fix**: WebAuthn should be fast (<1s), but check for:
- Network issues
- Database query performance
- Challenge expiration logic

---

## Post-Deployment Checklist

- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test error handling (cancel prompt, wrong username, etc.)
- [ ] Test on mobile devices
- [ ] Test on different browsers
- [ ] Check environment variables are set correctly
- [ ] Monitor error logs (Vercel/Netlify dashboard)
- [ ] Set up analytics (optional)

---

## Monitoring and Logs

### Vercel
- View logs: `vercel logs <deployment-url>`
- Or check the Vercel dashboard

### Netlify
- Check "Functions" tab in Netlify dashboard
- View real-time logs

### Custom Server
- Use PM2 logs: `pm2 logs passkey-demo`
- Or check your server logs

---

## Scaling Considerations

This demo is production-ready for authentication logic, but you'll need:

1. **Real database** (PostgreSQL, MongoDB, etc.)
2. **Session management** (JWT, session cookies, etc.)
3. **Rate limiting** (prevent brute force attacks)
4. **Logging and monitoring** (track errors and usage)
5. **Error tracking** (Sentry, LogRocket, etc.)
6. **CDN** (Vercel/Netlify handle this automatically)
7. **Backup auth method** (email magic link, recovery codes)

---

## Cost Estimates

### Free Tier (Vercel/Netlify)
- ✅ Unlimited hobby projects
- ✅ HTTPS included
- ✅ Fast global CDN
- ❌ Limited to 100 GB bandwidth/month
- ❌ Limited to 100 GB-hours serverless function execution

For a passkey demo with moderate traffic, the free tier is plenty!

### Paid Tier ($20-50/month)
- More bandwidth and function execution time
- Team collaboration features
- Advanced analytics

---

## Security Checklist

Before going to production:

- [ ] Use HTTPS (required for WebAuthn)
- [ ] Set `secure: true` on cookies (production only)
- [ ] Implement rate limiting
- [ ] Add CORS headers (if needed)
- [ ] Use strong challenges (32+ bytes random)
- [ ] Expire challenges after 5 minutes
- [ ] Validate all user inputs
- [ ] Use parameterized database queries (prevent SQL injection)
- [ ] Add CSP headers
- [ ] Monitor for suspicious activity

---

## Questions?

- Check the [Vercel Next.js docs](https://vercel.com/docs/frameworks/nextjs)
- Check the [Netlify Next.js docs](https://docs.netlify.com/frameworks/next-js/)
- Open an issue on GitHub

Good luck with your deployment! 🚀

