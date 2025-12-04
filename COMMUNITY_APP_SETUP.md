# 🌱 Community App - Setup Guide

## Overview

The Community App is a Reddit-like social platform integrated with Trash Talk that allows users to:
- Share recycling tips and experiences
- Ask questions about waste management
- Share their recycling statistics
- Upvote/downvote posts and comments
- Filter tips by waste category
- Get community tips directly from the result page

## Architecture

### Frontend Structure
```
frontend/app/community/
├── page.tsx                    # Main community feed
├── [category]/page.tsx         # Category-specific tips page
├── post/[id]/page.tsx         # Individual post detail page
└── create/page.tsx            # Create new post page
```

### Firebase Collections

1. **community_posts** - Stores all community posts
   - Fields: title, content, category, authorId, authorName, authorPhotoUrl, imageUrl, upvotes, downvotes, commentCount, createdAt, updatedAt, tags, isTip

2. **comments** - Stores comments on posts
   - Fields: postId, content, authorId, authorName, authorPhotoUrl, upvotes, downvotes, createdAt, parentId (for nested comments)

### Integration Points

1. **Result Page** (`/result`)
   - Shows link to community tips for the detected category
   - Link format: `/community/{category}?fromResult=true`

2. **Dashboard** (`/dashboard`)
   - "Join the Community" button
   - "Share Your Stats" button

3. **Navigation**
   - Added "Community" link to main navigation

## Features

### 1. Community Feed (`/community`)
- View all posts or filter by category
- Sort by recent or popular (upvotes)
- Create new posts
- View post previews with vote counts

### 2. Category Tips Page (`/community/[category]`)
- Shows only tips (isTip: true) for a specific category
- Filtered and sorted by upvotes
- Accessible from result page after analysis

### 3. Post Detail Page (`/community/post/[id]`)
- Full post content
- Voting system (upvote/downvote)
- Comments section
- Add comments (requires authentication)

### 4. Create Post Page (`/community/create`)
- Create new posts or tips
- Select category
- Mark as tip
- Upload images (placeholder - needs Firebase Storage integration)
- Quick action: Share recycling stats

## Usage

### From Result Page
After analyzing a waste item:
1. User sees the recycling tip
2. Click "💡 View more tips from the community →"
3. Redirected to `/community/{category}` with filtered tips

### Creating a Post
1. Navigate to `/community`
2. Click "Create Post"
3. Fill in title, content, select category
4. Optionally mark as tip
5. Submit

### Sharing Stats
1. From dashboard or create post page
2. Click "Share My Recycling Stats"
3. Automatically creates a formatted post with user's recycling statistics

## Firebase Setup

### Firestore Security Rules

Add these rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Community posts
    match /community_posts/{postId} {
      allow read: if true; // Public read
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                      (request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['upvotes', 'downvotes', 'commentCount', 'updatedAt']));
      allow delete: if request.auth != null && 
                      resource.data.authorId == request.auth.uid;
    }
    
    // Comments
    match /comments/{commentId} {
      allow read: if true; // Public read
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                      (request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['upvotes', 'downvotes']));
      allow delete: if request.auth != null && 
                      resource.data.authorId == request.auth.uid;
    }
  }
}
```

## API Functions

All community functions are in `frontend/lib/community.ts`:

- `createPost()` - Create a new post
- `getPostsByCategory()` - Get posts for a category
- `getAllPosts()` - Get all posts (main feed)
- `getPopularPosts()` - Get posts sorted by upvotes
- `getTipsByCategory()` - Get tips for a category
- `getPostById()` - Get single post
- `voteOnPost()` - Upvote/downvote a post
- `addComment()` - Add comment to post
- `getCommentsByPostId()` - Get comments for a post
- `shareRecyclingStats()` - Auto-create stats post

## Future Enhancements

1. **Image Upload**: Complete Firebase Storage integration for post images
2. **Vote Tracking**: Track user votes to prevent duplicate voting
3. **Nested Comments**: Full reply/thread support
4. **Search**: Search posts by keywords
5. **User Profiles**: View user's posts and comments
6. **Notifications**: Notify users of replies/upvotes
7. **Moderation**: Report/flag inappropriate content
8. **Rich Text**: Markdown support for post content
9. **Tags**: Better tag system for filtering
10. **Bookmarks**: Save favorite posts

## Testing

1. **Create a Post**:
   - Navigate to `/community/create`
   - Fill in form and submit
   - Verify post appears in feed

2. **View Category Tips**:
   - Analyze an item in Trash Talk
   - Click community link in result page
   - Verify tips are filtered by category

3. **Vote on Post**:
   - Open a post
   - Click upvote/downvote
   - Verify vote count updates

4. **Add Comment**:
   - Open a post
   - Add a comment
   - Verify comment appears

5. **Share Stats**:
   - From dashboard or create page
   - Click "Share My Recycling Stats"
   - Verify formatted post is created

## Deployment Notes

- All community features use existing Firebase setup
- No additional environment variables needed
- Ensure Firestore security rules are configured
- Community app is part of the main frontend, deployed together

