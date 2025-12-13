# Quick OpenAI Setup - 3 Easy Steps

## Option 1: Automated Script (Easiest)

### Windows PowerShell:
```powershell
cd backend
.\setup_openai_simple.ps1
```

This will:
- ✅ Open the OpenAI API keys page in your browser
- ✅ Guide you through getting your key
- ✅ Automatically update your `.env` file
- ✅ Test the setup

### Python Script:
```bash
cd backend
venv\Scripts\activate
python setup_openai.py
```

## Option 2: Manual Setup

### Step 1: Get API Key
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. Add billing: https://platform.openai.com/account/billing

### Step 2: Add to .env
Edit `backend/.env` and add:
```env
ML_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-key-here
```

### Step 3: Verify
```bash
cd backend
venv\Scripts\activate
python test_openai_setup.py
```

## Option 3: One-Line Setup (After Getting Key)

If you already have your API key, run:
```powershell
cd backend
$key = Read-Host "Paste your OpenAI API key"; (Get-Content .env) -replace 'ML_PROVIDER=.*', 'ML_PROVIDER=openai' -replace 'OPENAI_API_KEY=.*', "OPENAI_API_KEY=$key" | Set-Content .env
```

## That's It!

Start your backend:
```bash
python app.py
```

You should see: `✅ Using openai ML provider`

