# 🔧 Fix Vercel Not Getting Correct Model Data

## Problem
Your Vercel frontend is returning mock/demo data instead of connecting to your Railway backend with the updated model.

## Root Cause
The frontend's Next.js API route (`/api/analyze/route.ts`) needs the `BACKEND_URL` environment variable to know where your Railway backend is. Without it, it defaults to `localhost:5000`, which fails, then returns mock data.

## Solution: Set Environment Variable in Vercel

### Step 1: Get Your Railway Backend URL
From your Railway dashboard, your backend URL is:
```
https://trash-talk-app-production-b2cc.up.railway.app
```

### Step 2: Add Environment Variable to Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click on your `trash-talk-app` project

2. **Navigate to Settings**
   - Click **Settings** tab
   - Click **Environment Variables** in the left sidebar

3. **Add BACKEND_URL**
   - Click **Add New** button
   - **Key**: `BACKEND_URL`
   - **Value**: `https://trash-talk-app-production-b2cc.up.railway.app`
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**

4. **Redeploy Your Frontend**
   - Go to **Deployments** tab
   - Click **⋮** (three dots) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger auto-deploy

### Step 3: Verify Connection

After redeploy, test:
1. Open your Vercel app URL
2. Upload an image
3. Check browser console (F12) - should see requests to Railway backend
4. Should now get real predictions from your updated model!

---

## How It Works

```
User Upload → Vercel Frontend → /api/analyze (Next.js route)
                                     ↓
                           Uses BACKEND_URL env var
                                     ↓
                        Railway Backend (with new model)
                                     ↓
                           Returns real predictions
```

---

## Troubleshooting

### Still getting mock data?
1. **Check Vercel Environment Variables**
   - Settings → Environment Variables
   - Verify `BACKEND_URL` is set correctly
   - Make sure it's added to **Production** environment

2. **Check Railway Backend**
   - Visit: `https://trash-talk-app-production-b2cc.up.railway.app/health`
   - Should return: `{"status": "healthy", "model_loaded": true}`

3. **Check Vercel Logs**
   - Go to Deployments → Click on deployment → View Function Logs
   - Look for errors connecting to backend

4. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### CORS Errors?
- Railway backend should already allow Vercel domain
- Check `backend/app.py` CORS configuration

---

## Environment Variables Checklist

✅ **Required for Vercel**:
- `BACKEND_URL` = `https://trash-talk-app-production-b2cc.up.railway.app`

✅ **Already configured** (Firebase):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

---

## Quick Test

After setting the environment variable and redeploying:

1. Visit your Vercel app
2. Open browser DevTools (F12)
3. Go to Network tab
4. Upload an image
5. Look for request to `/api/analyze`
6. Check the response - should contain real predictions from Railway backend

If you see the mock data response (item: 'Plastic Bottle', confidence: 85.0), the environment variable isn't set correctly.

