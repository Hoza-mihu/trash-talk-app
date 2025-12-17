# Translation Feature Implementation Guide

This guide explains how to implement a Reddit-like post translation feature in your Next.js + Firebase project.

## Overview

The translation feature allows users to:
- View posts in different languages
- See translated content directly on the post (not in a popup)
- Switch back to the original language
- Cache translations for performance

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Translation Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User clicks "View in other languages"                       │
│              ↓                                                │
│  Language selection modal appears                            │
│              ↓                                                │
│  User selects a language (e.g., Hindi)                       │
│              ↓                                                │
│  translatePostContent() is called                            │
│              ↓                                                │
│  ┌─────────────────────────────────────┐                     │
│  │ 1. Check Firestore cache            │                     │
│  │    ↓ (if not cached)                │                     │
│  │ 2. Try Firebase Cloud Function      │                     │
│  │    ↓ (if not deployed)              │                     │
│  │ 3. Try MyMemory API                 │                     │
│  │    ↓ (if fails)                     │                     │
│  │ 4. Try Google Translate API         │                     │
│  │    ↓                                │                     │
│  │ 5. Cache result in Firestore        │                     │
│  └─────────────────────────────────────┘                     │
│              ↓                                                │
│  Post title & content update on screen                       │
│  Translation banner appears with "Show original" button      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Files Modified

| File | Purpose |
|------|---------|
| `frontend/lib/community.ts` | Translation API functions |
| `frontend/app/community/post/[id]/page.tsx` | Post detail page UI |
| `firestore.rules` | Security rules for translations collection |

---

## Step 1: Add Translation Functions

Add these functions to your `lib/community.ts`:

### 1.1 Helper function for translation API

```typescript
// Helper function to translate text using free APIs
async function translateText(text: string, targetLang: string, sourceLang: string = 'auto'): Promise<string> {
  if (!text || text.trim() === '') return text;

  const maxChunkSize = 450; // MyMemory limit
  
  try {
    if (text.length <= maxChunkSize) {
      // Try MyMemory API first
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
      );
      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translated = data.responseData.translatedText;
        if (!translated.includes('MYMEMORY WARNING') && 
            !translated.includes('QUERY LENGTH LIMIT') &&
            translated !== text) {
          return translated;
        }
      }
      
      // Fallback to Google Translate
      return await translateWithGoogle(text, targetLang, sourceLang);
    }

    // For long text, split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const translatedParts: string[] = [];

    for (const sentence of sentences) {
      if (sentence.trim()) {
        const translated = await translateText(sentence.trim(), targetLang, sourceLang);
        translatedParts.push(translated);
      }
    }

    return translatedParts.join(' ');
  } catch (error) {
    console.warn('Translation API error:', error);
    return await translateWithGoogle(text, targetLang, sourceLang);
  }
}

// Fallback using Google Translate (unofficial API)
async function translateWithGoogle(text: string, targetLang: string, sourceLang: string = 'auto'): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang === 'auto' ? 'auto' : sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data[0] && Array.isArray(data[0])) {
        const translatedText = data[0].map((item: any) => item[0]).join('');
        if (translatedText && translatedText !== text) {
          return translatedText;
        }
      }
    }
  } catch (error) {
    console.warn('Google Translate failed:', error);
  }

  return text;
}
```

### 1.2 Main translation function

```typescript
// Interface for translation
export interface PostTranslation {
  postId: string;
  lang: string;
  title?: string;
  content?: string;
  createdAt: Timestamp | Date;
  isFallback?: boolean;
}

// Get cached translation from Firestore
export async function getPostTranslation(postId: string, lang: string): Promise<PostTranslation | null> {
  try {
    const docRef = doc(db, 'community_posts', postId, 'translations', lang);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as PostTranslation;
    }
    return null;
  } catch (error) {
    console.error('Error getting translation:', error);
    return null;
  }
}

// Main translation function
export async function translatePostContent(
  postId: string,
  targetLang: string,
  payload: { title?: string; content?: string }
): Promise<PostTranslation> {
  // Check cache first
  const cached = await getPostTranslation(postId, targetLang);
  if (cached && !cached.isFallback) {
    const titleChanged = !payload.title || cached.title !== payload.title;
    const contentChanged = !payload.content || cached.content !== payload.content;
    if (titleChanged || contentChanged) {
      return cached;
    }
  }

  try {
    // Translate using free APIs
    const translatedTitle = payload.title ? await translateText(payload.title, targetLang) : '';
    const translatedContent = payload.content ? await translateText(payload.content, targetLang) : '';

    const record: PostTranslation = {
      postId,
      lang: targetLang,
      title: translatedTitle,
      content: translatedContent,
      createdAt: new Date()
    };

    // Cache the translation in Firestore
    try {
      const refDoc = doc(db, 'community_posts', postId, 'translations', targetLang);
      await setDoc(refDoc, {
        ...record,
        createdAt: serverTimestamp()
      });
    } catch (cacheError) {
      console.warn('Could not cache translation:', cacheError);
    }

    return record;
  } catch (error: any) {
    console.error('Error translating post:', error);
    throw new Error('Translation failed. Please try again later.');
  }
}
```

---

## Step 2: Update Firestore Security Rules

Add these rules to your `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... your existing rules ...

    // Translation rules
    match /community_posts/{postId}/translations/{lang} {
      // Anyone can read translations
      allow read: if true;
      
      // Authenticated users can create/update translations
      allow create, update: if request.auth != null;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## Step 3: Add UI Components

### 3.1 Add state variables to your post page

```tsx
// Translation state
const [translateModalOpen, setTranslateModalOpen] = useState(false);
const [translating, setTranslating] = useState(false);
const [displayedTitle, setDisplayedTitle] = useState<string | null>(null);
const [displayedContent, setDisplayedContent] = useState<string | null>(null);
const [currentLanguage, setCurrentLanguage] = useState<string | null>(null);

// Available languages
const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'es', name: 'Spanish', native: 'Español (Latinoamérica)' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', native: 'Português (Brasil)' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
];
```

### 3.2 Add handler functions

```tsx
// Open translation modal
const handleTranslatePost = () => {
  setTranslateModalOpen(true);
};

// Handle language selection
const handleSelectLanguage = async (langCode: string, langName: string) => {
  if (!post) return;
  
  setTranslating(true);
  
  try {
    const translation = await translatePostContent(
      postId, 
      langCode, 
      { title: post.title, content: post.content }
    );
    
    const lang = LANGUAGES.find(l => l.code === langCode);
    
    // Apply translation to the post display
    setDisplayedTitle(translation.title || post.title || '');
    setDisplayedContent(translation.content || post.content || '');
    setCurrentLanguage(lang?.native || langName);
    
    // Close the modal
    setTranslateModalOpen(false);
  } catch (error: any) {
    alert(error?.message || 'Translation failed.');
  } finally {
    setTranslating(false);
  }
};

// Reset to original language
const handleShowOriginal = () => {
  setDisplayedTitle(null);
  setDisplayedContent(null);
  setCurrentLanguage(null);
};
```

### 3.3 Add translation banner above post title

```tsx
{/* Translation indicator banner */}
{currentLanguage && (
  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3">
    <div className="flex items-center gap-2">
      <Languages className="w-4 h-4 text-blue-600" />
      <span className="text-sm text-blue-800">
        Translated to <strong>{currentLanguage}</strong>
      </span>
    </div>
    <button
      onClick={handleShowOriginal}
      className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
    >
      Show original
    </button>
  </div>
)}
```

### 3.4 Update post title and content rendering

```tsx
{/* Title - show translated or original */}
<h1 className="text-lg font-semibold text-gray-900 mb-3">
  {displayedTitle || post.title}
</h1>

{/* Content - show translated or original */}
{(displayedContent || post.content) && (
  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line mb-3">
    {displayedContent || post.content}
  </div>
)}
```

### 3.5 Add language selection modal

```tsx
{/* Translation Language Selection Modal */}
{translateModalOpen && (
  <div 
    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
    onClick={() => !translating && setTranslateModalOpen(false)}
  >
    <div 
      className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">View post in</h2>
        <button
          onClick={() => !translating && setTranslateModalOpen(false)}
          disabled={translating}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      
      {/* Content */}
      <div className="max-h-[60vh] overflow-y-auto">
        {translating ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-gray-400">Translating...</p>
          </div>
        ) : (
          <div className="py-2">
            {LANGUAGES.map((lang, index) => (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code, lang.name)}
                className={`w-full px-6 py-4 text-left text-white hover:bg-gray-800 transition-colors ${
                  index !== LANGUAGES.length - 1 ? 'border-b border-gray-700/50' : ''
                }`}
              >
                <span className="text-lg">{lang.native}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

### 3.6 Add menu button for translation

```tsx
{/* In your post actions menu */}
{currentLanguage ? (
  <button onClick={handleShowOriginal} className="menu-item">
    <Languages className="w-4 h-4" />
    Show original
  </button>
) : (
  <button onClick={handleTranslatePost} className="menu-item">
    <Languages className="w-4 h-4" />
    View in other languages
  </button>
)}
```

---

## Step 4: Required Imports

Make sure you have these imports:

```tsx
import { Languages, X } from 'lucide-react';
import { translatePostContent } from '@/lib/community';
```

---

## Supported Languages

| Code | Language | Native Name |
|------|----------|-------------|
| en | English | English |
| it | Italian | Italiano |
| fr | French | Français |
| es | Spanish | Español |
| th | Thai | ไทย |
| de | German | Deutsch |
| pt | Portuguese | Português |
| hi | Hindi | हिन्दी |
| zh | Chinese | 中文 |
| ja | Japanese | 日本語 |
| ko | Korean | 한국어 |
| ar | Arabic | العربية |
| ru | Russian | Русский |

---

## API Rate Limits

| API | Limit | Notes |
|-----|-------|-------|
| MyMemory | 5000 chars/day | Free, used first |
| Google Translate (unofficial) | Unlimited* | Fallback, may be blocked |

*Google's unofficial API may have rate limits or be blocked. For production, consider using the official Google Cloud Translation API.

---

## Optional: Firebase Cloud Function

For production, you can deploy a Cloud Function for more reliable translation:

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import { Translate } from '@google-cloud/translate/build/src/v2';

const translate = new Translate();

export const translatePost = functions.https.onCall(async (data, context) => {
  const { title, content, targetLang } = data;
  
  const [translatedTitle] = title ? await translate.translate(title, targetLang) : [''];
  const [translatedContent] = content ? await translate.translate(content, targetLang) : [''];
  
  return {
    title: translatedTitle,
    content: translatedContent
  };
});
```

---

## Troubleshooting

### Translation not working?

1. **Check browser console** for API errors
2. **Verify Firestore rules** are deployed
3. **Check if text is already in target language** (API returns same text)
4. **Clear cached translations** in Firestore if they're incorrect

### Translation is slow?

1. Translations are cached in Firestore after first request
2. Long posts are split into sentences (may take longer)
3. Consider using a paid API for faster results

### "Show original" not working?

Make sure you're using `displayedTitle || post.title` pattern in your JSX.

---

## Summary

✅ Translation modal with language list  
✅ Post content updates in-place (like Reddit)  
✅ "Translated to [Language]" banner  
✅ "Show original" button  
✅ Caching in Firestore  
✅ Multiple API fallbacks  

---

*Last updated: December 2025*
