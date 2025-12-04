# PowerShell Script to Update Model in GitHub
# Run this script to add and push the updated model

Write-Host "Starting model update process..." -ForegroundColor Green

# Step 1: Force add the updated model file (bypasses .gitignore)
Write-Host ""
Write-Host "Adding updated model file..." -ForegroundColor Yellow
git add -f backend/model/model.h5

# Step 2: Add updated frontend files
Write-Host "Adding frontend fixes..." -ForegroundColor Yellow
git add frontend/lib/utils.ts
git add frontend/app/upload/page.tsx

# Step 3: Check what's staged
Write-Host ""
Write-Host "Staged files:" -ForegroundColor Cyan
git status --short

# Step 4: Commit
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Yellow
$commitMessage = @"
Update model: New training with 14,504 images (85.75% accuracy) + Fix localStorage quota issue

- Updated model.h5: Trained with 14,504 images, achieved 85.75% test accuracy
- Fixed localStorage quota exceeded error with image compression
- Model size: 12.72 MB
- Classes: glass, metal, organic-waste, paper-and-cardboard, plastic, textiles
"@
git commit -m $commitMessage

# Step 5: Push to GitHub
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "Done! Model updated on GitHub" -ForegroundColor Green
