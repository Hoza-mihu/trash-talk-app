# Firestore Indexes Setup Guide

## ⚠️ IMPORTANT: You MUST create these indexes for the app to work!

The weekly stats and comments features require Firestore composite indexes. Without them, queries will fail.

---

## 📋 Required Indexes

You need to create **4 indexes** in Firebase Console:

### 1. Comments Index (for displaying comments)
- **Collection:** `comments`
- **Fields:**
  - `postId` → Ascending
  - `createdAt` → Ascending
- **Why:** Needed to query comments by post and sort by date

### 2. Community Posts Index (for weekly stats - **THIS ONE IS CRITICAL**)
- **Collection:** `community_posts`
- **Fields:**
  - `communityId` → Ascending
  - `createdAt` → Ascending
- **Why:** Needed to find posts created in the last week for weekly stats

### 3. Votes Index (for weekly stats)
- **Collection:** `votes`
- **Fields:**
  - `postId` → Ascending
  - `createdAt` → Ascending
- **Why:** Needed to count votes from the last week for weekly visitor stats

### 4. Comments Index for Weekly Stats (uses same index as #1, but needs to work with 'in' queries)
- **Collection:** `comments`
- **Fields:**
  - `postId` → Ascending
  - `createdAt` → Ascending
- **Why:** Needed to find comments created in the last week (works with index #1)

---

## 🚀 Step-by-Step Instructions

### Method 1: Using Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your project
   - Click on **Firestore Database** in the left sidebar
   - Click on the **Indexes** tab at the top

2. **Create Index #1 - Comments**
   - Click the **"Create Index"** button
   - **Collection ID:** `comments`
   - **Fields:**
     - Click "Add field"
     - Field: `postId` | Query scope: Collection | Order: Ascending
     - Click "Add field" again
     - Field: `createdAt` | Query scope: Collection | Order: Ascending
   - Click **"Create"**

3. **Create Index #2 - Community Posts (CRITICAL for weekly stats)**
   - Click **"Create Index"** button
   - **Collection ID:** `community_posts`
   - **Fields:**
     - Click "Add field"
     - Field: `communityId` | Query scope: Collection | Order: Ascending
     - Click "Add field" again
     - Field: `createdAt` | Query scope: Collection | Order: Ascending
   - Click **"Create"**

4. **Create Index #3 - Votes**
   - Click **"Create Index"** button
   - **Collection ID:** `votes`
   - **Fields:**
     - Click "Add field"
     - Field: `postId` | Query scope: Collection | Order: Ascending
     - Click "Add field" again
     - Field: `createdAt` | Query scope: Collection | Order: Ascending
   - Click **"Create"**

5. **Wait for Indexes to Build**
   - You'll see status: "Building" → "Enabled" (takes 1-5 minutes)
   - **Important:** The app won't work properly until all indexes are "Enabled"
   - You can check status in the Indexes tab

### Method 2: Using Firebase CLI (If you have it installed)

```bash
# Make sure you're in the project root directory
cd C:\Projects\Final_Project\trash-talk-app

# Login to Firebase
firebase login

# Deploy indexes
firebase deploy --only firestore:indexes
```

---

## 🔍 How to Check if Indexes are Working

1. **Check Browser Console (F12)**
   - Look for errors like: "The query requires an index"
   - If you see this error, click the link provided - it will take you directly to create the index!

2. **Check Firebase Console**
   - Go to Firestore > Indexes
   - Look for status: ✅ "Enabled" (green checkmark)
   - If you see ⏳ "Building", wait a few minutes

3. **Test the Features**
   - **Comments:** Try viewing a post - comments should load
   - **Weekly Stats:** Visit a community page - you should see weekly visitors and contributions

---

## ❌ Common Errors and Solutions

### Error: "The query requires an index"
**Solution:** 
- Firebase will show a link in the error message
- Click that link - it takes you directly to create the index
- Or manually create the index using instructions above

### Weekly Stats showing 0 or not updating
**Possible causes:**
1. Index #2 (community_posts with communityId + createdAt) is missing or still building
2. Check browser console for errors
3. Wait for indexes to finish building (can take 5-10 minutes)

### Comments not displaying
**Possible causes:**
1. Index #1 (comments with postId + createdAt) is missing
2. Check browser console for errors
3. Verify the index status is "Enabled"

---

## 📝 Quick Reference: Index Checklist

- [ ] Index #1: `comments` - postId (ASC) + createdAt (ASC)
- [ ] Index #2: `community_posts` - communityId (ASC) + createdAt (ASC) ⭐ **MOST IMPORTANT**
- [ ] Index #3: `votes` - postId (ASC) + createdAt (ASC)
- [ ] All indexes show status: ✅ "Enabled" (not "Building")

---

## 🆘 Still Having Issues?

1. **Check Browser Console (F12)** for specific error messages
2. **Check Firebase Console > Firestore > Indexes** for index status
3. **Wait 5-10 minutes** after creating indexes for them to build
4. **Refresh the page** after indexes are enabled
5. **Check that your Firestore rules allow reading** (should be fine for authenticated users)

The indexes are **required** - the app cannot function properly without them!
