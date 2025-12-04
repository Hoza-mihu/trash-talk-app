# 🎯 Step-by-Step: Set BACKEND_URL in Vercel

## You're Almost There!

You're currently on the **Environments** page. Follow these steps:

### Step 1: Click "Environment Variables"
- Look at the **left sidebar**
- Under the **"General"** section
- Click **"Environment Variables"** (it's right below "Environments")

### Step 2: Add the BACKEND_URL Variable

1. **Click the "Add New" button** (usually at the top right)

2. **Fill in the form:**
   - **Key**: `BACKEND_URL`
   - **Value**: `https://trash-talk-app-production-b2cc.up.railway.app`
   - **Environment**: Select all three:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development

3. **Click "Save"**

### Step 3: Redeploy

After saving:
1. Go to **"Deployments"** in the left sidebar
2. Find your latest deployment
3. Click the **⋮** (three dots) menu
4. Click **"Redeploy"**
5. Confirm the redeployment

---

## Quick Navigation

**From where you are now:**
1. Left sidebar → Click **"Environment Variables"** (under General)
2. Click **"Add New"**
3. Add `BACKEND_URL` with your Railway URL
4. Save and redeploy

---

## What This Does

Once set, your Vercel frontend will:
- ✅ Connect to your Railway backend
- ✅ Use your updated model (85.75% accuracy)
- ✅ Return real predictions instead of mock data

---

## Verify It's Working

After redeploy:
1. Visit your Vercel app: `https://trash-talk-app.vercel.app`
2. Upload an image
3. Check browser console (F12) → Network tab
4. Should see requests to Railway backend
5. Should get real model predictions!

