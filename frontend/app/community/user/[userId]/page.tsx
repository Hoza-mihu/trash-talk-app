'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Leaf, MessageSquare, FileText, User, TrendingUp, Award, Calendar } from 'lucide-react';
import { getPostsByUser, getCommentsByUser, CommunityPost, Comment } from '@/lib/community';
import { getUserProfile, UserProfile } from '@/lib/profile';
import { useAuth } from '@/context/AuthContext';

type TabType = 'overview' | 'posts' | 'comments';

export default function UserProfilePage() {
  const params = useParams();
  const { user: currentUser } = useAuth();
  const userId = params.userId as string;
  const isOwnProfile = currentUser?.uid === userId;
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [userPosts, userComments, profile] = await Promise.all([
        getPostsByUser(userId, 50),
        getCommentsByUser(userId, 50),
        getUserProfile(userId)
      ]);
      setPosts(userPosts);
      setComments(userComments);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Recently';
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  };

  // Calculate statistics
  const totalKarma = posts.reduce((sum, post) => sum + (post.upvotes - post.downvotes), 0) +
                     comments.reduce((sum, comment) => sum + (comment.upvotes - comment.downvotes), 0);
  const totalContributions = posts.length + comments.length;
  
  // Get user info from profile, fallback to post/comment data, then to defaults
  const userName = userProfile?.name || posts[0]?.authorName || comments[0]?.authorName || 'User';
  const userPhoto = userProfile?.photoUrl || posts[0]?.authorPhotoUrl || comments[0]?.authorPhotoUrl;
  
  // Get account creation date (approximate from oldest post/comment)
  const allDates = [
    ...posts.map(p => p.createdAt),
    ...comments.map(c => c.createdAt)
  ].filter(Boolean);
  const oldestDate = allDates.length > 0 
    ? new Date(Math.min(...allDates.map(d => {
        if (d && typeof d === 'object' && 'toDate' in d) {
          return (d as any).toDate().getTime();
        }
        return new Date(d).getTime();
      })))
    : null;
  const accountAge = oldestDate 
    ? Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading profile...</p>
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
            <span className="text-2xl font-bold text-gray-900">Eco-Eco Community</span>
          </Link>
          <Link href="/community" className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Community</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-6 mb-6">
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={userName}
                    className="w-20 h-20 rounded-full border-4 border-green-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center border-4 border-green-200">
                    <span className="text-3xl font-bold text-white">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{userName}</h1>
                  <p className="text-gray-600">u/{userId.substring(0, 8)}...</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                    activeTab === 'posts'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Posts ({posts.length})
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                    activeTab === 'comments'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Comments ({comments.length})
                </button>
              </div>
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {posts.length === 0 && comments.length === 0 ? (
                  <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No activity yet</h3>
                    <p className="text-gray-600">This user hasn't posted or commented yet.</p>
                  </div>
                ) : (
                  <>
                    {/* Posts in Overview */}
                    {posts.slice(0, 5).map((post) => (
                      <Link
                        key={post.id}
                        href={`/community/post/${post.id}`}
                        className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-green-600 text-lg">▲</span>
                            <span className="font-bold text-gray-900">{post.upvotes - post.downvotes}</span>
                            <span className="text-red-600 text-lg">▼</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {post.communityId && (
                                <Link 
                                  href={`/community/c/${post.communityId}`} 
                                  className="text-sm text-gray-500 hover:text-green-600 font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  r/{post.communityId.substring(0, 10)}...
                                </Link>
                              )}
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                            </div>
                            {post.title && (
                              <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                            )}
                            {post.imageUrl && (
                              <div className="mb-3">
                                <img 
                                  src={post.imageUrl} 
                                  alt={post.title || 'Post image'} 
                                  className="w-full rounded-lg max-h-96 object-cover"
                                />
                              </div>
                            )}
                            {/* Content is hidden in feed - shown only on detail page */}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {post.commentCount} comments
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {/* Comments in Overview */}
                    {comments.slice(0, 5).map((comment) => (
                      <Link
                        key={comment.id}
                        href={`/community/post/${comment.postId}`}
                        className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-green-600 text-lg">▲</span>
                            <span className="font-bold text-gray-900">{comment.upvotes - comment.downvotes}</span>
                            <span className="text-red-600 text-lg">▼</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">Comment</span>
                            </div>
                            <p className="text-gray-700 mb-2 line-clamp-3">{comment.content}</p>
                            <p className="text-sm text-green-600 hover:text-green-700">View post →</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-600">This user hasn't created any posts.</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/community/post/${post.id}`}
                      className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-green-600 text-lg">▲</span>
                          <span className="font-bold text-gray-900">{post.upvotes - post.downvotes}</span>
                          <span className="text-red-600 text-lg">▼</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {post.communityId && (
                              <Link 
                                href={`/community/c/${post.communityId}`} 
                                className="text-sm text-gray-500 hover:text-green-600 font-medium"
                                onClick={(e) => e.stopPropagation()}
                              >
                                r/{post.communityId.substring(0, 10)}...
                              </Link>
                            )}
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                          <p className="text-gray-700 mb-3 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {post.commentCount} comments
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No comments yet</h3>
                    <p className="text-gray-600">This user hasn't made any comments.</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <Link
                      key={comment.id}
                      href={`/community/post/${comment.postId}`}
                      className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-green-600 text-lg">▲</span>
                          <span className="font-bold text-gray-900">{comment.upvotes - comment.downvotes}</span>
                          <span className="text-red-600 text-lg">▼</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 mb-2 line-clamp-3">{comment.content}</p>
                          <p className="text-sm text-green-600 hover:text-green-700">View post →</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">User Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Karma</span>
                  </div>
                  <span className="font-bold text-gray-900">{totalKarma.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">Posts</span>
                  </div>
                  <span className="font-bold text-gray-900">{posts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">Comments</span>
                  </div>
                  <span className="font-bold text-gray-900">{comments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <span className="text-gray-700">Contributions</span>
                  </div>
                  <span className="font-bold text-gray-900">{totalContributions}</span>
                </div>
                {accountAge && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <span className="text-gray-700">Account Age</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {Math.floor(accountAge / 365)}y {Math.floor((accountAge % 365) / 30)}m
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <Link
                  href="/profile"
                  className="block w-full text-center bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Edit Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

