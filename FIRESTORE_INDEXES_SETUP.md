# 🔥 Firestore Composite Indexes Setup

This guide explains how to set up the required composite indexes for optimal Firestore query performance.

## Quick Setup

### Option 1: Deploy via Firebase CLI (Recommended)

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init firestore

# Deploy indexes
firebase deploy --only firestore:indexes
```

### Option 2: Create via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** > **Indexes**
4. Click **Create Index**
5. Create each index manually using the specifications below

## Required Indexes

### 1. Tips by Category (category + isTip + upvotes)
**Collection:** `community_posts`
- `category` (Ascending)
- `isTip` (Ascending)
- `upvotes` (Descending)

**Used by:** `getTipsByCategory()`

### 2. Hot Posts by Category (category + hotScore)
**Collection:** `community_posts`
- `category` (Ascending)
- `hotScore` (Descending)

**Used by:** `getHotPostsByCategory()` (future feature)

### 3. Posts by User (authorId + createdAt)
**Collection:** `community_posts`
- `authorId` (Ascending)
- `createdAt` (Descending)

**Used by:** `getPostsByUser()`

### 4. Hot Posts by Community (communityId + hotScore)
**Collection:** `community_posts`
- `communityId` (Ascending)
- `hotScore` (Descending)

**Used by:** `getHotPostsByCommunity()` (future feature)

### 5. Hot Posts Feed (hotScore + createdAt)
**Collection:** `community_posts`
- `hotScore` (Descending)
- `createdAt` (Descending)

**Used by:** `getHotPosts()`

### 6. Comments by Post (postId + createdAt)
**Collection:** `comments`
- `postId` (Ascending)
- `createdAt` (Ascending)

**Used by:** `getCommentsByPostId()`

## Auto-Index Creation

Firebase will automatically suggest creating indexes when you run a query that needs one. The console will show an error with a link to create the index directly.

## Verification

After deploying indexes:

1. Go to Firebase Console > Firestore > Indexes
2. Verify all indexes show status "Enabled"
3. It may take a few minutes for indexes to build if you have existing data

## Performance Benefits

- ✅ Faster queries (composite indexes are much faster than multiple single-field queries)
- ✅ Reduced read costs (more efficient data retrieval)
- ✅ Better scalability (handles large datasets efficiently)
- ✅ Support for complex sorting and filtering

## Troubleshooting

**Error: "The query requires an index"**
- Click the link in the error message to create the index automatically
- Or manually create it using the specifications above

**Index building is slow**
- Indexes build faster with less data
- For large collections, consider creating indexes before adding data
- Building can take 5-30 minutes depending on collection size

**Index not showing up**
- Wait a few minutes for Firebase to process
- Refresh the Firebase Console
- Check if index definition matches exactly (field order matters!)

