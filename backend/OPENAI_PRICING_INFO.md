# OpenAI Pricing Information

## Yes, You Will Be Charged

OpenAI charges for API usage on a **pay-per-use** basis. There is no free tier for production use, but pricing is very affordable.

## Pricing Details

### GPT-4o-mini (Current Model - Cost-Effective)
- **Input**: ~$0.15 per 1M tokens
- **Output**: ~$0.60 per 1M tokens
- **Per Image**: Approximately **$0.01-0.03** per image
- **1000 images**: ~$10-30

### GPT-4o (Better Accuracy - More Expensive)
- **Input**: ~$2.50 per 1M tokens  
- **Output**: ~$10.00 per 1M tokens
- **Per Image**: Approximately **$0.05-0.10** per image
- **1000 images**: ~$50-100

## Free Credits (New Accounts)

When you first sign up, OpenAI often provides:
- **$5-10 in free credits** for new accounts
- These credits expire after a certain period (usually 3 months)
- Check your account at: https://platform.openai.com/usage

## How to Monitor Costs

1. **Check Usage Dashboard**
   - Go to: https://platform.openai.com/usage
   - See real-time usage and costs

2. **Set Usage Limits**
   - Go to: https://platform.openai.com/account/billing/limits
   - Set hard limits to prevent unexpected charges
   - Recommended: Set a monthly limit (e.g., $50/month)

3. **Check Billing**
   - Go to: https://platform.openai.com/account/billing
   - View invoices and payment history

## Cost Control Tips

### 1. Set Usage Limits
```
Recommended limits:
- Soft limit: $20/month
- Hard limit: $50/month
```

### 2. Monitor Regularly
- Check usage weekly
- Set up email alerts for high usage

### 3. Optimize Usage
- Use GPT-4o-mini (current) instead of GPT-4o
- Cache results when possible
- Only process images when needed

### 4. Test Locally First
- Test with a few images before deploying
- Monitor costs during development

## Estimated Monthly Costs

Based on usage:
- **100 images/month**: ~$1-3
- **500 images/month**: ~$5-15
- **1,000 images/month**: ~$10-30
- **5,000 images/month**: ~$50-150

## Alternative: Use Hugging Face (Free)

If you want to avoid costs, you can switch to Hugging Face (free tier available):

1. Edit `backend/.env`:
   ```env
   ML_PROVIDER=huggingface
   ```

2. Remove or comment out:
   ```env
   # OPENAI_API_KEY=...
   ```

3. Restart backend

Hugging Face is free but may have slightly lower accuracy than OpenAI.

## Summary

✅ **Yes, you will be charged** - Pay per image processed
✅ **Very affordable** - ~$0.01-0.03 per image
✅ **Free credits available** - Check your account
✅ **Set limits** - Control your spending
✅ **Monitor usage** - Track costs easily

## Next Steps

1. Check your free credits: https://platform.openai.com/usage
2. Set usage limits: https://platform.openai.com/account/billing/limits
3. Monitor costs regularly
4. Consider Hugging Face if you want free option

