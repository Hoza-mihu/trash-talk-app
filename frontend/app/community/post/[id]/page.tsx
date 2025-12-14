'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, Leaf, Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getPostById, addComment, getCommentsByPostId, voteOnPost, getUserVote, deletePost, getCommunityById, Comment, Community } from '@/lib/community';
import { getUserProfile } from '@/lib/profile';
import { CommunityPost } from '@/lib/community';
import { CATEGORY_COLORS } from '@/lib/stats';
import ShareDropdown from '@/components/ShareDropdown';
import CrosspostModal from '@/components/CrosspostModal';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params.id as string;
  
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  const [showCrosspostModal, setShowCrosspostModal] = useState(false);

  useEffect(() => {
    if (postId) {
      loadPost();
      loadComments();
      if (user) {
        loadUserVote();
      }
    }
  }, [postId, user]);

  const loadUserVote = async () => {
    if (!user) return;
    try {
      const vote = await getUserVote(postId, user.uid);
      setUserVote(vote);
    } catch (error) {
      console.error('Error loading user vote:', error);
    }
  };

  const loadPost = async () => {
    try {
      const fetchedPost = await getPostById(postId);
      setPost(fetchedPost);
      
      // Load community data if post belongs to a community
      if (fetchedPost && fetchedPost.communityId) {
        try {
          const communityData = await getCommunityById(fetchedPost.communityId);
          setCommunity(communityData);
        } catch (error) {
          console.error('Error loading community:', error);
        }
      }
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      console.log('Loading comments for post:', postId);
      const fetchedComments = await getCommentsByPostId(postId);
      console.log('Fetched comments:', fetchedComments);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    setSubmitting(true);
    try {
      // Get user profile for name and photo
      const profile = await getUserProfile(user.uid);
      const userName = profile?.name || user.displayName || 'Anonymous';
      const userPhoto = profile?.photoUrl || user.photoURL;

      await addComment(
        postId,
        user.uid,
        userName,
        userPhoto,
        commentText,
        replyingTo || undefined
      );
      setCommentText('');
      setReplyingTo(null);
      await loadComments();
      await loadPost(); // Reload post to update comment count
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyTexts[parentId]?.trim()) return;

    setSubmitting(true);
    try {
      // Get user profile for name and photo
      const profile = await getUserProfile(user.uid);
      const userName = profile?.name || user.displayName || 'Anonymous';
      const userPhoto = profile?.photoUrl || user.photoURL;

      await addComment(
        postId,
        user.uid,
        userName,
        userPhoto,
        replyTexts[parentId],
        parentId
      );
      // Clear reply text for this specific comment
      setReplyTexts(prev => {
        const newTexts = { ...prev };
        delete newTexts[parentId];
        return newTexts;
      });
      setReplyingTo(null);
      await loadComments();
      await loadPost(); // Reload post to update comment count
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (type: 'upvote' | 'downvote') => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      await voteOnPost(postId, user.uid, type);
      await loadPost(); // Reload to get updated vote counts
      await loadUserVote(); // Reload user's vote status
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!user || !post) {
      alert('You must be logged in to delete posts.');
      return;
    }
    
    // Double check permissions before showing confirm
    const isAuthor = post.authorId === user.uid;
    const isCommunityCreator = community && community.creatorId === user.uid;
    
    if (!isAuthor && !isCommunityCreator) {
      alert('You do not have permission to delete this post. Only the post author or community creator can delete it.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this post? This will also delete all comments. This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      console.log('Attempting to delete post:', postId, 'User:', user.uid, 'Is Author:', isAuthor, 'Is Community Creator:', isCommunityCreator);
      await deletePost(postId, user.uid);
      console.log('Post deletion completed, redirecting...');
      // Redirect to community page or back to community if post was in a community
      if (post?.communityId) {
        router.push(`/community/c/${post.communityId}`);
      } else {
        router.push('/community');
      }
    } catch (error: any) {
      console.error('Error deleting post:', error);
      const errorMessage = error.message || 'Failed to delete post. Please try again.';
      alert(errorMessage);
      setDeleting(false);
    }
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const commentId = comment.id!;
    const isReplying = replyingTo === commentId;
    const maxDepth = 8; // Limit nesting depth
    const replyText = replyTexts[commentId] || '';
    
    return (
      <div 
        key={commentId} 
        className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4 mt-3' : ''} py-3`}
      >
        <div className="flex gap-3">
          {comment.authorPhotoUrl ? (
            <img
              src={comment.authorPhotoUrl}
              alt={comment.authorName}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 font-bold text-xs">
                {comment.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Link
                href={`/community/user/${comment.authorId}`}
                className="text-xs font-semibold text-gray-900 hover:underline"
              >
                u/{comment.authorName}
              </Link>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
            </div>
            <div className="text-gray-900 text-sm whitespace-pre-wrap mb-2 leading-relaxed">
              {comment.content}
            </div>
            
            {user && depth < maxDepth && (
              <button
                onClick={() => {
                  if (isReplying) {
                    setReplyingTo(null);
                    setReplyTexts(prev => {
                      const newTexts = { ...prev };
                      delete newTexts[commentId];
                      return newTexts;
                    });
                  } else {
                    setReplyingTo(commentId);
                    setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
                  }
                }}
                className="text-xs text-gray-500 hover:text-green-600 font-medium transition-colors mr-3"
              >
                {isReplying ? 'Cancel' : 'Reply'}
              </button>
            )}
            
            {isReplying && (
              <div className="mt-3 mb-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyTexts(prev => ({ ...prev, [commentId]: e.target.value }))}
                  placeholder={`Reply to u/${comment.authorName}...`}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 mb-2 !text-black placeholder:text-gray-400 resize-none text-sm"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSubmitReply(commentId)}
                    disabled={submitting || !replyText.trim()}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-full text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Posting...' : 'Reply'}
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyTexts(prev => {
                        const newTexts = { ...prev };
                        delete newTexts[commentId];
                        return newTexts;
                      });
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* Render nested replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map(reply => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const formatDate = (date: any) => {
    if (!date) return 'Recently';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h2>
          <Link href="/community" className="text-green-600 hover:text-green-700 font-medium">
            ← Back to Community
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">Eco-Eco</span>
          </Link>
          <Link href="/community" className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Community</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Post */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
          <div className="flex gap-3 p-3">
            {/* Voting */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <button
                onClick={() => handleVote('upvote')}
                className={`transition-colors text-lg leading-none ${
                  userVote === 'upvote' 
                    ? 'text-green-600' 
                    : 'text-gray-400 hover:text-green-600'
                }`}
              >
                ▲
              </button>
              <span className="font-bold text-xs text-gray-900">{post.upvotes - post.downvotes}</span>
              <button
                onClick={() => handleVote('downvote')}
                className={`transition-colors text-lg leading-none ${
                  userVote === 'downvote' 
                    ? 'text-red-600' 
                    : 'text-gray-400 hover:text-red-600'
                }`}
              >
                ▼
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {post.isTip && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    💡 Tip
                  </span>
                )}
                <Link
                  href={`/community/user/${post.authorId}`}
                  className="text-xs text-gray-500 hover:text-green-600 transition-colors font-medium"
                >
                  u/{post.authorName}
                </Link>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
              </div>
              
              <h1 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h1>
              
              {post.imageUrl && (
                <img src={post.imageUrl} alt={post.title || 'Post image'} className="w-full rounded-md mb-3 max-h-[600px] object-contain" />
              )}
              
              {post.content && (
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line mb-3">
                  {post.content}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1 hover:text-green-600 transition-colors cursor-pointer">
                  <MessageSquare className="w-3 h-3" />
                  {post.commentCount} comments
                </span>
                <ShareDropdown
                  postId={postId}
                  postTitle={post.title || 'Untitled'}
                  postImageUrl={post.imageUrl}
                  onCrosspostClick={() => setShowCrosspostModal(true)}
                />
                {user && (post.authorId === user.uid || (community && community.creatorId === user.uid)) && (
                  <button
                    onClick={handleDeletePost}
                    disabled={deleting}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium disabled:opacity-50 ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                    {deleting ? 'Deleting...' : 'Delete Post'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Crosspost Modal */}
        <CrosspostModal
          isOpen={showCrosspostModal}
          onClose={() => setShowCrosspostModal(false)}
          postId={postId}
          postTitle={post.title || 'Untitled'}
          onSuccess={() => {
            // Optionally refresh or show success message
          }}
        />

        {/* Comments Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">
              Comments ({comments.length})
            </h2>
          </div>

          {/* Comment Form */}
          {user ? (
            <div className="p-4 border-b border-gray-200">
              <form onSubmit={handleSubmitComment}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 mb-3 !text-black placeholder:text-gray-400 resize-none"
                  rows={3}
                  required
                />
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600 mb-2 text-center">Please sign in to comment</p>
              <div className="text-center">
                <Link href="/auth" className="text-sm text-green-600 hover:text-green-700 font-medium">
                  Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div>
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8 px-4">No comments yet. Be the first to comment!</p>
            ) : (
              <div>
                {comments.map((comment, index) => {
                  if (!comment || !comment.id) {
                    console.warn('Invalid comment at index', index, comment);
                    return null;
                  }
                  return (
                    <div key={comment.id} className={index > 0 ? 'border-t border-gray-200' : ''}>
                      <div className="px-4 py-2">
                        {renderComment(comment)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

