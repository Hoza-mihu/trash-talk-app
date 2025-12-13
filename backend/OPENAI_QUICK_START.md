# OpenAI Quick Start Guide

## ✅ What's Already Done

1. ✅ **Provider code is ready** - OpenAI integration is implemented
2. ✅ **Configuration updated** - `.env` file set to use OpenAI
3. ✅ **Priority fixed** - OpenAI will be used instead of custom model

## 🔑 What You Need to Do

### Step 1: Get Your OpenAI API Key

1. **Go to OpenAI Platform**
   - Visit: https://platform.openai.com
   - Sign up or log in

2. **Create API Key**
   - Go to: https://platform.openai.com/api-keys
   - Click **"Create new secret key"**
   - Name it (e.g., "Trash Talk App")
   - **Copy the key immediately!** (It starts with `sk-`)

3. **Add Billing** (Required)
   - Go to: https://platform.openai.com/account/billing
   - Add a payment method
   - Note: GPT-4o-mini is very affordable (~$0.01-0.03 per image)

### Step 2: Add API Key to .env File

Open `backend/.env` and add your key:

```env
ML_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-key-here
```

**Important:** Replace `sk-your-actual-key-here` with your real API key!

### Step 3: Verify Setup

Run the test script:
```bash
cd backend
venv\Scripts\activate
python test_openai_setup.py
```

You should see:
```
✅ ML_PROVIDER is set to: openai
✅ OPENAI_API_KEY is set: sk-proj-...
✅ OpenAI provider initialized successfully
```

### Step 4: Start Your Backend

```bash
cd backend
venv\Scripts\activate
python app.py
```

You should see:
```
✅ Using openai ML provider
```

## 🎯 That's It!

Your app will now use OpenAI Vision API for waste classification instead of the trained model.

## 💰 Pricing

- **GPT-4o-mini** (default): ~$0.01-0.03 per image
- **GPT-4o** (better accuracy): ~$0.05-0.10 per image

For 1000 images:
- GPT-4o-mini: ~$10-30
- GPT-4o: ~$50-100

## 🔧 Change Model (Optional)

To use GPT-4o instead of GPT-4o-mini, edit `backend/model/providers.py` line 191:

```python
"model": "gpt-4o",  # Changed from "gpt-4o-mini"
```

## 📚 More Information

See `OPENAI_SETUP.md` for detailed documentation and troubleshooting.

