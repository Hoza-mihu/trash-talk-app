# Troubleshooting: "Failed to create post" Error

## Common Causes and Solutions

### 1. Firestore Security Rules Not Deployed ⚠️ (Most Common)

**Problem:** The Firestore security rules in `firestore.rules` haven't been deployed to Firebase.

**Solution:**
1. Make sure Firebase CLI is installed:
   ```powershell
   npm install -g firebase-tools
   ```

2. Run the deployment script:
   ```powershell
   .\deploy-firestore-rules.ps1
   ```

3. Or manually deploy:
   ```powershell
   firebase login
   firebase use <your-project-id>
   firebase deploy --only firestore:rules
   ```

### 2. User Not Authenticated

**Problem:** User session expired or not logged in.

**Solution:**
- Check browser console for authentication errors
- Try logging out and logging back in
- Verify Firebase Auth is working

### 3. Missing Environment Variables

**Problem:** Firebase configuration is incomplete.

**Solution:**
- Check `.env.local` file has all required variables:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

### 4. Network/Firebase Service Issues

**Problem:** Temporary Firebase service unavailability.

**Solution:**
- Check Firebase status: https://status.firebase.google.com/
- Check browser console for network errors
- Try again after a few minutes

## Debugging Steps

1. **Open Browser Console** (F12)
   - Look for error messages with codes like:
     - `permission-denied` → Rules not deployed or user not authenticated
     - `unavailable` → Network/Firebase service issue
     - `invalid-argument` → Missing required fields

2. **Check Firestore Console**
   - Go to Firebase Console → Firestore Database
   - Verify `community_posts` collection exists
   - Check if rules are deployed (should see rules in Firestore settings)

3. **Verify Authentication**
   - Check if user is logged in
   - Verify `user.uid` exists in the form submission

4. **Test with Console Logs**
   - The improved error handling now logs detailed information
   - Check browser console for:
     - "Creating post with data: ..."
     - "Attempting to create post in Firestore: ..."
     - Any error details

## Quick Fix Checklist

- [ ] Firestore rules deployed (`firebase deploy --only firestore:rules`)
- [ ] User is authenticated (check auth state)
- [ ] All environment variables set in `.env.local`
- [ ] Firebase project ID matches in Firebase Console
- [ ] Browser console shows no Firebase config errors
- [ ] Network connection is stable

## Still Having Issues?

1. Check the browser console for the specific error code
2. The error message should now be more descriptive
3. Verify Firestore rules match the expected structure in `firestore.rules`
4. Ensure the `community_posts` collection is allowed in Firestore (it will be created automatically on first write if rules allow)

