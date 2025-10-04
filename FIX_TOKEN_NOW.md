# 🚀 Quick Fix: Token Expired Error

## Your Error:
```
❌ Error finding available slots: Token refresh failed: invalid_grant
```

---

## ⚡ QUICK FIX (5 minutes)

### Option A: Use the Web Interface (Easiest)

1. **Start your server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open your browser and visit:**
   ```
   http://localhost:3009/api/auth/google
   ```
   This will give you an authorization URL.

3. **Copy the `authUrl` from the response** and open it in your browser

4. **Sign in with your Google account** and grant permissions

5. **You'll be redirected to a success page showing your refresh token**

6. **Copy the refresh token** and update your `.env` file:
   ```env
   GOOGLE_OAUTH_REFRESH_TOKEN=paste_token_here
   ```

7. **Restart your server:**
   ```bash
   # Press Ctrl+C, then:
   npm run dev
   ```

### Option B: Use the Helper Script

```bash
node refresh-token.js
```

Follow the prompts to get your new token.

---

## 🛡️ Make Token PERMANENT

**IMPORTANT:** If your OAuth app is in "Testing" mode, tokens expire every 7 days!

To prevent this:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to: **"APIs & Services" → "OAuth consent screen"**
4. Click **"PUBLISH APP"** button
5. Change status from "Testing" to "In Production"

That's it! Your tokens will now last indefinitely.

---

## ✅ Test It Works

After getting your new token, test the calendar:

```bash
curl "http://localhost:3009/api/calendar/availability?date=2025-10-05"
```

Or visit: `http://localhost:3009/booking`

---

## 🎯 Your .env File Should Have:

```env
GOOGLE_OAUTH_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3009/auth/callback
GOOGLE_OAUTH_REFRESH_TOKEN=your_new_refresh_token_here
```

---

## 🆘 Need Help?

If you get errors, check:
- Your server is running on port 3009
- The redirect URI in Google Cloud Console matches: `http://localhost:3009/auth/callback`
- You have Google Calendar API enabled
- Your OAuth app has the correct scopes

---

## 📖 For More Details

See `REFRESH_TOKEN_FIX.md` for comprehensive documentation.

