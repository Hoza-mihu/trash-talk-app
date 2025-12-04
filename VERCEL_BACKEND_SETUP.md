# 🔧 Fix Vercel Backend Connection

## Problem
Vercel frontend is not getting correct model data because:
1. ❌ `BACKEND_URL` environment variable is not set in Vercel
2. ❌ Frontend is falling back to mock/demo data
3. ❌ Not connecting to your Railway backend with the updated model

## Solution

### Step 1: Get Your Railway Backend URL
Your Railway backend URL should be:
```
https://trash-talk-app-production-b2cc.up.railway.app
```

Or check your Railway dashboard for the exact URL.

### Step 2: Set Environment Variable in Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your `trash-talk-app` project

2. **Open Settings**
   - Click on your project
   - Go to **Settings** tab
   - Click on **Environment Variables** in the sidebar

3. **Add Backend URL**
   - Click **Add New**
   - **Name**: `BACKEND_URL`
   - **Value**: `https://trash-talk-app-production-b2cc.up.railway.app`
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**

4. **Also Add Frontend Environment Variable** (if needed)
   - **Name**: `NEXT_PUBLIC_BACKEND_URL`
   - **Value**: `https://trash-talk-app-production-b2cc.up.railway.app`
   - **Environment**: Select all
   - Click **Save**

5. **Redeploy**
   - Go to **Deployments** tab
   - Click **⋮** (three dots) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger redeploy

### Step 3: Verify Connection

After redeploying, test the connection:
1. Upload an image in your Vercel app
2. Check browser console for any errors
3. Should now connect to Railway backend with your updated model

---

## Alternative: Quick Fix via Vercel CLI

If you have Vercel CLI installed:

```bash
cd frontend
vercel env add BACKEND_URL production
# Enter: https://trash-talk-app-production-b2cc.up.railway.app

vercel env add NEXT_PUBLIC_BACKEND_URL production
# Enter: https://trash-talk-app-production-b2cc.up.railway.app

vercel --prod
```

---

## Current Code Flow

1. **Frontend** (Vercel) → `/api/analyze` (Next.js API route)
2. **Next.js API route** → Uses `BACKEND_URL` → Calls Railway backend
3. **Railway backend** → Uses updated model → Returns predictions

If `BACKEND_URL` is missing, it defaults to `localhost:5000` which fails, then falls back to mock data.

---

## Environment Variables Needed in Vercel

✅ **Required**:
- `BACKEND_URL` = `https://trash-talk-app-production-b2cc.up.railway.app`
- `NEXT_PUBLIC_BACKEND_URL` = `https://trash-talk-app-production-b2cc.up.railway.app` (optional, for direct calls)

✅ **Already configured** (Firebase):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- etc.

---

## Troubleshooting

### Still getting mock data?
1. Check Vercel deployment logs
2. Verify `BACKEND_URL` is set correctly
3. Check Railway backend is running and accessible
4. Test Railway URL directly: `https://trash-talk-app-production-b2cc.up.railway.app/health`

### CORS errors?
- Railway backend should already have CORS configured
- Check `backend/app.py` CORS settings

### 404 errors?
- Verify Railway URL is correct
- Check Railway deployment is active

