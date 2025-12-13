# Alternative ML Providers Guide

Instead of training your own model with thousands of images, you can use pre-trained ML services. This guide shows you how to set up and use different providers.

## Available Providers

1. **Hugging Face Inference API** (Recommended for free tier)
   - Free tier available
   - No training required
   - Easy to set up

2. **OpenAI Vision API**
   - High accuracy
   - Pay-per-use pricing
   - Great for production

3. **Google Cloud Vision API**
   - Enterprise-grade
   - Good for general image classification
   - Pay-per-use pricing

4. **TensorFlow Hub**
   - Pre-trained models
   - Can be fine-tuned if needed
   - Free to use

## Quick Start

### Option 1: Hugging Face (Easiest - Free)

1. **Get a Hugging Face account** (optional for public models):
   - Sign up at https://huggingface.co
   - Get your API token from https://huggingface.co/settings/tokens

2. **Set environment variables**:
   ```bash
   # In your .env file or environment
   ML_PROVIDER=huggingface
   HUGGINGFACE_API_KEY=your_token_here  # Optional for public models
   HUGGINGFACE_MODEL_ID=microsoft/resnet-50  # Optional, uses default
   ```

3. **That's it!** The app will automatically use Hugging Face for predictions.

### Option 2: OpenAI Vision API

1. **Get an OpenAI API key**:
   - Sign up at https://platform.openai.com
   - Create an API key at https://platform.openai.com/api-keys

2. **Set environment variables**:
   ```bash
   ML_PROVIDER=openai
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Note**: Uses GPT-4o-mini by default (cost-effective). Change in `providers.py` if you want GPT-4o.

### Option 3: Google Cloud Vision API

1. **Set up Google Cloud**:
   - Create a project at https://console.cloud.google.com
   - Enable Vision API
   - Create an API key

2. **Set environment variables**:
   ```bash
   ML_PROVIDER=google
   GOOGLE_CLOUD_API_KEY=your-api-key-here
   ```

### Option 4: TensorFlow Hub

1. **Set environment variables**:
   ```bash
   ML_PROVIDER=tensorflow_hub
   TFHUB_MODEL_URL=https://tfhub.dev/google/tf2-preview/mobilenet_v2/classification/4
   ```

2. **Note**: This downloads and runs models locally. May need fine-tuning for waste classification.

## Configuration Priority

The system uses this priority order:

1. **Custom trained model** (if `model.h5` exists and TensorFlow is available)
2. **ML Provider** (if `ML_PROVIDER` is set)
3. **Demo mode** (random predictions for testing)

## Environment Variables Reference

Add these to your `.env` file or set them in your deployment platform:

```bash
# Select ML provider (optional - defaults to custom model if available)
ML_PROVIDER=huggingface  # Options: huggingface, openai, google, tensorflow_hub

# Hugging Face (optional - works without API key for public models)
HUGGINGFACE_API_KEY=your_token_here
HUGGINGFACE_MODEL_ID=microsoft/resnet-50

# OpenAI (required if using OpenAI provider)
OPENAI_API_KEY=sk-your-key-here

# Google Cloud (required if using Google provider)
GOOGLE_CLOUD_API_KEY=your-api-key-here

# TensorFlow Hub (optional - uses default if not set)
TFHUB_MODEL_URL=https://tfhub.dev/google/tf2-preview/mobilenet_v2/classification/4
```

## Cost Comparison

| Provider | Free Tier | Paid Pricing | Best For |
|----------|-----------|--------------|----------|
| Hugging Face | ✅ Yes (public models) | Free for most use cases | Development, MVP |
| OpenAI | ❌ No | ~$0.01-0.03 per image | Production, high accuracy |
| Google Cloud | ✅ $300 credit | ~$0.0015 per image | Enterprise, scale |
| TensorFlow Hub | ✅ Free | Free | Local deployment |

## Testing Your Setup

1. **Start your backend**:
   ```bash
   cd backend
   python app.py
   ```

2. **Check the logs** - you should see:
   ```
   ✅ Using huggingface ML provider
   ```
   or
   ```
   ✅ Model loaded successfully from model/model.h5
   ```

3. **Test an API call**:
   ```bash
   curl -X POST http://localhost:5000/api/analyze \
     -F "image=@path/to/test-image.jpg"
   ```

## Troubleshooting

### "Could not initialize ML provider"
- Check that your API keys are set correctly
- Verify the provider name is correct (lowercase)
- Check your internet connection (providers need API access)

### "OpenAI API error: 401"
- Your API key is invalid or expired
- Check your OpenAI account billing status

### "Google Cloud Vision API error: 403"
- Vision API might not be enabled in your project
- Check API key restrictions
- Verify billing is enabled

### "Hugging Face API error"
- For public models, API key is optional
- If using private models, ensure your token has access
- Check rate limits (free tier has limits)

## Switching Between Providers

You can switch providers by changing the `ML_PROVIDER` environment variable:

```bash
# Use Hugging Face
export ML_PROVIDER=huggingface

# Switch to OpenAI
export ML_PROVIDER=openai

# Use custom model (if available)
unset ML_PROVIDER
```

## Recommendations

- **For Development/MVP**: Use Hugging Face (free, easy setup)
- **For Production**: Use OpenAI Vision API (best accuracy) or Google Cloud (better pricing at scale)
- **For Offline/Privacy**: Use TensorFlow Hub with a fine-tuned model
- **For Best Accuracy**: Train your own model OR use OpenAI Vision API

## Next Steps

1. Choose a provider based on your needs
2. Set up the API keys
3. Update your `.env` file
4. Restart your backend server
5. Test with sample images

No more training thousands of images! 🎉

