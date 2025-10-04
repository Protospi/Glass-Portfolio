# 🔧 Google OAuth Refresh Token Fix

## 🚨 The Problem

You're getting: `"Token refresh failed: invalid_grant"`

This means your Google OAuth refresh token has **expired or been revoked**.

---

## ✅ PERMANENT FIX (Recommended)

Follow these steps to make your token permanent:

### Step 1: Publish Your OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **"APIs & Services" → "OAuth consent screen"**
4. **IMPORTANT**: Change Publishing status from **"Testing"** to **"Production"**
   - In Testing mode, tokens expire after 7 days
   - In Production mode, tokens last indefinitely (unless revoked)

5. Fill out required information:
   - App name
   - User support email
   - Developer contact information
   
6. Click **"PUBLISH APP"**
   - You may see a warning about verification - you can ignore this for personal use
   - For personal apps, Google won't require verification

### Step 2: Get a New Refresh Token

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Visit the auth URL in your browser:**
   ```
   http://localhost:3009/api/auth/google
   ```

3. **Sign in with your Google account**
   - Use the account that owns the calendar
   - Grant all requested permissions

4. **Copy the refresh token** from the success page

5. **Update your .env file:**
   ```env
   GOOGLE_OAUTH_REFRESH_TOKEN=your_new_refresh_token_here
   ```

6. **Restart your server:**
   ```bash
   # Press Ctrl+C to stop the server, then:
   npm run dev
   ```

---

## 🔍 Verify It's Working

Test the calendar integration:

```bash
# Check availability
curl "http://localhost:3009/api/calendar/availability?date=2025-10-05"

# Or visit in your browser
http://localhost:3009/booking
```

---

## 🛡️ Why This Happens

### Common Causes:

1. **Testing Mode** (Most Common)
   - If OAuth app is in "Testing" mode, tokens expire after 7 days
   - **Solution**: Publish app to Production

2. **Token Inactivity**
   - Tokens expire after 6 months of no use
   - **Solution**: Use the token regularly or get a new one

3. **Password Changed**
   - Changing Google account password revokes tokens
   - **Solution**: Re-authorize after password changes

4. **Manual Revocation**
   - User revoked app access in Google account settings
   - **Solution**: Re-authorize the app

---

## 🎯 Quick Reference

### Check if your app is in Testing or Production:

1. [Google Cloud Console](https://console.cloud.google.com/)
2. "APIs & Services" → "OAuth consent screen"
3. Look at "Publishing status" at the top

**Testing** = Tokens expire in 7 days ❌  
**Production** = Tokens last indefinitely ✅

---

## 📋 Full Environment Variables Needed

Make sure your `.env` file has:

```env
# Google OAuth Credentials
GOOGLE_OAUTH_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret_here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3009/auth/callback
GOOGLE_OAUTH_REFRESH_TOKEN=your_refresh_token_here
```

---

## 🆘 Still Having Issues?

### Error: "Access blocked: Authorization Error"
- Your OAuth consent screen needs the correct scopes:
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/calendar.events`

### Error: "redirect_uri_mismatch"
- Add `http://localhost:3009/auth/callback` to authorized redirect URIs in Google Cloud Console

### Error: "invalid_client"
- Check your CLIENT_ID and CLIENT_SECRET in .env file
- Make sure they match Google Cloud Console credentials

---

## 🎉 Success Checklist

- ✅ OAuth app is in **Production** mode (not Testing)
- ✅ Got a new refresh token
- ✅ Updated `.env` file with new token
- ✅ Restarted server
- ✅ Tested calendar integration

Once completed, your token should work permanently! 🚀

