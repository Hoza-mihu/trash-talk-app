'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, Leaf, Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getPostById, addComment, getCommentsByPostId, voteOnPost, getUserVote, deletePost, Comment } from '@/lib/community';
import { CommunityPost } from '@/lib/community';
import { CATEGORY_COLORS } from '@/lib/stats';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params.id as string;
  
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);

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
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const fetchedComments = await getCommentsByPostId(postId);
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
      await addComment(
        postId,
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL,
        commentText,
        replyingTo || undefined
      );
      setCommentText('');
      setReplyingTo(null);
      await loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyText.trim()) return;

    setSubmitting(true);
    try {
      await addComment(
        postId,
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL,
        replyText,
        parentId
      );
      setReplyText('');
      setReplyingTo(null);
      await loadComments();
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
    if (!user || !post) return;
    
    if (!confirm('Are you sure you want to delete this post? This will also delete all comments. This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await deletePost(postId, user.uid);
      alert('Post deleted successfully!');
      router.push('/community');
    } catch (error: any) {
      console.error('Error deleting post:', error);
      alert(error.message || 'Failed to delete post. Please try again.');
      setDeleting(false);
    }
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isReplying = replyingTo === comment.id;
    
    return (
      <div key={comment.id} className={depth > 0 ? 'ml-8 mt-4 border-l-2 border-gray-200 pl-4' : 'border-b border-gray-200 pb-6 last:border-0'}>
        <div className="flex gap-4">
          {comment.authorPhotoUrl ? (
            <img
              src={comment.authorPhotoUrl}
              alt={comment.authorName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold">
                {comment.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={`/community/user/${comment.authorId}`}
                className="font-semibold text-gray-900 hover:text-green-600 transition-colors"
              >
                u/{comment.authorName}
              </Link>
              <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
            </div>
            <p className="text-gray-700 whitespace-pre-line mb-3">{comment.content}</p>
            
            {user && (
              <button
                onClick={() => setReplyingTo(isReplying ? null : comment.id || null)}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                {isReplying ? 'Cancel' : 'Reply'}
              </button>
            )}
            
            {isReplying && (
              <div className="mt-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-2 !text-black placeholder:text-gray-400"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSubmitReply(comment.id!)}
                    disabled={submitting || !replyText.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Post Reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* Render nested replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50">
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">Eco-Eco</span>
          </Link>
          <Link href="/community" className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Community</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Post */}
        <div className="bg-white rounded-xl p-8 shadow-lg mb-6">
          <div className="flex gap-6">
            {/* Voting */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => handleVote('upvote')}
                className={`transition-colors text-2xl ${
                  userVote === 'upvote' 
                    ? 'text-green-600' 
                    : 'text-gray-400 hover:text-green-600'
                }`}
              >
                ▲
              </button>
              <span className="font-bold text-xl text-gray-900">{post.upvotes - post.downvotes}</span>
              <button
                onClick={() => handleVote('downvote')}
                className={`transition-colors text-2xl ${
                  userVote === 'downvote' 
                    ? 'text-red-600' 
                    : 'text-gray-400 hover:text-red-600'
                }`}
              >
                ▼
              </button>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: CATEGORY_COLORS[post.category] }}
                >
                  {post.category}
                </span>
                {post.isTip && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    💡 Tip
                  </span>
                )}
                <span className="text-sm text-gray-500">Posted {formatDate(post.createdAt)}</span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
              
              {post.imageUrl && (
                <img src={post.imageUrl} alt={post.title} className="w-full rounded-lg mb-4" />
              )}
              
              <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-line mb-6">
                {post.content}
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <Link
                    href={`/community/user/${post.authorId}`}
                    className="hover:text-green-600 transition-colors font-medium"
                  >
                    u/{post.authorName}
                  </Link>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {post.commentCount} comments
                  </span>
                </div>
                {user && post.authorId === user.uid && (
                  <button
                    onClick={handleDeletePost}
                    disabled={deleting}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? 'Deleting...' : 'Delete Post'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-8">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-4 !text-black placeholder:text-gray-400"
                rows={4}
                required
              />
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                  {submitting ? 'Posting...' : replyingTo ? 'Post Reply' : 'Post Comment'}
                </button>
                {replyingTo && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(null);
                      setCommentText('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600 mb-2">Please sign in to comment</p>
              <Link href="/auth" className="text-green-600 hover:text-green-700 font-medium">
                Sign In
              </Link>
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => renderComment(comment))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

