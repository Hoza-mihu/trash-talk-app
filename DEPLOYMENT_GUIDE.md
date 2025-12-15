# Deployment Guide - Trash Talk App

## Current Status

**Branch:** `main`  
**Remote:** `origin` → `https://github.com/Hoza-mihu/trash-talk-app.git`

**Files ready to commit:**
- Modified: `firestore.indexes.json`
- Modified: `frontend/app/community/c/[communityId]/page.tsx`
- Modified: `frontend/app/community/post/[id]/page.tsx`
- Modified: `frontend/lib/community.ts`
- New: `frontend/components/CrosspostModal.tsx`
- New: `frontend/components/ShareDropdown.tsx`

---

## GitHub: Check and Push

### Step 1: Review changes
```bash
git status
```

### Step 2: Stage all changes
```bash
git add firestore.indexes.json
git add frontend/app/community/c/[communityId]/page.tsx
git add frontend/app/community/post/[id]/page.tsx
git add frontend/lib/community.ts
git add frontend/components/CrosspostModal.tsx
git add frontend/components/ShareDropdown.tsx
```

Or stage all changes at once:
```bash
git add .
```

### Step 3: Commit changes
```bash
git commit -m "Add crosspost functionality and update community features"
```

Or with a more descriptive message:
```bash
git commit -m "Add crosspost modal, share dropdown, and community improvements"
```

### Step 4: Push to GitHub
```bash
git push origin main
```

---

## Vercel (Frontend Deployment)

Your frontend is configured for **Next.js** and will auto-deploy on push to `main`.

### Auto-Deploy (Recommended)
If your repository is linked to Vercel, pushing to `main` will automatically trigger a deployment.

**After pushing to GitHub:**
1. Wait 1-2 minutes for auto-deploy to start
2. Check deployment status: Vercel Dashboard → Your Project → Deployments

### Manual Redeploy Options

#### Option 1: Vercel Dashboard (UI)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Deployments** tab
4. Click **"..."** (three dots) on the latest deployment
5. Click **"Redeploy"** → **"Redeploy"** (confirm)

#### Option 2: Vercel CLI
If you have Vercel CLI installed and are logged in:
```bash
cd frontend
vercel --prod
```

Or from the root directory:
```bash
vercel --prod --cwd frontend
```

**To install Vercel CLI (if needed):**
```bash
npm i -g vercel
vercel login
```

---

## Railway (Backend Deployment)

Your backend is configured for **Python/Flask** and will auto-deploy on push to `main` if Railway is set to build from Git.

### Auto-Deploy (Recommended)
If Railway service is connected to your GitHub repo, pushing to `main` will automatically trigger a deployment.

**After pushing to GitHub:**
1. Wait 2-5 minutes for build and deployment
2. Check deployment status: Railway Dashboard → Your Service → Deployments

### Manual Redeploy Options

#### Option 1: Railway Dashboard (UI)
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your backend service
3. Click **"Deploy"** tab
4. Click **"Deploy Latest"** or select a specific commit

#### Option 2: Railway CLI
If you have Railway CLI installed and are logged in:
```bash
cd backend
railway up
```

Or from the root directory:
```bash
railway up --cwd backend
```

**To install Railway CLI (if needed):**
```powershell
# On Windows PowerShell
iwr https://raw.githubusercontent.com/railwayapp/cli/master/install.ps1 -useb | iex

# Then login
railway login
```

---

## Quick Deploy (All-in-One)

### Complete Workflow

```bash
# 1. Review changes
git status

# 2. Stage all changes
git add .

# 3. Commit
git commit -m "Add crosspost functionality and update community features"

# 4. Push to trigger auto-deploys
git push origin main
```

After pushing:
- ✅ **Vercel** will auto-deploy your frontend (usually 1-2 min)
- ✅ **Railway** will auto-deploy your backend (usually 2-5 min)

Monitor deployments in their respective dashboards.

---

## Troubleshooting

### If Vercel doesn't auto-deploy:
1. Check project settings → Git → Connected branch is `main`
2. Verify webhook in GitHub: Settings → Webhooks → Vercel webhook is active
3. Manually redeploy via Dashboard or CLI

### If Railway doesn't auto-deploy:
1. Check service settings → Source → Connected repository and branch
2. Verify service is set to "Deploy on Push"
3. Manually trigger via Dashboard or CLI

### Environment Variables
If you need to update environment variables:
- **Vercel**: Dashboard → Project → Settings → Environment Variables
- **Railway**: Dashboard → Service → Variables

---

## Need Help?

If you want automated execution:
- ✅ Branch: `main` (confirmed)
- ✅ Remote: `origin` (confirmed)
- ❓ Vercel/Railway: Confirm if you're logged in via CLI, or prefer Dashboard method





