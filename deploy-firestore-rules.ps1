# PowerShell script to deploy Firestore rules
# This script will help you deploy the Firestore security rules

Write-Host "🔥 Firebase Firestore Rules Deployment" -ForegroundColor Green
Write-Host ""

# Check if Firebase CLI is installed
try {
    $firebaseVersion = firebase --version
    Write-Host "✅ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Available Firebase Projects:" -ForegroundColor Cyan
firebase projects:list

Write-Host ""
Write-Host "Please select which project to use:" -ForegroundColor Yellow
Write-Host "1. trash-talk-5585d" -ForegroundColor White
Write-Host "2. trash-talk-e9572" -ForegroundColor White
Write-Host "3. eco-eco-20d0a" -ForegroundColor White
Write-Host "4. Enter project ID manually" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" { $projectId = "trash-talk-5585d" }
    "2" { $projectId = "trash-talk-e9572" }
    "3" { $projectId = "eco-eco-20d0a" }
    "4" { 
        $projectId = Read-Host "Enter project ID"
    }
    default {
        Write-Host "Invalid choice. Using trash-talk-5585d" -ForegroundColor Yellow
        $projectId = "trash-talk-5585d"
    }
}

Write-Host ""
Write-Host "Setting Firebase project to: $projectId" -ForegroundColor Cyan
firebase use $projectId

Write-Host ""
Write-Host "Deploying Firestore rules..." -ForegroundColor Cyan
firebase deploy --only firestore:rules

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Firestore rules deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test your app at /community" -ForegroundColor White
    Write-Host "2. Try creating a post" -ForegroundColor White
    Write-Host "3. Verify it appears in Firestore Console" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Please check the error above." -ForegroundColor Red
}

