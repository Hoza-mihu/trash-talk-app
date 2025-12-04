# Guide: Adding Updated Model to GitHub

## Option 1: Force Add Model File (Recommended for small repos)

Since your `.gitignore` excludes `*.h5` files, you'll need to force-add the model:

```bash
# Initialize git if not already done
git init

# Add your GitHub remote (replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Force add the model file (bypasses .gitignore)
git add -f backend/model/model.h5

# Also add the updated frontend files with image compression fix
git add frontend/lib/utils.ts frontend/app/upload/page.tsx

# Add the model update guide
git add MODEL_UPDATE_GUIDE.md

# Commit the changes
git commit -m "Update model: New training with 85.75% accuracy + Fix localStorage quota issue"

# Push to GitHub
git push origin main
# or if your branch is called 'master':
# git push origin master
```

## Option 2: Use Git LFS for Model Files (Recommended for large models)

Git LFS (Large File Storage) is better for binary files like models:

```bash
# Install Git LFS (if not already installed)
# Windows: Download from https://git-lfs.github.com/
# Or via package manager

# Initialize Git LFS
git lfs install

# Track .h5 files with LFS
git lfs track "*.h5"
git lfs track "backend/model/*.h5"

# Add the .gitattributes file that was created
git add .gitattributes

# Now add your model normally
git add backend/model/model.h5

# Commit and push
git commit -m "Update model: New training with 85.75% accuracy"
git push origin main
```

## Option 3: Update .gitignore to Allow Model File

If you want to track the model file normally:

1. Edit `backend/.gitignore` and remove or comment out the `*.h5` line
2. Or add an exception: `!backend/model/model.h5`

Then:
```bash
git add backend/model/model.h5
git commit -m "Update model: New training with 85.75% accuracy"
git push origin main
```

## Quick Commands (If repo already exists)

If you already have a GitHub repo set up:

```bash
# Check current status
git status

# See what branch you're on
git branch

# Add the model file (force if needed)
git add -f backend/model/model.h5

# Add other updated files
git add frontend/lib/utils.ts frontend/app/upload/page.tsx MODEL_UPDATE_GUIDE.md

# Commit
git commit -m "Update: New model (85.75% accuracy) + localStorage fix"

# Push
git push origin main
```

## Important Notes

1. **Model File Size**: Your model is 12.72 MB, which is within GitHub's 100MB file limit, so you can commit it directly.

2. **Git LFS**: If you plan to have multiple model versions or larger files, Git LFS is recommended. It requires a GitHub account with LFS bandwidth, but free tier includes 1GB storage and 1GB bandwidth/month.

3. **Check Existing Remote**: If you already have a remote configured:
   ```bash
   git remote -v
   ```

4. **If Model Already Exists on GitHub**: The push will update it. If you want to keep old versions, consider using Git LFS or storing models in releases.

