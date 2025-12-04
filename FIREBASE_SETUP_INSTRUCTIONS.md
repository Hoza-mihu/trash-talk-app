# 🔥 Firebase Setup Instructions for Community App

## Step 1: Update Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the contents from `firestore.rules` file in this repository
5. Paste into the rules editor
6. Click **Publish**

## Step 2: Verify Collections Structure

The community app will automatically create these collections when users start posting:
- `community_posts` - Stores all community posts
- `comments` - Stores comments on posts

No manual collection creation needed - Firestore creates them automatically on first write.

## Step 3: Test the Setup

1. Deploy your app to Vercel
2. Sign in to your app
3. Navigate to `/community`
4. Try creating a post
5. Verify it appears in Firestore Console under `community_posts` collection

## Step 4: Index Creation (if needed)

If you see errors about missing indexes when filtering posts:

1. Firebase Console will show a link to create the index
2. Click the link to auto-create the required index
3. Wait for index to build (usually 1-2 minutes)

Common indexes needed:
- `community_posts`: category (Ascending), createdAt (Descending)
- `community_posts`: category (Ascending), isTip (Ascending), upvotes (Descending)
- `comments`: postId (Ascending), createdAt (Descending)

## Troubleshooting

### "Missing or insufficient permissions" error
- Check that Firestore rules are published
- Verify user is authenticated
- Check that rules match the structure in `firestore.rules`

### Posts not appearing
- Check browser console for errors
- Verify Firestore rules allow read access
- Check that posts are being created in Firestore Console

### Comments not working
- Verify comments collection rules
- Check that `commentCount` field is updating on posts
- Verify authentication is working

## Security Notes

- Posts and comments are publicly readable (anyone can view)
- Only authenticated users can create posts/comments
- Users can only delete their own posts/comments
- Vote counts can be updated by anyone (consider adding vote tracking later)

