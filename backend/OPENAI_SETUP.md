# OpenAI Vision API Setup Guide

This guide will help you set up OpenAI Vision API for waste classification instead of using a trained model.

## Step 1: Get Your OpenAI API Key

1. **Sign up or Log in to OpenAI**
   - Go to https://platform.openai.com
   - Sign up for an account (or log in if you already have one)

2. **Create an API Key**
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Give it a name (e.g., "Trash Talk App")
   - **Copy the key immediately** - you won't be able to see it again!
   - The key will look like: `sk-proj-...` or `sk-...`

3. **Add Billing (Required)**
   - OpenAI requires a payment method for API usage
   - Go to https://platform.openai.com/account/billing
   - Add a payment method
   - Note: GPT-4o-mini is very affordable (~$0.01-0.03 per image)

## Step 2: Configure Your Project

### Update .env File

Edit `backend/.env` and change:

```env
# Change this line:
ML_PROVIDER=huggingface

# To:
ML_PROVIDER=openai

# Add your API key:
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Example .env Configuration

```env
# ML Provider Configuration
ML_PROVIDER=openai

# OpenAI Vision API
OPENAI_API_KEY=sk-proj-abc123xyz789...
```

## Step 3: Verify Setup

Run the test script:
```bash
cd backend
venv\Scripts\activate
python test_providers.py
```

You should see:
```
✅ ML_PROVIDER set to: openai
✅ openai provider initialized successfully
✅ Using provider: OpenAIProvider
```

## Step 4: Start Your Backend

```bash
cd backend
venv\Scripts\activate
python app.py
```

You should see:
```
✅ Using openai ML provider
```

## Model Options

The code uses `gpt-4o-mini` by default (cost-effective). You can change it in `backend/model/providers.py`:

- **gpt-4o-mini** (default) - Fast, affordable, good accuracy
- **gpt-4o** - Better accuracy, slightly more expensive
- **gpt-4-vision-preview** - Legacy model

To change the model, edit line 191 in `backend/model/providers.py`:
```python
"model": "gpt-4o-mini",  # Change to "gpt-4o" for better accuracy
```

## Pricing

- **GPT-4o-mini**: ~$0.01-0.03 per image
- **GPT-4o**: ~$0.05-0.10 per image

For 1000 images:
- GPT-4o-mini: ~$10-30
- GPT-4o: ~$50-100

## Troubleshooting

### "OpenAI API error: 401"
- Your API key is invalid or expired
- Check that you copied the full key (starts with `sk-`)
- Verify the key is active at https://platform.openai.com/api-keys

### "OpenAI API error: 429"
- You've hit rate limits
- Check your usage at https://platform.openai.com/usage
- Consider upgrading your plan

### "OpenAI API error: 402"
- You need to add billing information
- Go to https://platform.openai.com/account/billing

### "Insufficient quota"
- You've exceeded your spending limit
- Check billing at https://platform.openai.com/account/billing

## Advantages of OpenAI

✅ **High Accuracy** - GPT-4 Vision is very accurate for image classification
✅ **No Training Required** - Works out of the box
✅ **Handles Edge Cases** - Better at unusual or complex images
✅ **Easy Setup** - Just need an API key
✅ **Scalable** - Pay only for what you use

## Security Notes

⚠️ **Never commit your API key to Git!**
- The `.env` file is already in `.gitignore`
- Never share your API key publicly
- Rotate keys if exposed

## Next Steps

1. ✅ Get OpenAI API key
2. ✅ Update `.env` file
3. ✅ Restart backend
4. ✅ Test with an image upload

You're all set! 🎉

