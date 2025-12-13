# PowerShell script to help set up OpenAI API key

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "OpenAI API Key Setup Helper" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Open browser to API keys page
Write-Host "Opening OpenAI API Keys page in your browser..." -ForegroundColor Yellow
Start-Process "https://platform.openai.com/api-keys"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Instructions:" -ForegroundColor Green
Write-Host "1. In the browser, click 'Create new secret key'" -ForegroundColor White
Write-Host "2. Copy the key (it starts with 'sk-')" -ForegroundColor White
Write-Host "3. If you need billing, go to: https://platform.openai.com/account/billing" -ForegroundColor White
Write-Host ""

# Get API key from user
$apiKey = Read-Host "Paste your OpenAI API key here (or press Enter to skip)"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host ""
    Write-Host "No API key entered. You can:" -ForegroundColor Yellow
    Write-Host "1. Run this script again" -ForegroundColor White
    Write-Host "2. Manually edit backend\.env and add: OPENAI_API_KEY=sk-your-key" -ForegroundColor White
    Write-Host "3. Run: python setup_openai.py" -ForegroundColor White
    exit
}

# Validate key format
if (-not $apiKey.StartsWith('sk-')) {
    Write-Host ""
    Write-Host "Warning: API keys usually start with 'sk-'" -ForegroundColor Yellow
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne 'y') {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit
    }
}

# Update .env file
$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envPath) {
    $content = Get-Content $envPath -Raw
    
    # Update or add ML_PROVIDER
    if ($content -match "ML_PROVIDER=") {
        $content = $content -replace "ML_PROVIDER=.*", "ML_PROVIDER=openai"
    } else {
        $content += "`n# ML Provider Configuration`nML_PROVIDER=openai`n"
    }
    
    # Update or add OPENAI_API_KEY
    if ($content -match "OPENAI_API_KEY=") {
        $content = $content -replace "OPENAI_API_KEY=.*", "OPENAI_API_KEY=$apiKey"
    } else {
        $content += "`n# OpenAI Vision API`nOPENAI_API_KEY=$apiKey`n"
    }
    
    Set-Content -Path $envPath -Value $content -NoNewline
} else {
    # Create new .env file
    $content = @"
# ML Provider Configuration
ML_PROVIDER=openai

# OpenAI Vision API
OPENAI_API_KEY=$apiKey
"@
    Set-Content -Path $envPath -Value $content
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Configuration Updated!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "ML_PROVIDER: openai" -ForegroundColor White
Write-Host "OPENAI_API_KEY: $($apiKey.Substring(0, [Math]::Min(7, $apiKey.Length)))...$($apiKey.Substring([Math]::Max(0, $apiKey.Length - 4)))" -ForegroundColor White
Write-Host ""

# Test the setup
Write-Host "Testing setup..." -ForegroundColor Yellow
try {
    Push-Location $PSScriptRoot
    $testResult = & "venv\Scripts\python.exe" -c @"
import os
import sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv(override=True)
from model.providers import get_provider
provider = get_provider('openai')
print('SUCCESS')
"@
    
    if ($testResult -match "SUCCESS") {
        Write-Host "✅ OpenAI provider initialized successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not verify provider (this might be okay)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not test provider automatically" -ForegroundColor Yellow
    Write-Host "   You can test by running: python test_openai_setup.py" -ForegroundColor White
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Start your backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   venv\Scripts\activate" -ForegroundColor Gray
Write-Host "   python app.py" -ForegroundColor Gray
Write-Host ""
Write-Host "2. You should see: '✅ Using openai ML provider'" -ForegroundColor White
Write-Host ""
Write-Host "3. Test with an image upload" -ForegroundColor White
Write-Host ""

