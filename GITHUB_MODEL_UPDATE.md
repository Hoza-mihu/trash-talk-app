# 🚀 Update Model in GitHub Repository

## Your Repository
**GitHub URL**: https://github.com/Hoza-mihu/trash-talk-app  
**Branch**: `main`

## What We're Updating
1. ✅ **Updated Model**: `backend/model/model.h5` (12.72 MB, 85.75% accuracy)
2. ✅ **Frontend Fix**: localStorage quota issue fixed
3. ✅ **New Training Data**: 14,504 images processed

---

## Step-by-Step Commands

### **Step 1: Add the Updated Model File**
```powershell
git add -f backend/model/model.h5
```
*Note: `-f` flag forces the add even though `.gitignore` excludes `*.h5` files*

### **Step 2: Add Frontend Fixes**
```powershell
git add frontend/lib/utils.ts
git add frontend/app/upload/page.tsx
```

### **Step 3: Verify What's Staged**
```powershell
git status
```
You should see the model file and frontend files ready to commit.

### **Step 4: Commit the Changes**
```powershell
git commit -m "Update model: New training with 14,504 images (85.75% accuracy) + Fix localStorage quota issue

- Updated model.h5: Trained with 14,504 images
- Achieved 85.75% test accuracy
- Fixed localStorage quota exceeded error with image compression
- Model size: 12.72 MB"
```

### **Step 5: Push to GitHub**
```powershell
git push origin main
```

---

## All Commands in One Block (Copy & Paste)

```powershell
# Add updated model (force add to bypass .gitignore)
git add -f backend/model/model.h5

# Add frontend fixes
git add frontend/lib/utils.ts frontend/app/upload/page.tsx

# Commit
git commit -m "Update model: New training (85.75% accuracy) + localStorage fix"

# Push to GitHub
git push origin main
```

---

## Alternative: Use the PowerShell Script

I've created a script `push_model_update.ps1` that does all of this automatically:

```powershell
.\push_model_update.ps1
```

---

## After Pushing

1. ✅ **Check GitHub**: Visit https://github.com/Hoza-mihu/trash-talk-app to verify the model is updated
2. ✅ **Verify File Size**: The `backend/model/model.h5` file should be ~12.72 MB
3. ✅ **Test Deployment**: If you have auto-deployment, it should pick up the new model

---

## Troubleshooting

### If you get "remote already exists" error:
```powershell
git remote set-url origin https://github.com/Hoza-mihu/trash-talk-app.git
```

### If you get authentication errors:
- Make sure you're logged into GitHub
- Use a Personal Access Token if needed
- Or use SSH: `git remote set-url origin git@github.com:Hoza-mihu/trash-talk-app.git`

### If you need to pull first:
```powershell
# Stash your changes
git stash

# Pull existing code
git pull origin main

# Apply your changes back
git stash pop

# Then continue with the add/commit/push steps above
```

### If the model file is too large:
- The model is 12.72 MB, which is within GitHub's 100MB limit
- If you want to use Git LFS (recommended for future):
  ```powershell
  git lfs install
  git lfs track "*.h5"
  git add .gitattributes
  git add backend/model/model.h5
  git commit -m "Add model with Git LFS"
  git push origin main
  ```

---

## What Changed

### Model Updates:
- **New Training**: 14,504 images from your raw folder
- **Accuracy**: 85.75% test accuracy
- **Architecture**: MobileNetV2
- **Classes**: glass, metal, organic-waste, paper-and-cardboard, plastic, textiles

### Frontend Updates:
- **Image Compression**: Automatically compresses images before storing in localStorage
- **Error Handling**: Graceful fallback if compression fails
- **User Experience**: No more "quota exceeded" errors

---

## Quick Reference

**Repository**: https://github.com/Hoza-mihu/trash-talk-app  
**Model Path**: `backend/model/model.h5`  
**Model Size**: 12.72 MB  
**Test Accuracy**: 85.75%

