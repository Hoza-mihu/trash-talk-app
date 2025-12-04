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
  increment,
  Timestamp,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import { WasteCategoryKey } from './stats';

export interface CommunityPost {
  id?: string;
  title: string;
  content: string;
  category: WasteCategoryKey;
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
    const docRef = await addDoc(collection(db, 'community_posts'), {
      ...postData,
      authorId: userId,
      authorName: userName,
      authorPhotoUrl: userPhotoUrl || null,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
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

// Vote on a post
export async function voteOnPost(
  postId: string,
  userId: string,
  voteType: 'upvote' | 'downvote'
): Promise<void> {
  try {
    const postRef = doc(db, 'community_posts', postId);
    
    // Check if user already voted (you might want to track this in a separate collection)
    // For simplicity, we'll just increment/decrement
    await updateDoc(postRef, {
      [voteType === 'upvote' ? 'upvotes' : 'downvotes']: increment(1),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error voting on post:', error);
    throw error;
  }
}

// Add comment to post
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
      createdAt: serverTimestamp()
    });
    
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

// Get comments for a post
export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  try {
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      where('parentId', '==', null), // Only top-level comments
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment));
  } catch (error) {
    console.error('Error fetching comments:', error);
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

