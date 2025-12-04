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
  getDoc as getFirestoreDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { WasteCategoryKey } from './stats';

export interface Community {
  id?: string;
  name: string;
  description: string;
  slug: string; // URL-friendly name (e.g., "plastic-recyclers")
  category?: WasteCategoryKey;
  creatorId: string;
  creatorName: string;
  memberCount: number;
  postCount: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  imageUrl?: string;
  rules?: string[];
  tags?: string[];
}

export interface CommunityPost {
  id?: string;
  title: string;
  content: string;
  category: WasteCategoryKey;
  communityId?: string; // Optional: which community this post belongs to
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  imageUrl?: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  tags?: string[];
  isTip?: boolean; // Whether this is a recycling tip
}

export interface Comment {
  id?: string;
  postId: string;
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
    
    if (!postData.title || !postData.content) {
      throw new Error('Title and content are required');
    }

    if (!postData.category) {
      throw new Error('Category is required');
    }

    // Remove undefined values - Firestore doesn't accept undefined
    const cleanPostData = Object.fromEntries(
      Object.entries(postData).filter(([_, value]) => value !== undefined)
    );

    const postPayload = {
      ...cleanPostData,
      authorId: userId,
      authorName: userName,
      authorPhotoUrl: userPhotoUrl || null,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('Attempting to create post in Firestore:', {
      collection: 'community_posts',
      data: { ...postPayload, createdAt: '[serverTimestamp]', updatedAt: '[serverTimestamp]' }
    });

    const docRef = await addDoc(collection(db, 'community_posts'), postPayload);
    
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

// Get posts by category
export async function getPostsByCategory(
  category: WasteCategoryKey,
  postsLimit: number = 20
): Promise<CommunityPost[]> {
  try {
    const q = query(
      collection(db, 'community_posts'),
      where('category', '==', category),
      orderBy('createdAt', 'desc'),
      limit(postsLimit)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// Get all posts (for main feed)
export async function getAllPosts(postsLimit: number = 50): Promise<CommunityPost[]> {
  try {
    const q = query(
      collection(db, 'community_posts'),
      orderBy('createdAt', 'desc'),
      limit(postsLimit)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// Get popular posts (by upvotes)
export async function getPopularPosts(postsLimit: number = 20): Promise<CommunityPost[]> {
  try {
    const q = query(
      collection(db, 'community_posts'),
      orderBy('upvotes', 'desc'),
      limit(postsLimit)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
  } catch (error) {
    console.error('Error fetching popular posts:', error);
    return [];
  }
}

// Get tips by category (filtered posts where isTip === true)
export async function getTipsByCategory(
  category: WasteCategoryKey,
  tipsLimit: number = 10
): Promise<CommunityPost[]> {
  try {
    const q = query(
      collection(db, 'community_posts'),
      where('category', '==', category),
      where('isTip', '==', true),
      orderBy('upvotes', 'desc'),
      limit(tipsLimit)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
  } catch (error) {
    console.error('Error fetching tips:', error);
    return [];
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
      // Remove vote
      await updateDoc(postRef, {
        [voteType === 'upvote' ? 'upvotes' : 'downvotes']: increment(-1),
        updatedAt: serverTimestamp()
      });
      // Delete vote record
      await updateDoc(voteRef, { type: null });
      return;
    }
    
    // If user voted opposite way, switch the vote
    if (existingVote && existingVote !== voteType) {
      // Remove old vote
      await updateDoc(postRef, {
        [existingVote === 'upvote' ? 'upvotes' : 'downvotes']: increment(-1),
        updatedAt: serverTimestamp()
      });
    }
    
    // Add new vote
    await updateDoc(postRef, {
      [voteType === 'upvote' ? 'upvotes' : 'downvotes']: increment(1),
      updatedAt: serverTimestamp()
    });
    
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
    const commentRef = await addDoc(collection(db, 'comments'), {
      postId,
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
    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      commentCount: increment(1),
      updatedAt: serverTimestamp()
    });
    
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
        }
      } else {
        rootComments.push(commentWithReplies);
      }
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
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error searching posts:', error);
    return [];
  }
}

// Get posts by user
export async function getPostsByUser(userId: string, limitCount: number = 20): Promise<CommunityPost[]> {
  try {
    const q = query(
      collection(db, 'community_posts'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
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

// Upload community image to Firebase Storage
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

// ========== COMMUNITY FUNCTIONS ==========

// Create a new community
export async function createCommunity(
  userId: string,
  userName: string,
  communityData: {
    name: string;
    description: string;
    category?: WasteCategoryKey;
    imageUrl?: string;
    rules?: string[];
    tags?: string[];
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
      imageUrl: communityData.imageUrl || null,
      rules: communityData.rules || [],
      tags: communityData.tags || [],
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
export async function joinCommunity(communityId: string, userId: string): Promise<void> {
  try {
    const membershipRef = doc(db, 'community_members', `${communityId}_${userId}`);
    const membershipSnap = await getDoc(membershipRef);

    if (!membershipSnap.exists()) {
      await setDoc(membershipRef, {
        communityId,
        userId,
        joinedAt: serverTimestamp()
      });

      // Increment member count
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        memberCount: increment(1),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error joining community:', error);
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

// Delete a post (only by author)
export async function deletePost(postId: string, userId: string): Promise<void> {
  try {
    const postRef = doc(db, 'community_posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }

    const postData = postSnap.data() as CommunityPost;
    if (postData.authorId !== userId) {
      throw new Error('Only the author can delete this post');
    }

    // Delete post image from storage if exists
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
        console.warn('Failed to delete post image from storage:', storageError);
        // Continue with post deletion even if image deletion fails
      }
    }

    // Delete all comments for this post
    const commentsQuery = query(
      collection(db, 'comments'),
      where('postId', '==', postId)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    const deleteCommentPromises = commentsSnapshot.docs.map(commentDoc =>
      deleteDoc(doc(db, 'comments', commentDoc.id))
    );
    await Promise.all(deleteCommentPromises);

    // Delete all votes for this post
    const votesQuery = query(
      collection(db, 'votes'),
      where('postId', '==', postId)
    );
    const votesSnapshot = await getDocs(votesQuery);
    const deleteVotePromises = votesSnapshot.docs.map(voteDoc =>
      deleteDoc(doc(db, 'votes', voteDoc.id))
    );
    await Promise.all(deleteVotePromises);

    // Decrement post count in community if post belongs to a community
    if (postData.communityId) {
      const communityRef = doc(db, 'communities', postData.communityId);
      await updateDoc(communityRef, {
        postCount: increment(-1),
        updatedAt: serverTimestamp()
      });
    }

    // Finally delete the post
    await deleteDoc(postRef);
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

// Get posts by community
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

