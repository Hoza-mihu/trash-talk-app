import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  increment,
  Timestamp,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
  setDoc,
  getDoc as getFirestoreDoc,
  onSnapshot,
  Unsubscribe,
  startAfter
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, functions } from './firebase';
import { WasteCategoryKey } from './stats';

/**
 * Calculate hot score using Reddit's ranking algorithm
 * Formula: (upvotes - downvotes) / (ageInHours + 2)^1.8
 * This ensures newer posts get a boost, but highly upvoted posts stay hot longer
 * 
 * @param upvotes Number of upvotes
 * @param downvotes Number of downvotes
 * @param createdAt Post creation timestamp
 * @returns Hot score (higher = hotter)
 */
export function calculateHotScore(
  upvotes: number,
  downvotes: number,
  createdAt: Timestamp | Date
): number {
  const score = upvotes - downvotes;
  const now = new Date();
  const postDate = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
  const ageInHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
  
  // Reddit's hot algorithm: score / (age + 2)^gravity
  // Using 1.8 as gravity factor (Reddit's default)
  const gravity = 1.8;
  const denominator = Math.pow(ageInHours + 2, gravity);
  
  // Prevent division by zero and handle negative scores
  return denominator > 0 ? score / denominator : 0;
}

/**
 * Firestore Composite Indexes Required:
 * 
 * You need to create these indexes in Firebase Console:
 * 
 * 1. Collection: community_posts
 *    Fields: category (Ascending), upvotes (Descending), createdAt (Descending)
 *    Query: getTipsByCategory
 * 
 * 2. Collection: community_posts
 *    Fields: category (Ascending), hotScore (Descending)
 *    Query: getHotPostsByCategory
 * 
 * 3. Collection: community_posts
 *    Fields: authorId (Ascending), createdAt (Descending)
 *    Query: getPostsByUser
 * 
 * 4. Collection: community_posts
 *    Fields: communityId (Ascending), hotScore (Descending)
 *    Query: getHotPostsByCommunity
 * 
 * 5. Collection: comments
 *    Fields: postId (Ascending), createdAt (Ascending)
 *    Query: getCommentsByPostId
 * 
 * To create indexes:
 * 1. Go to Firebase Console > Firestore > Indexes
 * 2. Click "Create Index"
 * 3. Select collection and add fields as specified above
 * 4. Or deploy firestore.indexes.json (recommended for team development)
 */

export interface Community {
  id?: string;
  name: string;
  description: string;
  slug: string; // URL-friendly name (e.g., "plastic-recyclers")
  category?: WasteCategoryKey | null;
  creatorId: string;
  creatorName: string;
  memberCount: number;
  postCount: number;
  weeklyVisitors?: number; // Weekly unique visitors
  weeklyContributions?: number; // Weekly posts + comments
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  imageUrl?: string; // Legacy - use bannerUrl and iconUrl instead
  bannerUrl?: string; // Community banner image
  iconUrl?: string; // Community icon/avatar
  rules?: string[];
  tags?: string[];
  communityType?: 'public' | 'restricted' | 'private';
  matureContent?: boolean;
  topics?: string[]; // Selected topics (up to 3)
  moderators?: Moderator[];
}

export interface CommunityAchievement {
  id: string;
  userId: string;
  communityId: string;
  achievementType: AchievementType;
  unlockedAt: Timestamp | Date;
  progress?: number; // Current progress towards achievement (e.g., 75 for 75%)
  metadata?: Record<string, any>; // Additional data like rank percentage
}

export type AchievementType = 
  | 'top_25_poster' 
  | 'top_10_poster' 
  | 'top_5_poster' 
  | 'top_1_poster'
  | 'top_25_commenter'
  | 'top_10_commenter'
  | 'top_5_commenter'
  | 'top_1_commenter'
  | 'picasso' // Top contributor (posts + comments)
  | 'rising_star' // New member who's very active
  | 'repeat_contributor' // Consistent contributor
  | 'super_contributor' // High total contributions
  | 'content_connoisseur' // High-quality content creator
  | 'elder'; // Long-time member

export interface UserCommunityStats {
  userId: string;
  communityId: string;
  postCount: number;
  commentCount: number;
  totalContributions: number; // posts + comments
  upvotesReceived: number; // Total upvotes on user's posts and comments
  memberSince: Timestamp | Date;
  lastActive: Timestamp | Date;
}

export interface AchievementDefinition {
  type: AchievementType;
  name: string;
  description: string;
  icon: string; // Emoji or icon identifier
  color: string; // Color scheme
  requirement: (stats: UserCommunityStats, allStats: UserCommunityStats[]) => boolean;
  calculateProgress?: (stats: UserCommunityStats, allStats: UserCommunityStats[]) => number;
}

export interface CommunityPost {
  id?: string;
  title: string; // Required - must have a title
  content?: string; // Optional - can post with just title and/or image
  category: WasteCategoryKey;
  communityId?: string; // Optional: which community this post belongs to
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  imageUrl?: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  hotScore?: number; // Calculated hot score for ranking (Reddit algorithm)
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  tags?: string[];
  isTip?: boolean; // Whether this is a recycling tip
  crosspostId?: string; // ID of the original post if this is a crosspost
  crosspostFrom?: string; // Community ID where the original post was made
}

export interface Comment {
  id?: string;
  postId: string;
  postAuthorId?: string | null; // Post author ID for permission checks
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  upvotes: number;
  downvotes: number;
  createdAt: Timestamp | Date;
  parentId?: string; // For nested comments/replies
  replyCount?: number;
  replies?: Comment[]; // Nested replies
}

export interface Vote {
  userId: string;
  postId: string;
  type: 'upvote' | 'downvote';
}

export interface Moderator {
  userId: string;
  userName: string;
  userPhotoUrl?: string | null;
  addedAt?: Timestamp | Date;
}

export interface ModRequest {
  id?: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string | null;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp | Date;
}

export interface PostAction {
  id?: string; // doc id (postId)
  userId?: string;
  postId: string;
  communityId?: string | null;
  followed?: boolean;
  saved?: boolean;
  hidden?: boolean;
  translated?: boolean;
  updatedAt: Timestamp | Date | ReturnType<typeof serverTimestamp>;
}

export interface PostTranslation {
  postId: string;
  lang: string;
  title?: string;
  content?: string;
  createdAt: Timestamp | Date;
  isFallback?: boolean; // True if translation came from fallback method
}

export interface PostReport {
  id?: string;
  communityId: string;
  postId: string;
  reporterId: string;
  reason: string;
  status?: 'pending' | 'reviewed' | 'resolved';
  createdAt: Timestamp | Date;
  resolvedAt?: Timestamp | Date;
  resolvedBy?: string;
}

export interface Notification {
  id?: string;
  userId: string;
  type: 'new_post' | 'new_comment' | 'new_reply';
  communityId?: string;
  postId?: string;
  commentId?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp | Date;
}

// Create a new post
export async function createPost(
  userId: string,
  userName: string,
  userPhotoUrl: string | null,
  postData: Omit<CommunityPost, 'id' | 'authorId' | 'authorName' | 'authorPhotoUrl' | 'upvotes' | 'downvotes' | 'commentCount' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    // Validate required fields
    if (!userId || !userName) {
      throw new Error('User ID and name are required');
    }
    
    // Title is required
    if (!postData.title || !postData.title.trim()) {
      throw new Error('Title is required');
    }

    if (!postData.category) {
      throw new Error('Category is required');
    }

    // Remove undefined values - Firestore doesn't accept undefined
    const cleanPostData = Object.fromEntries(
      Object.entries(postData).filter(([_, value]) => value !== undefined)
    );

    const now = serverTimestamp();
    const initialHotScore = calculateHotScore(0, 0, new Date());
    
    const postPayload = {
      ...cleanPostData,
      authorId: userId,
      authorName: userName,
      authorPhotoUrl: userPhotoUrl || null,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      hotScore: initialHotScore,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('Attempting to create post in Firestore:', {
      collection: 'community_posts',
      data: { ...postPayload, createdAt: '[serverTimestamp]', updatedAt: '[serverTimestamp]' }
    });

    const docRef = await addDoc(collection(db, 'community_posts'), postPayload);
    
    // If post belongs to a community, increment its post count and notify members
    if (postData.communityId) {
      const communityRef = doc(db, 'communities', postData.communityId);
      await updateDoc(communityRef, {
        postCount: increment(1),
        updatedAt: serverTimestamp()
      });

      // Notify all community members about the new post (except the author)
      try {
        await notifyCommunityMembers(postData.communityId, docRef.id, postData.title || 'Untitled', userName, userId);
      } catch (notifyError) {
        console.warn('Failed to send notifications:', notifyError);
        // Don't fail post creation if notifications fail
      }

      // Calculate achievements for the user in this community (async, don't wait)
      calculateUserAchievements(userId, postData.communityId).catch(error => {
        console.warn('Failed to calculate achievements:', error);
      });

      // Update weekly stats (async, don't wait)
      calculateWeeklyCommunityStats(postData.communityId).catch(error => {
        console.warn('Failed to update weekly stats:', error);
      });
    }
    
    console.log('Post created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating post:', error);
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack
    });
    
    // Re-throw with more context
    if (error?.code) {
      const enhancedError = new Error(`Firestore error (${error.code}): ${error.message}`);
      (enhancedError as any).code = error.code;
      throw enhancedError;
    }
    
    throw error;
  }
}

// Create a crosspost (share a post to another community)
export async function createCrosspost(
  userId: string,
  userName: string,
  userPhotoUrl: string | null,
  originalPostId: string,
  targetCommunityId: string
): Promise<string> {
  try {
    // Get the original post
    const originalPost = await getPostById(originalPostId);
    if (!originalPost) {
      throw new Error('Original post not found');
    }

    // Create a new post with crosspost reference
    const crosspostData = {
      title: originalPost.title,
      content: originalPost.content,
      category: originalPost.category,
      communityId: targetCommunityId,
      imageUrl: originalPost.imageUrl,
      isTip: originalPost.isTip,
      tags: originalPost.tags,
      crosspostId: originalPost.id || originalPostId,
      // Use undefined instead of null to satisfy type and Firestore constraints
      crosspostFrom: originalPost.communityId || undefined
    };

    return await createPost(userId, userName, userPhotoUrl, crosspostData);
  } catch (error: any) {
    console.error('Error creating crosspost:', error);
    throw new Error(`Failed to create crosspost: ${error.message || 'Unknown error'}`);
  }
}

// Get posts by category with pagination
// NOTE: Requires composite index: category (Ascending), createdAt (Descending)
export async function getPostsByCategory(
  category: WasteCategoryKey,
  postsLimit: number = 25,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ posts: CommunityPost[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
  try {
    let q = query(
      collection(db, 'community_posts'),
      where('category', '==', category),
      orderBy('createdAt', 'desc'),
      limit(postsLimit)
    );
    
    if (lastDoc) {
      q = query(
        collection(db, 'community_posts'),
        where('category', '==', category),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(postsLimit)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
    
    return {
      posts,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [] };
  }
}

// Get all posts (for main feed) with pagination support
export async function getAllPosts(
  postsLimit: number = 25,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ posts: CommunityPost[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
  try {
    let q = query(
      collection(db, 'community_posts'),
      orderBy('createdAt', 'desc'),
      limit(postsLimit)
    );
    
    // Add pagination if lastDoc is provided
    if (lastDoc) {
      q = query(
        collection(db, 'community_posts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(postsLimit)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
    
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return {
      posts,
      lastDoc: newLastDoc
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [] };
  }
}

// Get popular posts (by upvotes) with pagination
export async function getPopularPosts(
  postsLimit: number = 25,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ posts: CommunityPost[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
  try {
    let q = query(
      collection(db, 'community_posts'),
      orderBy('upvotes', 'desc'),
      limit(postsLimit)
    );
    
    if (lastDoc) {
      q = query(
        collection(db, 'community_posts'),
        orderBy('upvotes', 'desc'),
        startAfter(lastDoc),
        limit(postsLimit)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
    
    return {
      posts,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
    };
  } catch (error) {
    console.error('Error fetching popular posts:', error);
    return { posts: [] };
  }
}

// Get hot posts (by hot score - Reddit algorithm) with pagination
// NOTE: Requires composite index: hotScore (Descending), createdAt (Descending)
export async function getHotPosts(
  postsLimit: number = 25,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ posts: CommunityPost[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
  try {
    let q = query(
      collection(db, 'community_posts'),
      orderBy('hotScore', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(postsLimit)
    );
    
    if (lastDoc) {
      q = query(
        collection(db, 'community_posts'),
        orderBy('hotScore', 'desc'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(postsLimit)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
    
    return {
      posts,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
    };
  } catch (error) {
    console.error('Error fetching hot posts:', error);
    // Fallback to popular posts if hot score index doesn't exist
    return getPopularPosts(postsLimit, lastDoc);
  }
}

// Get tips by category (filtered posts where isTip === true)
// NOTE: Requires composite index: category (Ascending), isTip (Ascending), upvotes (Descending)
export async function getTipsByCategory(
  category: WasteCategoryKey,
  tipsLimit: number = 25,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ posts: CommunityPost[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
  try {
    let q = query(
      collection(db, 'community_posts'),
      where('category', '==', category),
      where('isTip', '==', true),
      orderBy('upvotes', 'desc'),
      limit(tipsLimit)
    );
    
    if (lastDoc) {
      q = query(
        collection(db, 'community_posts'),
        where('category', '==', category),
        where('isTip', '==', true),
        orderBy('upvotes', 'desc'),
        startAfter(lastDoc),
        limit(tipsLimit)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
    
    return {
      posts,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
    };
  } catch (error) {
    console.error('Error fetching tips:', error);
    // If index doesn't exist, fallback to simpler query
    const result = await getPostsByCategory(category, tipsLimit, lastDoc);
    return {
      posts: result.posts.filter(post => post.isTip === true),
      lastDoc: result.lastDoc
    };
  }
}

// Get single post by ID
export async function getPostById(postId: string): Promise<CommunityPost | null> {
  try {
    const docRef = doc(db, 'community_posts', postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as CommunityPost;
    }
    return null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// Check if user has voted on a post
export async function getUserVote(postId: string, userId: string): Promise<'upvote' | 'downvote' | null> {
  try {
    const voteRef = doc(db, 'votes', `${postId}_${userId}`);
    const voteSnap = await getFirestoreDoc(voteRef);
    
    if (voteSnap.exists()) {
      return voteSnap.data().type as 'upvote' | 'downvote';
    }
    return null;
  } catch (error) {
    console.error('Error checking user vote:', error);
    return null;
  }
}

// Vote on a post (with tracking to prevent duplicate votes)
export async function voteOnPost(
  postId: string,
  userId: string,
  voteType: 'upvote' | 'downvote'
): Promise<void> {
  try {
    const voteRef = doc(db, 'votes', `${postId}_${userId}`);
    const voteSnap = await getFirestoreDoc(voteRef);
    const postRef = doc(db, 'community_posts', postId);
    const postSnap = await getFirestoreDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }
    
    const existingVote = voteSnap.exists() ? voteSnap.data().type : null;
    const postData = postSnap.data();
    
    // If user already voted the same way, remove the vote
    if (existingVote === voteType) {
      const newUpvotes = voteType === 'upvote' ? postData.upvotes - 1 : postData.upvotes;
      const newDownvotes = voteType === 'downvote' ? postData.downvotes - 1 : postData.downvotes;
      const createdAt = postData.createdAt instanceof Timestamp 
        ? postData.createdAt 
        : Timestamp.fromDate(new Date(postData.createdAt));
      const newHotScore = calculateHotScore(newUpvotes, newDownvotes, createdAt);
      
      // Remove vote
      await updateDoc(postRef, {
        [voteType === 'upvote' ? 'upvotes' : 'downvotes']: increment(-1),
        hotScore: newHotScore,
        updatedAt: serverTimestamp()
      });
      // Delete vote record
      await updateDoc(voteRef, { type: null });
      return;
    }
    
    // Calculate new vote counts after this vote operation
    let newUpvotes = postData.upvotes;
    let newDownvotes = postData.downvotes;
    
    // If user voted opposite way, switch the vote
    if (existingVote && existingVote !== voteType) {
      // Remove old vote
      newUpvotes = existingVote === 'upvote' ? newUpvotes - 1 : newUpvotes;
      newDownvotes = existingVote === 'downvote' ? newDownvotes - 1 : newDownvotes;
    }
    
    // Add new vote
    newUpvotes = voteType === 'upvote' ? newUpvotes + 1 : newUpvotes;
    newDownvotes = voteType === 'downvote' ? newDownvotes + 1 : newDownvotes;
    
    // Calculate and update hot score
    const createdAt = postData.createdAt instanceof Timestamp 
      ? postData.createdAt 
      : Timestamp.fromDate(new Date(postData.createdAt));
    const newHotScore = calculateHotScore(newUpvotes, newDownvotes, createdAt);
    
    // Update post with new votes and hot score (atomic operation)
    if (existingVote && existingVote !== voteType) {
      // Switch vote: remove old, add new, update hot score
      await updateDoc(postRef, {
        [existingVote === 'upvote' ? 'upvotes' : 'downvotes']: increment(-1),
        [voteType === 'upvote' ? 'upvotes' : 'downvotes']: increment(1),
        hotScore: newHotScore,
        updatedAt: serverTimestamp()
      });
    } else {
      // New vote: just add and update hot score
      await updateDoc(postRef, {
        [voteType === 'upvote' ? 'upvotes' : 'downvotes']: increment(1),
        hotScore: newHotScore,
        updatedAt: serverTimestamp()
      });
    }
    
    // Record the vote
    await setDoc(voteRef, {
      postId,
      userId,
      type: voteType,
      createdAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error voting on post:', error);
    throw error;
  }
}

// Add comment to post (supports nested replies)
export async function addComment(
  postId: string,
  userId: string,
  userName: string,
  userPhotoUrl: string | null,
  content: string,
  parentId?: string
): Promise<string> {
  try {
    // Get post to retrieve post author ID and community info
    const postRef = doc(db, 'community_posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }
    
    const postData = postSnap.data() as CommunityPost;
    const postAuthorId = postData.authorId || null;

    const commentRef = await addDoc(collection(db, 'comments'), {
      postId,
      postAuthorId: postAuthorId || null, // Store post author ID for permission checks
      communityId: postData.communityId || null, // Store communityId for efficient querying
      content,
      authorId: userId,
      authorName: userName,
      authorPhotoUrl: userPhotoUrl || null,
      upvotes: 0,
      downvotes: 0,
      parentId: parentId || null,
      replyCount: 0,
      createdAt: serverTimestamp()
    });
    
    // If this is a reply, increment parent comment's reply count
    if (parentId) {
      const parentRef = doc(db, 'comments', parentId);
      await updateDoc(parentRef, {
        replyCount: increment(1)
      });
    }
    
    // Update post comment count
    await updateDoc(postRef, {
      commentCount: increment(1),
      updatedAt: serverTimestamp()
    });
    
    // Calculate achievements and update stats if post belongs to a community
    if (postData.communityId) {
      // Calculate achievements for the user in this community (async, don't wait)
      calculateUserAchievements(userId, postData.communityId).catch(error => {
        console.warn('Failed to calculate achievements:', error);
      });

      // Update weekly stats (async, don't wait)
      calculateWeeklyCommunityStats(postData.communityId).catch(error => {
        console.warn('Failed to update weekly stats:', error);
      });
    }
    
    return commentRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

// Get comments for a post (with nested replies)
export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  try {
    // Get all comments for this post
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const allComments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment & { replyCount?: number }));
    
    // Organize into tree structure
    const commentMap = new Map<string, Comment & { replies?: Comment[] }>();
    const rootComments: (Comment & { replies?: Comment[] })[] = [];
    
    // First pass: create map of all comments
    allComments.forEach(comment => {
      commentMap.set(comment.id!, { ...comment, replies: [] });
    });
    
    // Second pass: build tree
    allComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id!)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          if (!parent.replies) parent.replies = [];
          parent.replies.push(commentWithReplies);
        } else {
          // Parent not found, treat as root comment
          rootComments.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });
    
    // Sort root comments by createdAt (newest first)
    rootComments.sort((a, b) => {
      const aTime = a.createdAt instanceof Timestamp 
        ? a.createdAt.toMillis() 
        : (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime());
      const bTime = b.createdAt instanceof Timestamp 
        ? b.createdAt.toMillis() 
        : (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime());
      return bTime - aTime; // Newest first
    });
    
    return rootComments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

// Get replies for a comment
export async function getCommentReplies(commentId: string): Promise<Comment[]> {
  try {
    const q = query(
      collection(db, 'comments'),
      where('parentId', '==', commentId),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment));
  } catch (error) {
    console.error('Error fetching replies:', error);
    return [];
  }
}

// Search posts by keyword
export async function searchPosts(searchTerm: string, limitCount: number = 20): Promise<CommunityPost[]> {
  try {
    // Get all posts and filter client-side (Firestore doesn't support full-text search)
    // For production, consider using Algolia or similar
    const q = query(
      collection(db, 'community_posts'),
      orderBy('createdAt', 'desc'),
      limit(100) // Get more to filter
    );
    
    const querySnapshot = await getDocs(q);
    const searchLower = searchTerm.toLowerCase();
    
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CommunityPost))
      .filter(post => 
        post.title?.toLowerCase().includes(searchLower) ||
        post.content?.toLowerCase().includes(searchLower) ||
        post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error searching posts:', error);
    return [];
  }
}

// Get posts by user
export async function getPostsByUser(
  userId: string,
  limitCount: number = 20,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ posts: CommunityPost[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
  try {
    let q = query(
      collection(db, 'community_posts'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    // Apply pagination if lastDoc is provided
    if (lastDoc) {
      q = query(
        collection(db, 'community_posts'),
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
    
    const lastDocument = querySnapshot.docs.length > 0 
      ? querySnapshot.docs[querySnapshot.docs.length - 1] 
      : undefined;
    
    return { posts, lastDoc: lastDocument };
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return { posts: [] };
  }
}

// Get comments by user
export async function getCommentsByUser(userId: string, limitCount: number = 20): Promise<Comment[]> {
  try {
    const q = query(
      collection(db, 'comments'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment));
  } catch (error) {
    console.error('Error fetching user comments:', error);
    return [];
  }
}

// Upload image to Firebase Storage
export async function uploadPostImage(file: File, userId: string): Promise<string> {
  try {
    const timestamp = Date.now();
    // Use a sanitized filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `community/${userId}/${timestamp}_${sanitizedName}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Upload community image to Firebase Storage (legacy - use uploadCommunityBanner or uploadCommunityIcon)
export async function uploadCommunityImage(file: File, userId: string): Promise<string> {
  try {
    const timestamp = Date.now();
    // Use a sanitized filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `communities/${userId}/${timestamp}_${sanitizedName}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading community image:', error);
    throw error;
  }
}

// Upload community banner image
export async function uploadCommunityBanner(file: File, userId: string, communityId?: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = communityId 
      ? `communities/${communityId}/banner_${timestamp}_${sanitizedName}`
      : `communities/${userId}/banner_${timestamp}_${sanitizedName}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading community banner:', error);
    throw error;
  }
}

// Upload community icon
export async function uploadCommunityIcon(file: File, userId: string, communityId?: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = communityId
      ? `communities/${communityId}/icon_${timestamp}_${sanitizedName}`
      : `communities/${userId}/icon_${timestamp}_${sanitizedName}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading community icon:', error);
    throw error;
  }
}

// ========== COMMUNITY FUNCTIONS ==========

// Create a new community
export async function createCommunity(
  userId: string,
  userName: string,
  communityData: {
    name: string;
    description: string;
    category?: WasteCategoryKey | null;
    imageUrl?: string; // Legacy
    bannerUrl?: string;
    iconUrl?: string;
    rules?: string[];
    tags?: string[];
    communityType?: 'public' | 'restricted' | 'private';
    matureContent?: boolean;
    topics?: string[];
  }
): Promise<string> {
  try {
    if (!userId || !userName) {
      throw new Error('User ID and name are required');
    }

    if (!communityData.name || !communityData.description) {
      throw new Error('Community name and description are required');
    }

    // Generate slug from name
    const slug = communityData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const existingCommunity = await getCommunityBySlug(slug);
    if (existingCommunity) {
      throw new Error('A community with this name already exists');
    }

    const communityPayload = {
      name: communityData.name,
      description: communityData.description,
      slug,
      category: communityData.category || null,
      creatorId: userId,
      creatorName: userName,
      memberCount: 1, // Creator is first member
      postCount: 0,
      imageUrl: communityData.imageUrl || communityData.iconUrl || null, // Legacy support
      bannerUrl: communityData.bannerUrl || null,
      iconUrl: communityData.iconUrl || null,
      rules: communityData.rules || [],
      tags: communityData.tags || [],
      communityType: communityData.communityType || 'public',
      matureContent: communityData.matureContent || false,
      topics: communityData.topics || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'communities'), communityPayload);

    // Add creator as member
    await joinCommunity(docRef.id, userId);

    return docRef.id;
  } catch (error: any) {
    console.error('Error creating community:', error);
    throw new Error(`Failed to create community: ${error.message || 'Unknown error'}`);
  }
}

// Update community banner and/or icon
export async function updateCommunityImages(
  communityId: string,
  userId: string,
  updates: {
    bannerUrl?: string;
    iconUrl?: string;
  }
): Promise<void> {
  try {
    const communityRef = doc(db, 'communities', communityId);
    const communitySnap = await getDoc(communityRef);

    if (!communitySnap.exists()) {
      throw new Error('Community not found');
    }

    const communityData = communitySnap.data() as Community;
    if (communityData.creatorId !== userId) {
      throw new Error('Only the creator can update community images');
    }

    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (updates.bannerUrl !== undefined) {
      updateData.bannerUrl = updates.bannerUrl;
    }

    if (updates.iconUrl !== undefined) {
      updateData.iconUrl = updates.iconUrl;
      // Also update legacy imageUrl for backward compatibility
      updateData.imageUrl = updates.iconUrl;
    }

    await updateDoc(communityRef, updateData);
  } catch (error: any) {
    console.error('Error updating community images:', error);
    throw error;
  }
}

// Get community by slug
export async function getCommunityBySlug(slug: string): Promise<Community | null> {
  try {
    const q = query(
      collection(db, 'communities'),
      where('slug', '==', slug),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Community;
  } catch (error) {
    console.error('Error fetching community:', error);
    return null;
  }
}

// Get community by ID
export async function getCommunityById(communityId: string): Promise<Community | null> {
  try {
    const docRef = doc(db, 'communities', communityId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Community;
    }
    return null;
  } catch (error) {
    console.error('Error fetching community:', error);
    return null;
  }
}

export async function getModerators(communityId: string): Promise<Moderator[]> {
  try {
    const comm = await getCommunityById(communityId);
    if (!comm || !comm.moderators) return [];
    return comm.moderators;
  } catch (error) {
    console.error('Error fetching moderators:', error);
    return [];
  }
}

export async function requestModerator(
  communityId: string,
  userId: string,
  userName: string,
  userPhotoUrl: string | null,
  message?: string
) {
  try {
    const reqRef = collection(db, 'communities', communityId, 'modRequests');
    await addDoc(reqRef, {
      userId,
      userName,
      userPhotoUrl: userPhotoUrl || null,
      message: message || '',
      status: 'pending',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error requesting moderator role:', error);
    throw error;
  }
}

export async function getModeratorRequests(communityId: string): Promise<ModRequest[]> {
  try {
    const reqRef = collection(db, 'communities', communityId, 'modRequests');
    const q = query(reqRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ModRequest));
  } catch (error) {
    console.error('Error fetching moderator requests:', error);
    return [];
  }
}

export async function approveModerator(
  communityId: string,
  requestId: string,
  moderator: Moderator
) {
  try {
    const commRef = doc(db, 'communities', communityId);
    const reqRef = doc(db, 'communities', communityId, 'modRequests', requestId);
    const commSnap = await getDoc(commRef);
    if (!commSnap.exists()) throw new Error('Community not found');
    const data = commSnap.data() as Community;
    const existing = data.moderators || [];
    const already = existing.some((m) => m.userId === moderator.userId);
    const updated = already ? existing : [...existing, { ...moderator, addedAt: new Date() }];
    await updateDoc(commRef, { moderators: updated, updatedAt: serverTimestamp() });
    await updateDoc(reqRef, { status: 'approved', updatedAt: serverTimestamp() });
  } catch (error) {
    console.error('Error approving moderator:', error);
    throw error;
  }
}

export async function rejectModerator(communityId: string, requestId: string) {
  try {
    const reqRef = doc(db, 'communities', communityId, 'modRequests', requestId);
    await updateDoc(reqRef, { status: 'rejected', updatedAt: serverTimestamp() });
  } catch (error) {
    console.error('Error rejecting moderator:', error);
    throw error;
  }
}

export async function removeModerator(communityId: string, moderatorId: string) {
  try {
    const commRef = doc(db, 'communities', communityId);
    const commSnap = await getDoc(commRef);
    if (!commSnap.exists()) throw new Error('Community not found');
    const data = commSnap.data() as Community;
    const existing = data.moderators || [];
    const updated = existing.filter((m) => m.userId !== moderatorId);
    await updateDoc(commRef, { moderators: updated, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error('Error removing moderator:', error);
    throw error;
  }
}

export async function sendModeratorMessage(
  communityId: string,
  payload: {
    fromUserId: string;
    fromUserName: string;
    fromUserPhotoUrl?: string | null;
    to: 'admin' | 'moderators';
    text: string;
  }
) {
  try {
    const msgsRef = collection(db, 'communities', communityId, 'modMessages');
    await addDoc(msgsRef, {
      ...payload,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error sending moderator message:', error);
    throw error;
  }
}

// User post actions (follow/save/hide/translate/report)
export async function setPostAction(
  userId: string,
  postId: string,
  action: Partial<Omit<PostAction, 'postId' | 'updatedAt' | 'userId'>> & { communityId?: string | null }
) {
  if (!userId || !postId) throw new Error('userId and postId are required');
  const docRef = doc(db, 'users', userId, 'postActions', postId);

  const payload: Partial<PostAction> = {
    postId,
    userId,
    communityId: action.communityId ?? null,
    updatedAt: serverTimestamp()
  };

  if (typeof action.followed === 'boolean') payload.followed = action.followed;
  if (typeof action.saved === 'boolean') payload.saved = action.saved;
  if (typeof action.hidden === 'boolean') payload.hidden = action.hidden;
  if (typeof action.translated === 'boolean') payload.translated = action.translated;

  await setDoc(docRef, payload, { merge: true });
}

export async function getUserPostActionsForCommunity(userId: string, communityId: string): Promise<PostAction[]> {
  if (!userId || !communityId) return [];
  const q = query(
    collection(db, 'users', userId, 'postActions'),
    where('communityId', '==', communityId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as PostAction;
    return {
      ...data,
      id: d.id,
      userId: data.userId || userId,
      communityId: data.communityId || communityId,
      postId: data.postId || d.id
    };
  });
}

export function subscribeToUserPostActions(
  userId: string,
  communityId: string,
  callback: (actions: Record<string, PostAction>) => void
): Unsubscribe {
  if (!userId || !communityId) {
    return () => {};
  }

  const q = query(
    collection(db, 'users', userId, 'postActions'),
    where('communityId', '==', communityId)
  );

  return onSnapshot(q, (snapshot) => {
    const map: Record<string, PostAction> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as PostAction;
      const postId = data.postId || docSnap.id;
      map[postId] = {
        ...data,
        id: docSnap.id,
        postId,
        userId: data.userId || userId,
        communityId: data.communityId || communityId
      };
    });
    callback(map);
  });
}

// Translation helpers
export async function getPostTranslation(postId: string, lang: string): Promise<PostTranslation | null> {
  try {
    const refDoc = doc(db, 'community_posts', postId, 'translations', lang);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return null;
    const data = snap.data() as PostTranslation;
    return { ...data, postId, lang };
  } catch (error) {
    console.error('Error getting translation:', error);
    return null;
  }
}

// Helper function to translate text using MyMemory API (free, no API key needed)
async function translateText(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string> {
  if (!text || text.trim() === '') return text;
  
  // If source and target are the same, return original
  if (sourceLang === targetLang || (sourceLang === 'auto' && targetLang === 'en')) {
    return text;
  }

  // MyMemory has a 500 char limit per request, so we need to chunk long text
  const maxChunkSize = 450;
  
  try {
    // For short text, translate directly
    if (text.length <= maxChunkSize) {
      // MyMemory works better with explicit source language
      const effectiveSourceLang = sourceLang === 'auto' ? 'en' : sourceLang;
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${effectiveSourceLang}|${targetLang}`
      );
      const data = await response.json();

      console.log('Translation API response:', data);

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translated = data.responseData.translatedText;
        // Check if it's actually translated (not an error message)
        if (!translated.includes('MYMEMORY WARNING') && 
            !translated.includes('QUERY LENGTH LIMIT') &&
            translated !== text) {
          return translated;
        }
      }
      
      // If translation failed or returned same text, try Google Translate
      console.log('MyMemory failed or returned same text, trying Google Translate...');
      try {
        return await translateWithLibre(text, targetLang, sourceLang);
      } catch (error) {
        console.error('All translation APIs failed');
        // Return original text as last resort, but caller should check if it changed
        return text;
      }
    }

    // For long text, split into sentences and translate each
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
    // Try alternative API
    return await translateWithLibre(text, targetLang, sourceLang);
  }
}

// Alternative translation using Google Translate (unofficial API)
async function translateWithLibre(text: string, targetLang: string, sourceLang: string = 'auto'): Promise<string> {
  try {
    // Use Google Translate's unofficial API endpoint
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang === 'auto' ? 'auto' : sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Google Translate response:', data);
      
      // Google returns array format: [[["translated text","original text",null,null,1]],null,"en"]
      if (data && Array.isArray(data) && data[0] && Array.isArray(data[0])) {
        let translatedText = '';
        for (const item of data[0]) {
          if (Array.isArray(item) && item[0]) {
            translatedText += item[0];
          }
        }
        
        if (translatedText && translatedText.trim() !== '' && translatedText !== text) {
          console.log(`Translation successful: "${text}" -> "${translatedText}"`);
          return translatedText;
        } else {
          console.warn('Google Translate returned same or empty text');
        }
      }
    } else {
      console.warn('Google Translate API error:', response.status, response.statusText);
    }
  } catch (error) {
    console.warn('Google Translate failed:', error);
  }

  // Last resort: return original text (caller should check if it changed)
  console.warn('All translation APIs failed, returning original text');
  return text;
}

export async function translatePostContent(
  postId: string,
  targetLang: string,
  payload: { title?: string; content?: string }
): Promise<PostTranslation> {
  // Check cache first - but only use if translation is different from original
  const cached = await getPostTranslation(postId, targetLang);
  if (cached && !cached.isFallback) {
    // Verify cached translation is actually different from original
    const titleChanged = !payload.title || cached.title !== payload.title;
    const contentChanged = !payload.content || cached.content !== payload.content;
    if (titleChanged || contentChanged) {
      return cached;
    }
    // If cached is same as original, re-translate
    console.log('Cached translation same as original, re-translating...');
  }

  try {
    // First try using Firebase Cloud Function for translation (if available)
    try {
      const translateFn = httpsCallable(functions, 'translatePost');
      const result = await translateFn({
        postId,
        targetLang,
        title: payload.title || '',
        content: payload.content || ''
      });
      const translated = result.data as { title?: string; content?: string };

      const refDoc = doc(db, 'community_posts', postId, 'translations', targetLang);
      const record: PostTranslation = {
        postId,
        lang: targetLang,
        title: translated.title || '',
        content: translated.content || '',
        createdAt: serverTimestamp() as any
      };
      await setDoc(refDoc, record);
      return { ...record, createdAt: new Date() };
    } catch (cloudFunctionError: any) {
      // If Cloud Function doesn't exist or fails, use free API fallback
      console.log('Cloud Function not available, using free translation API...');
    }

    // Fallback: Use free MyMemory Translation API
    const translatedTitle = payload.title ? await translateText(payload.title, targetLang) : '';
    const translatedContent = payload.content ? await translateText(payload.content, targetLang) : '';

    // Verify that translation actually changed the text
    const titleTranslated = !payload.title || (translatedTitle && translatedTitle !== payload.title && translatedTitle.trim() !== '');
    const contentTranslated = !payload.content || (translatedContent && translatedContent !== payload.content && translatedContent.trim() !== '');

    // Only proceed if at least one part was actually translated
    if (!titleTranslated && !contentTranslated) {
      console.error('Translation failed: API returned original text');
      throw new Error('Translation service returned original text. Please try again.');
    }

    const record: PostTranslation = {
      postId,
      lang: targetLang,
      title: translatedTitle || payload.title || '',
      content: translatedContent || payload.content || '',
      createdAt: new Date()
    };

    // Cache the translation
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

export async function reportPost(
  communityId: string,
  postId: string,
  reporterId: string,
  reason: string
) {
  if (!communityId || !postId || !reporterId || !reason) {
    throw new Error('communityId, postId, reporterId and reason are required');
  }

  const reportsRef = collection(db, 'communities', communityId, 'postReports');
  const existing = await getDocs(
    query(
      reportsRef,
      where('postId', '==', postId),
      where('reporterId', '==', reporterId)
    )
  );

  if (!existing.empty) {
    throw new Error('You have already reported this post.');
  }

  const payload: PostReport = {
    communityId,
    postId,
    reporterId,
    reason,
    status: 'pending',
    createdAt: serverTimestamp() as any
  };

  const docRef = await addDoc(reportsRef, payload as any);
  return docRef.id;
}

// Get all communities
export async function getAllCommunities(limitCount: number = 50): Promise<Community[]> {
  try {
    const q = query(
      collection(db, 'communities'),
      orderBy('memberCount', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Community));
  } catch (error) {
    console.error('Error fetching communities:', error);
    return [];
  }
}

// Get popular communities
export async function getPopularCommunities(limitCount: number = 20): Promise<Community[]> {
  try {
    const q = query(
      collection(db, 'communities'),
      orderBy('memberCount', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Community));
  } catch (error) {
    console.error('Error fetching popular communities:', error);
    return [];
  }
}

// Join a community
export async function joinCommunity(communityId: string, userId: string, notificationPreference: 'all' | 'popular' | 'off' | 'mute' = 'all'): Promise<void> {
  try {
    const membershipRef = doc(db, 'community_members', `${communityId}_${userId}`);
    const membershipSnap = await getDoc(membershipRef);

    if (!membershipSnap.exists()) {
      await setDoc(membershipRef, {
        communityId,
        userId,
        joinedAt: serverTimestamp(),
        notificationPreference: notificationPreference,
        leftAt: null
      });

      // Increment member count
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        memberCount: increment(1),
        updatedAt: serverTimestamp()
      });
    } else {
      // If membership exists but user left, rejoin
      const membershipData = membershipSnap.data();
      if (membershipData.leftAt) {
        await updateDoc(membershipRef, {
          leftAt: null,
          notificationPreference: notificationPreference,
          joinedAt: serverTimestamp()
        });

        // Increment member count
        const communityRef = doc(db, 'communities', communityId);
        await updateDoc(communityRef, {
          memberCount: increment(1),
          updatedAt: serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error joining community:', error);
    throw error;
  }
}

// Get community membership with notification preference
export async function getCommunityMembership(communityId: string, userId: string): Promise<{
  isMember: boolean;
  notificationPreference: 'all' | 'popular' | 'off' | 'mute' | null;
} | null> {
  try {
    const membershipRef = doc(db, 'community_members', `${communityId}_${userId}`);
    const membershipSnap = await getDoc(membershipRef);

    if (!membershipSnap.exists()) {
      return { isMember: false, notificationPreference: null };
    }

    const data = membershipSnap.data();
    return {
      isMember: !data.leftAt,
      notificationPreference: data.notificationPreference || 'all'
    };
  } catch (error) {
    console.error('Error getting community membership:', error);
    return null;
  }
}

// Update notification preference for a community
export async function updateNotificationPreference(
  communityId: string,
  userId: string,
  preference: 'all' | 'popular' | 'off' | 'mute'
): Promise<void> {
  try {
    const membershipRef = doc(db, 'community_members', `${communityId}_${userId}`);
    const membershipSnap = await getDoc(membershipRef);

    if (!membershipSnap.exists()) {
      throw new Error('User is not a member of this community');
    }

    await updateDoc(membershipRef, {
      notificationPreference: preference
    });
  } catch (error) {
    console.error('Error updating notification preference:', error);
    throw error;
  }
}

// Leave a community
export async function leaveCommunity(communityId: string, userId: string): Promise<void> {
  try {
    const membershipRef = doc(db, 'community_members', `${communityId}_${userId}`);
    const membershipSnap = await getDoc(membershipRef);

    if (membershipSnap.exists()) {
      await updateDoc(membershipRef, {
        leftAt: serverTimestamp()
      });

      // Decrement member count
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        memberCount: increment(-1),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error leaving community:', error);
    throw error;
  }
}

// Check if user is member of community
export async function isCommunityMember(communityId: string, userId: string): Promise<boolean> {
  try {
    const membershipRef = doc(db, 'community_members', `${communityId}_${userId}`);
    const membershipSnap = await getDoc(membershipRef);
    return membershipSnap.exists() && !membershipSnap.data().leftAt;
  } catch (error) {
    console.error('Error checking membership:', error);
    return false;
  }
}

// Get user's communities (communities they've joined)
export async function getUserCommunities(userId: string): Promise<Community[]> {
  try {
    const q = query(
      collection(db, 'community_members'),
      where('userId', '==', userId),
      where('leftAt', '==', null)
    );

    const querySnapshot = await getDocs(q);
    const communityIds = querySnapshot.docs
      .map(doc => doc.data().communityId)
      .filter(Boolean);

    if (communityIds.length === 0) return [];

    // Fetch community details
    const communities: Community[] = [];
    for (const communityId of communityIds) {
      const community = await getCommunityById(communityId);
      if (community) communities.push(community);
    }

    return communities;
  } catch (error) {
    console.error('Error fetching user communities:', error);
    return [];
  }
}

// Get communities created by a user
export async function getCommunitiesByCreator(userId: string, limitCount: number = 20): Promise<Community[]> {
  try {
    const q = query(
      collection(db, 'communities'),
      where('creatorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Community));
  } catch (error) {
    console.error('Error fetching communities by creator:', error);
    return [];
  }
}

// Delete a community (only by creator)
export async function deleteCommunity(communityId: string, userId: string): Promise<void> {
  try {
    const communityRef = doc(db, 'communities', communityId);
    const communitySnap = await getDoc(communityRef);

    if (!communitySnap.exists()) {
      throw new Error('Community not found');
    }

    const communityData = communitySnap.data() as Community;
    if (communityData.creatorId !== userId) {
      throw new Error('Only the creator can delete this community');
    }

    // Delete community image from storage if exists
    if (communityData.imageUrl) {
      try {
        // Extract path from URL
          const urlParts = communityData.imageUrl.split('/');
          const pathIndex = urlParts.findIndex((part: string) => part === 'o');
        if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
          const encodedPath = urlParts[pathIndex + 1].split('?')[0];
          const decodedPath = decodeURIComponent(encodedPath);
          const imageRef = ref(storage, decodedPath);
          await deleteObject(imageRef);
        }
      } catch (storageError) {
        console.warn('Failed to delete community image from storage:', storageError);
        // Continue with community deletion even if image deletion fails
      }
    }

    // Delete all posts in this community
    const postsQuery = query(
      collection(db, 'community_posts'),
      where('communityId', '==', communityId)
    );
    const postsSnapshot = await getDocs(postsQuery);
    const deletePostPromises = postsSnapshot.docs.map(async (postDoc) => {
      const postData = postDoc.data();
      // Delete post image if exists
      if (postData.imageUrl) {
        try {
          const urlParts = postData.imageUrl.split('/');
          const pathIndex = urlParts.findIndex((part: string) => part === 'o');
          if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
            const encodedPath = urlParts[pathIndex + 1].split('?')[0];
            const decodedPath = decodeURIComponent(encodedPath);
            const imageRef = ref(storage, decodedPath);
            await deleteObject(imageRef);
          }
        } catch (storageError) {
          console.warn('Failed to delete post image:', storageError);
        }
      }
      return deleteDoc(doc(db, 'community_posts', postDoc.id));
    });
    await Promise.all(deletePostPromises);

    // Delete all community memberships
    const membersQuery = query(
      collection(db, 'community_members'),
      where('communityId', '==', communityId)
    );
    const membersSnapshot = await getDocs(membersQuery);
    const deleteMemberPromises = membersSnapshot.docs.map(memberDoc =>
      deleteDoc(doc(db, 'community_members', memberDoc.id))
    );
    await Promise.all(deleteMemberPromises);

    // Finally delete the community
    await deleteDoc(communityRef);
  } catch (error) {
    console.error('Error deleting community:', error);
    throw error;
  }
}

// Delete a post (by author or community creator)
export async function deletePost(postId: string, userId: string): Promise<void> {
  try {
    const postRef = doc(db, 'community_posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }

    const postData = postSnap.data() as CommunityPost;
    
    // Check if user is the post author
    const isAuthor = postData.authorId === userId;
    
    // Check if user is the community creator (if post belongs to a community)
    let isCommunityCreator = false;
    if (postData.communityId) {
      const communityRef = doc(db, 'communities', postData.communityId);
      const communitySnap = await getDoc(communityRef);
      if (communitySnap.exists()) {
        const communityData = communitySnap.data() as Community;
        isCommunityCreator = communityData.creatorId === userId;
      }
    }
    
    if (!isAuthor && !isCommunityCreator) {
      throw new Error('Only the author or community creator can delete this post');
    }

    // Delete the post document FIRST so it disappears from UI immediately via real-time subscription
    // This provides instant feedback to users (Reddit-like behavior)
    await deleteDoc(postRef);
    console.log(`Post ${postId} deleted from Firestore - UI will update immediately`);

    // Delete associated data in parallel (non-blocking for UI)
    const cleanupPromises: Promise<void>[] = [];

    // Delete post image from storage if exists
    if (postData.imageUrl) {
      cleanupPromises.push(
        (async () => {
          try {
            const urlParts = postData.imageUrl!.split('/');
            const pathIndex = urlParts.findIndex((part: string) => part === 'o');
            if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
              const encodedPath = urlParts[pathIndex + 1].split('?')[0];
              const decodedPath = decodeURIComponent(encodedPath);
              const imageRef = ref(storage, decodedPath);
              await deleteObject(imageRef);
              console.log(`Deleted post image from storage`);
            }
          } catch (storageError) {
            console.warn('Failed to delete post image from storage:', storageError);
          }
        })()
      );
    }

    // Delete all comments for this post
    cleanupPromises.push(
      (async () => {
        try {
          const commentsQuery = query(
            collection(db, 'comments'),
            where('postId', '==', postId)
          );
          const commentsSnapshot = await getDocs(commentsQuery);
          if (commentsSnapshot.docs.length > 0) {
            const deleteCommentPromises = commentsSnapshot.docs.map(commentDoc =>
              deleteDoc(doc(db, 'comments', commentDoc.id))
            );
            await Promise.all(deleteCommentPromises);
            console.log(`Deleted ${commentsSnapshot.docs.length} comments for post ${postId}`);
          }
        } catch (error) {
          console.warn('Failed to delete comments:', error);
        }
      })()
    );

    // Delete all votes for this post
    cleanupPromises.push(
      (async () => {
        try {
          const votesQuery = query(
            collection(db, 'votes'),
            where('postId', '==', postId)
          );
          const votesSnapshot = await getDocs(votesQuery);
          if (votesSnapshot.docs.length > 0) {
            const deleteVotePromises = votesSnapshot.docs.map(voteDoc =>
              deleteDoc(doc(db, 'votes', voteDoc.id))
            );
            await Promise.all(deleteVotePromises);
            console.log(`Deleted ${votesSnapshot.docs.length} votes for post ${postId}`);
          }
        } catch (error) {
          console.warn('Failed to delete votes:', error);
        }
      })()
    );

    // Decrement post count in community
    if (postData.communityId) {
      cleanupPromises.push(
        (async () => {
          try {
            const communityRef = doc(db, 'communities', postData.communityId!);
            await updateDoc(communityRef, {
              postCount: increment(-1),
              updatedAt: serverTimestamp()
            });
            console.log(`Decremented post count for community ${postData.communityId}`);
          } catch (communityError) {
            console.warn('Failed to decrement community post count:', communityError);
          }
        })()
      );
    }

    // Run cleanup in parallel (don't wait, let it complete in background)
    Promise.all(cleanupPromises).catch(error => {
      console.error('Error during post cleanup:', error);
    });
    
    console.log(`Post ${postId} successfully deleted - cleanup running in background`);
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

// Get posts by community (sorted by creation date - for "New")
export async function getPostsByCommunity(
  communityId: string,
  limitCount: number = 50
): Promise<CommunityPost[]> {
  try {
    const q = query(
      collection(db, 'community_posts'),
      where('communityId', '==', communityId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
  } catch (error) {
    console.error('Error fetching community posts:', error);
    return [];
  }
}

// Get hot posts by community (sorted by hotScore)
export async function getHotPostsByCommunity(
  communityId: string,
  limitCount: number = 50
): Promise<CommunityPost[]> {
  try {
    const q = query(
      collection(db, 'community_posts'),
      where('communityId', '==', communityId),
      orderBy('hotScore', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
  } catch (error) {
    console.error('Error fetching hot community posts:', error);
    // Fallback to regular query if hotScore index doesn't exist
    return getPostsByCommunity(communityId, limitCount);
  }
}

// Get top posts by community (sorted by score: upvotes - downvotes)
export async function getTopPostsByCommunity(
  communityId: string,
  limitCount: number = 50
): Promise<CommunityPost[]> {
  try {
    const q = query(
      collection(db, 'community_posts'),
      where('communityId', '==', communityId),
      orderBy('upvotes', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
  } catch (error) {
    console.error('Error fetching top community posts:', error);
    // Fallback to regular query if upvotes index doesn't exist
    return getPostsByCommunity(communityId, limitCount);
  }
}

/**
 * Calculate Reddit's "Best" confidence score
 * Uses Wilson score confidence interval for a Bernoulli parameter
 * Formula: (p + z²/2n ± z√((p(1-p) + z²/4n)/n)) / (1 + z²/n)
 * Where p = upvotes / (upvotes + downvotes), z = 1.96 (95% confidence)
 */
function calculateBestScore(upvotes: number, downvotes: number): number {
  const n = upvotes + downvotes;
  if (n === 0) return 0;
  
  const z = 1.96; // 95% confidence
  const p = upvotes / n;
  
  const denominator = 1 + (z * z) / n;
  const numerator = p + (z * z) / (2 * n);
  const sqrtPart = z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n);
  
  // Lower bound of confidence interval
  return (numerator - sqrtPart) / denominator;
}

// Get best posts by community (sorted by Reddit's confidence score)
export async function getBestPostsByCommunity(
  communityId: string,
  limitCount: number = 50
): Promise<CommunityPost[]> {
  try {
    // Get all posts and sort by confidence score
    const q = query(
      collection(db, 'community_posts'),
      where('communityId', '==', communityId),
      limit(limitCount * 2) // Get more to sort properly
    );

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
    
    // Sort by confidence score (Reddit's "Best" algorithm)
    posts.sort((a, b) => {
      const scoreA = calculateBestScore(a.upvotes || 0, a.downvotes || 0);
      const scoreB = calculateBestScore(b.upvotes || 0, b.downvotes || 0);
      return scoreB - scoreA;
    });
    
    return posts.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching best community posts:', error);
    return getPostsByCommunity(communityId, limitCount);
  }
}

// Subscribe to real-time updates for community posts
export function subscribeToCommunityPosts(
  communityId: string,
  callback: (posts: CommunityPost[]) => void,
  limitCount: number = 50,
  sortBy: 'new' | 'hot' | 'top' | 'best' = 'new'
): Unsubscribe {
  try {
    let q;
    
    switch (sortBy) {
      case 'hot':
        q = query(
          collection(db, 'community_posts'),
          where('communityId', '==', communityId),
          orderBy('hotScore', 'desc'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
        break;
      case 'top':
        q = query(
          collection(db, 'community_posts'),
          where('communityId', '==', communityId),
          orderBy('upvotes', 'desc'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
        break;
      case 'new':
      default:
        q = query(
          collection(db, 'community_posts'),
          where('communityId', '==', communityId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
        break;
    }

    return onSnapshot(q, (snapshot) => {
      let posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CommunityPost));
      
      // For "best" sorting, we need to sort by confidence score client-side
      if (sortBy === 'best') {
        posts.sort((a, b) => {
          const scoreA = calculateBestScore(a.upvotes || 0, a.downvotes || 0);
          const scoreB = calculateBestScore(b.upvotes || 0, b.downvotes || 0);
          return scoreB - scoreA;
        });
      }
      
      callback(posts);
    }, (error) => {
      console.error('Error in community posts subscription:', error);
      // Fallback to basic query if index doesn't exist
      if (sortBy !== 'new') {
        const fallbackQ = query(
          collection(db, 'community_posts'),
          where('communityId', '==', communityId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
        return onSnapshot(fallbackQ, (snapshot) => {
          const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as CommunityPost));
          callback(posts);
        });
      }
      callback([]);
    });
  } catch (error) {
    console.error('Error setting up community posts subscription:', error);
    return () => {}; // Return empty unsubscribe function
  }
}

// Share recycling stats as a post
export async function shareRecyclingStats(
  userId: string,
  userName: string,
  userPhotoUrl: string | null,
  stats: {
    totalItems: number;
    co2Saved: number;
    categories: Record<string, { count: number }>;
  }
): Promise<string> {
  const categoryBreakdown = Object.entries(stats.categories)
    .filter(([_, data]) => data.count > 0)
    .map(([category, data]) => `${category}: ${data.count}`)
    .join(', ');
  
  const postData: Omit<CommunityPost, 'id' | 'authorId' | 'authorName' | 'authorPhotoUrl' | 'upvotes' | 'downvotes' | 'commentCount' | 'createdAt' | 'updatedAt'> = {
    title: `🎉 I've recycled ${stats.totalItems} items and saved ${stats.co2Saved.toFixed(1)} kg of CO₂!`,
    content: `I'm excited to share my recycling progress!\n\n**My Stats:**\n- Total Items Recycled: ${stats.totalItems}\n- CO₂ Saved: ${stats.co2Saved.toFixed(1)} kg\n- Category Breakdown: ${categoryBreakdown}\n\nLet's keep making a difference together! 🌱♻️`,
    category: 'Other', // Default category for stats posts
    isTip: false,
    tags: ['stats', 'achievement', 'recycling']
  };
  
  return createPost(userId, userName, userPhotoUrl, postData);
}

// ========== NOTIFICATION FUNCTIONS ==========

// Notify all members of a community about a new post
async function notifyCommunityMembers(
  communityId: string,
  postId: string,
  postTitle: string,
  authorName: string,
  authorId: string
): Promise<void> {
  try {
    // Get all community members
    const membersQuery = query(
      collection(db, 'community_members'),
      where('communityId', '==', communityId),
      where('leftAt', '==', null)
    );
    const membersSnapshot = await getDocs(membersQuery);

    // Get community name
    const communityRef = doc(db, 'communities', communityId);
    const communitySnap = await getDoc(communityRef);
    const communityName = communitySnap.exists() ? communitySnap.data().name : 'Community';

    // Get post data to check if it's popular (need to check after creation)
    // For now, we'll send notifications and filter by preference
    const postRef = doc(db, 'community_posts', postId);
    const postSnap = await getDoc(postRef);
    const postData = postSnap.exists() ? postSnap.data() : null;
    const postScore = postData ? ((postData.upvotes || 0) - (postData.downvotes || 0)) : 0;
    const isPopular = postScore >= 5; // Consider posts with 5+ net upvotes as popular

    // Create notifications for all members (except the post author)
    const notifications: Array<{
      userId: string;
      type: 'new_post';
      communityId: string;
      postId: string;
      title: string;
      message: string;
      read: boolean;
      createdAt: any;
    }> = [];
    membersSnapshot.docs.forEach((memberDoc) => {
      const memberData = memberDoc.data();
      const memberId = memberData.userId;
      const notificationPreference = memberData.notificationPreference || 'all';
      
      // Don't notify the post author
      if (memberId === authorId) return;
      
      // Check notification preferences
      if (notificationPreference === 'mute' || notificationPreference === 'off') {
        return; // Don't send notification
      }
      
      if (notificationPreference === 'popular' && !isPopular) {
        return; // Only send if post is popular (we'll check this later, but for now send all)
      }
      
      // Send notification for 'all' or 'popular' (if post becomes popular later)
      notifications.push({
        userId: memberId,
        type: 'new_post' as const,
        communityId,
        postId,
        title: `New post in r/${communityName}`,
        message: `${authorName} posted: ${postTitle}`,
        read: false,
        createdAt: serverTimestamp()
      });
    });

    // Batch create notifications (Firestore allows up to 500 operations per batch)
    const batchSize = 500;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      await Promise.all(
        batch.map((notification) => addDoc(collection(db, 'notifications'), notification))
      );
    }
  } catch (error) {
    console.error('Error notifying community members:', error);
    throw error;
  }
}

// Get user notifications
export async function getUserNotifications(userId: string, limitCount: number = 20): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const batch = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );

    await Promise.all(batch);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// Subscribe to real-time notifications
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
    callback(notifications);
  });
}

// ========== ACHIEVEMENT SYSTEM ==========

/**
 * Get user statistics for a specific community
 */
export async function getUserCommunityStats(
  userId: string,
  communityId: string
): Promise<UserCommunityStats> {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get user's posts in this community
    const postsQuery = query(
      collection(db, 'community_posts'),
      where('communityId', '==', communityId),
      where('authorId', '==', userId)
    );
    const postsSnapshot = await getDocs(postsQuery);
    
    let postCount = 0;
    let upvotesReceived = 0;
    let lastActive: Date | null = null;

    postsSnapshot.forEach((doc) => {
      postCount++;
      const data = doc.data();
      upvotesReceived += (data.upvotes || 0);
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      if (!lastActive || createdAt > lastActive) {
        lastActive = createdAt;
      }
    });

    // Get user's comments in this community (comments on posts in this community)
    const postsIds = postsSnapshot.docs.map(doc => doc.id);
    
    // Also get comments on all posts in the community
    const allPostsQuery = query(
      collection(db, 'community_posts'),
      where('communityId', '==', communityId)
    );
    const allPostsSnapshot = await getDocs(allPostsQuery);
    const allPostIds = allPostsSnapshot.docs.map(doc => doc.id);

    let commentCount = 0;
    for (const postId of allPostIds) {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        where('authorId', '==', userId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      commentCount += commentsSnapshot.size;
      
      commentsSnapshot.forEach((doc) => {
        const data = doc.data();
        upvotesReceived += (data.upvotes || 0);
        const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
        if (!lastActive || createdAt > lastActive) {
          lastActive = createdAt;
        }
      });
    }

    // Get membership date
    const membershipRef = doc(db, 'community_members', `${communityId}_${userId}`);
    const membershipSnap = await getDoc(membershipRef);
    const memberSince = membershipSnap.exists() && membershipSnap.data().joinedAt
      ? membershipSnap.data().joinedAt.toDate()
      : new Date();

    return {
      userId,
      communityId,
      postCount,
      commentCount,
      totalContributions: postCount + commentCount,
      upvotesReceived,
      memberSince,
      lastActive: lastActive || memberSince
    };
  } catch (error) {
    console.error('Error getting user community stats:', error);
    return {
      userId,
      communityId,
      postCount: 0,
      commentCount: 0,
      totalContributions: 0,
      upvotesReceived: 0,
      memberSince: new Date(),
      lastActive: new Date()
    };
  }
}

/**
 * Get all user statistics for a community (for ranking)
 */
async function getAllUsersCommunityStats(
  communityId: string
): Promise<UserCommunityStats[]> {
  try {
    // Get all members
    const membersQuery = query(
      collection(db, 'community_members'),
      where('communityId', '==', communityId),
      where('leftAt', '==', null)
    );
    const membersSnapshot = await getDocs(membersQuery);
    
    const statsPromises = membersSnapshot.docs.map(doc => {
      const membershipData = doc.data();
      return getUserCommunityStats(membershipData.userId, communityId);
    });

    return await Promise.all(statsPromises);
  } catch (error) {
    console.error('Error getting all users community stats:', error);
    return [];
  }
}

/**
 * Achievement definitions
 */
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    type: 'top_25_poster',
    name: 'Top 25% Poster',
    description: 'In the top 25% of posters in this community',
    icon: '📝',
    color: '#EF4444',
    requirement: (stats, allStats) => {
      if (stats.postCount === 0) return false;
      const sorted = [...allStats].sort((a, b) => b.postCount - a.postCount);
      const index = sorted.findIndex(s => s.userId === stats.userId);
      const percentile = (1 - (index + 1) / sorted.length) * 100;
      return percentile >= 75; // Top 25%
    }
  },
  {
    type: 'top_10_poster',
    name: 'Top 10% Poster',
    description: 'In the top 10% of posters in this community',
    icon: '✍️',
    color: '#F97316',
    requirement: (stats, allStats) => {
      if (stats.postCount === 0) return false;
      const sorted = [...allStats].sort((a, b) => b.postCount - a.postCount);
      const index = sorted.findIndex(s => s.userId === stats.userId);
      const percentile = (1 - (index + 1) / sorted.length) * 100;
      return percentile >= 90; // Top 10%
    }
  },
  {
    type: 'top_5_poster',
    name: 'Top 5% Poster',
    description: 'In the top 5% of posters in this community',
    icon: '📄',
    color: '#F59E0B',
    requirement: (stats, allStats) => {
      if (stats.postCount === 0) return false;
      const sorted = [...allStats].sort((a, b) => b.postCount - a.postCount);
      const index = sorted.findIndex(s => s.userId === stats.userId);
      const percentile = (1 - (index + 1) / sorted.length) * 100;
      return percentile >= 95; // Top 5%
    }
  },
  {
    type: 'top_1_poster',
    name: 'Top 1% Poster',
    description: 'In the top 1% of posters in this community',
    icon: '🏆',
    color: '#EAB308',
    requirement: (stats, allStats) => {
      if (stats.postCount === 0) return false;
      const sorted = [...allStats].sort((a, b) => b.postCount - a.postCount);
      const index = sorted.findIndex(s => s.userId === stats.userId);
      const percentile = (1 - (index + 1) / sorted.length) * 100;
      return percentile >= 99; // Top 1%
    }
  },
  {
    type: 'top_25_commenter',
    name: 'Top 25% Commenter',
    description: 'In the top 25% of commenters in this community',
    icon: '💭',
    color: '#8B5CF6',
    requirement: (stats, allStats) => {
      if (stats.commentCount === 0) return false;
      const sorted = [...allStats].sort((a, b) => b.commentCount - a.commentCount);
      const index = sorted.findIndex(s => s.userId === stats.userId);
      const percentile = (1 - (index + 1) / sorted.length) * 100;
      return percentile >= 75;
    }
  },
  {
    type: 'top_10_commenter',
    name: 'Top 10% Commenter',
    description: 'In the top 10% of commenters in this community',
    icon: '💡',
    color: '#A855F7',
    requirement: (stats, allStats) => {
      if (stats.commentCount === 0) return false;
      const sorted = [...allStats].sort((a, b) => b.commentCount - a.commentCount);
      const index = sorted.findIndex(s => s.userId === stats.userId);
      const percentile = (1 - (index + 1) / sorted.length) * 100;
      return percentile >= 90;
    }
  },
  {
    type: 'top_5_commenter',
    name: 'Top 5% Commenter',
    description: 'In the top 5% of commenters in this community',
    icon: '🎯',
    color: '#C084FC',
    requirement: (stats, allStats) => {
      if (stats.commentCount === 0) return false;
      const sorted = [...allStats].sort((a, b) => b.commentCount - a.commentCount);
      const index = sorted.findIndex(s => s.userId === stats.userId);
      const percentile = (1 - (index + 1) / sorted.length) * 100;
      return percentile >= 95;
    }
  },
  {
    type: 'top_1_commenter',
    name: 'Top 1% Commenter',
    description: 'In the top 1% of commenters in this community',
    icon: '💎',
    color: '#DDD6FE',
    requirement: (stats, allStats) => {
      if (stats.commentCount === 0) return false;
      const sorted = [...allStats].sort((a, b) => b.commentCount - a.commentCount);
      const index = sorted.findIndex(s => s.userId === stats.userId);
      const percentile = (1 - (index + 1) / sorted.length) * 100;
      return percentile >= 99;
    }
  },
  {
    type: 'picasso',
    name: 'Picasso',
    description: 'Top contributor (posts + comments combined)',
    icon: '🎨',
    color: '#10B981',
    requirement: (stats, allStats) => {
      if (stats.totalContributions === 0) return false;
      const sorted = [...allStats].sort((a, b) => b.totalContributions - a.totalContributions);
      const index = sorted.findIndex(s => s.userId === stats.userId);
      return index < 10; // Top 10 contributors
    }
  },
  {
    type: 'rising_star',
    name: 'Rising Star',
    description: 'New member who is very active',
    icon: '⭐',
    color: '#FBBF24',
    requirement: (stats, allStats) => {
      const memberSince = stats.memberSince instanceof Timestamp 
        ? stats.memberSince.toDate() 
        : new Date(stats.memberSince);
      const daysSinceJoin = (new Date().getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceJoin <= 30 && stats.totalContributions >= 10; // Active new member
    }
  },
  {
    type: 'repeat_contributor',
    name: 'Repeat Contributor',
    description: 'Consistent contributor over time',
    icon: '🔄',
    color: '#3B82F6',
    requirement: (stats, allStats) => {
      const memberSince = stats.memberSince instanceof Timestamp 
        ? stats.memberSince.toDate() 
        : new Date(stats.memberSince);
      const daysSinceJoin = (new Date().getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceJoin >= 30 && stats.totalContributions >= 20; // Consistent over time
    }
  },
  {
    type: 'super_contributor',
    name: 'Super Contributor',
    description: 'High total contributions',
    icon: '🌟',
    color: '#EC4899',
    requirement: (stats, allStats) => stats.totalContributions >= 50
  },
  {
    type: 'content_connoisseur',
    name: 'Content Connoisseur',
    description: 'High-quality content creator',
    icon: '📚',
    color: '#6366F1',
    requirement: (stats, allStats) => stats.upvotesReceived >= 100
  },
  {
    type: 'elder',
    name: 'Elder',
    description: 'Long-time community member',
    icon: '🧙',
    color: '#64748B',
    requirement: (stats, allStats) => {
      const memberSince = stats.memberSince instanceof Timestamp 
        ? stats.memberSince.toDate() 
        : new Date(stats.memberSince);
      const daysSinceJoin = (new Date().getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceJoin >= 180; // 6 months+
    }
  }
];

/**
 * Calculate and unlock achievements for a user in a community
 */
export async function calculateUserAchievements(
  userId: string,
  communityId: string
): Promise<CommunityAchievement[]> {
  try {
    const userStats = await getUserCommunityStats(userId, communityId);
    const allStats = await getAllUsersCommunityStats(communityId);

    const unlockedAchievements: CommunityAchievement[] = [];

    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      if (achievement.requirement(userStats, allStats)) {
        // Check if already unlocked
        const achievementRef = doc(
          db, 
          'community_achievements', 
          `${communityId}_${userId}_${achievement.type}`
        );
        const existingSnap = await getDoc(achievementRef);

        if (!existingSnap.exists()) {
          // Unlock new achievement
          const achievementData: CommunityAchievement = {
            id: `${communityId}_${userId}_${achievement.type}`,
            userId,
            communityId,
            achievementType: achievement.type,
            unlockedAt: Timestamp.now()
          };

          await setDoc(achievementRef, {
            ...achievementData,
            unlockedAt: serverTimestamp()
          });

          unlockedAchievements.push(achievementData);
        }
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error('Error calculating achievements:', error);
    return [];
  }
}

/**
 * Get user achievements for a community
 */
export async function getUserCommunityAchievements(
  userId: string,
  communityId: string
): Promise<CommunityAchievement[]> {
  try {
    const q = query(
      collection(db, 'community_achievements'),
      where('userId', '==', userId),
      where('communityId', '==', communityId),
      orderBy('unlockedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityAchievement));
  } catch (error) {
    console.error('Error getting user achievements:', error);
    return [];
  }
}

/**
 * Get achievement definition by type
 */
export function getAchievementDefinition(type: AchievementType): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find(a => a.type === type);
}

/**
 * Calculate weekly stats for a community (last 7 days)
 * Weekly visitors: Unique users who posted, commented, or voted in the last 7 days
 * Weekly contributions: Posts created in the last 7 days + Comments created in the last 7 days (regardless of post age)
 */
export async function calculateWeeklyCommunityStats(communityId: string): Promise<{
  weeklyVisitors: number;
  weeklyContributions: number;
}> {
  try {
    const now = new Date();
    const oneWeekAgo = Timestamp.fromDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));

    const visitorSet = new Set<string>();
    let postCount = 0;
    let commentCount = 0;
    let allPostIds: string[] = []; // Declare here so it's accessible in all scopes

    // Get posts created in the last week for this community
    try {
      const postsQuery = query(
        collection(db, 'community_posts'),
        where('communityId', '==', communityId),
        where('createdAt', '>=', oneWeekAgo)
      );
      const postsSnapshot = await getDocs(postsQuery);
      
      postCount = postsSnapshot.size;
      const weeklyPostIds: string[] = [];
      postsSnapshot.forEach((doc) => {
        const data = doc.data();
        visitorSet.add(data.authorId);
        weeklyPostIds.push(doc.id);
      });
      console.log(`[Weekly Stats] Found ${postCount} posts from last week`);
      
      // Get ALL post IDs for comments/votes queries (we need all posts, not just weekly ones)
      const allPostsQuery = query(
        collection(db, 'community_posts'),
        where('communityId', '==', communityId)
      );
      const allPostsSnapshot = await getDocs(allPostsQuery);
      allPostIds = allPostsSnapshot.docs.map(doc => doc.id);
    } catch (postsError) {
      console.error('[Weekly Stats] Error querying posts:', postsError);
      // If query fails, try without date filter as fallback
      try {
        const allPostsQuery = query(
          collection(db, 'community_posts'),
          where('communityId', '==', communityId)
        );
        const allPostsSnapshot = await getDocs(allPostsQuery);
        allPostIds = allPostsSnapshot.docs.map(doc => doc.id);
        
        // Filter client-side for posts
        const now = Date.now();
        const oneWeekAgoMs = now - (7 * 24 * 60 * 60 * 1000);
        allPostsSnapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt;
          let postDate: Date | null = null;
          
          if (createdAt?.toDate) {
            postDate = createdAt.toDate();
          } else if (createdAt instanceof Date) {
            postDate = createdAt;
          } else if (createdAt) {
            postDate = new Date(createdAt);
          }
          
          if (postDate && postDate.getTime() >= oneWeekAgoMs) {
            postCount++;
            visitorSet.add(data.authorId);
          }
        });
        console.log(`[Weekly Stats] Fallback: Found ${postCount} posts from last week (client-side filter)`);
      } catch (fallbackError) {
        console.error('[Weekly Stats] Fallback query also failed:', fallbackError);
        allPostIds = [];
      }
    }

    // Get ALL comments created in the last week for posts in this community
    // Try to query by communityId first (more efficient), fallback to postId batches
    try {
      const commentsByCommunityQuery = query(
        collection(db, 'comments'),
        where('communityId', '==', communityId),
        where('createdAt', '>=', oneWeekAgo)
      );
      const commentsByCommunitySnapshot = await getDocs(commentsByCommunityQuery);
      commentCount += commentsByCommunitySnapshot.size;
      commentsByCommunitySnapshot.forEach((doc) => {
        const data = doc.data();
        visitorSet.add(data.authorId);
      });
      console.log(`[Weekly Stats] Found ${commentsByCommunitySnapshot.size} comments via communityId query`);
    } catch (communityIdQueryError) {
      // If communityId query fails (e.g., no index or old comments don't have communityId),
      // fallback to querying by postId batches
      console.warn('[Weekly Stats] Querying comments by communityId failed, falling back to postId batches:', communityIdQueryError);
      if (allPostIds.length > 0) {
        // Firestore 'in' queries are limited to 10 items, so we batch if needed
        const batchSize = 10;
        for (let i = 0; i < allPostIds.length; i += batchSize) {
          const postIdsBatch = allPostIds.slice(i, i + batchSize);
          try {
            const commentsQuery = query(
              collection(db, 'comments'),
              where('postId', 'in', postIdsBatch),
              where('createdAt', '>=', oneWeekAgo)
            );
            const commentsSnapshot = await getDocs(commentsQuery);
            commentCount += commentsSnapshot.size;
            commentsSnapshot.forEach((doc) => {
              const data = doc.data();
              visitorSet.add(data.authorId);
            });
          } catch (postIdQueryError) {
            console.warn(`[Weekly Stats] Error querying comments for post batch ${i}-${i + batchSize}:`, postIdQueryError);
          }
        }
      }
    }

    // Get votes from last week (users who voted on posts in this community)
    if (allPostIds.length > 0) {
      const batchSize = 10;
      for (let i = 0; i < allPostIds.length; i += batchSize) {
        const postIdsBatch = allPostIds.slice(i, i + batchSize);
        const votesQuery = query(
          collection(db, 'votes'),
          where('postId', 'in', postIdsBatch),
          where('createdAt', '>=', oneWeekAgo)
        );
        try {
          const votesSnapshot = await getDocs(votesQuery);
          votesSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.userId) {
              visitorSet.add(data.userId);
            }
          });
          console.log(`[Weekly Stats] Found ${votesSnapshot.size} votes in batch ${i}-${i + batchSize}`);
        } catch (error) {
          // If createdAt field doesn't exist on votes or query fails, skip this batch
          console.warn(`[Weekly Stats] Could not filter votes by createdAt for batch ${i}-${i + batchSize}:`, error);
          // Try querying without createdAt filter as fallback
          try {
            const votesFallbackQuery = query(
              collection(db, 'votes'),
              where('postId', 'in', postIdsBatch)
            );
            const votesFallbackSnapshot = await getDocs(votesFallbackQuery);
            // Filter client-side
            const oneWeekAgoMs = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
            votesFallbackSnapshot.forEach((doc) => {
              const data = doc.data();
              const createdAt = data.createdAt;
              let voteDate: Date | null = null;
              
              if (createdAt?.toDate) {
                voteDate = createdAt.toDate();
              } else if (createdAt instanceof Date) {
                voteDate = createdAt;
              } else if (createdAt) {
                voteDate = new Date(createdAt);
              }
              
              if (voteDate && voteDate.getTime() >= oneWeekAgoMs && data.userId) {
                visitorSet.add(data.userId);
              }
            });
          } catch (fallbackError) {
            console.warn(`[Weekly Stats] Fallback vote query also failed for batch ${i}-${i + batchSize}:`, fallbackError);
          }
        }
      }
    }

    const weeklyVisitors = visitorSet.size;
    // Weekly contributions = posts created this week + comments created this week
    const weeklyContributions = postCount + commentCount;

    console.log(`[Weekly Stats] Community ${communityId}:`, {
      weeklyVisitors,
      weeklyContributions,
      postCount,
      commentCount,
      visitorSetSize: visitorSet.size,
      oneWeekAgo: oneWeekAgo.toDate().toISOString(),
      now: new Date().toISOString()
    });

    // Update community stats
    try {
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        weeklyVisitors,
        weeklyContributions,
        updatedAt: serverTimestamp()
      });
      console.log(`[Weekly Stats] Successfully updated community ${communityId} with stats`);
    } catch (updateError) {
      console.error(`[Weekly Stats] Error updating community document:`, updateError);
      throw updateError; // Re-throw to be caught by outer catch
    }

    return { weeklyVisitors, weeklyContributions };
  } catch (error) {
    console.error('[Weekly Stats] Error calculating weekly stats:', error);
    // Log detailed error info
    if (error instanceof Error) {
      console.error('[Weekly Stats] Error message:', error.message);
      console.error('[Weekly Stats] Error stack:', error.stack);
    }
    // Return zeros on error to avoid breaking the UI
    return { weeklyVisitors: 0, weeklyContributions: 0 };
  }
}





