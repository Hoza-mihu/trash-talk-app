'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Leaf, Users, Plus, MessageSquare, TrendingUp, Filter, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getCommunityById,
  getPostsByCommunity,
  joinCommunity,
  leaveCommunity,
  isCommunityMember,
  deleteCommunity,
  Community,
  CommunityPost
} from '@/lib/community';
import { CATEGORY_COLORS } from '@/lib/stats';

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const communityId = params.communityId as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (communityId) {
      loadCommunity();
      loadPosts();
      if (user) {
        checkMembership();
      }
    }
  }, [communityId, user]);

  const loadCommunity = async () => {
    try {
      const fetched = await getCommunityById(communityId);
      setCommunity(fetched);
    } catch (error) {
      console.error('Error loading community:', error);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const fetched = await getPostsByCommunity(communityId, 50);
      setPosts(fetched);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!user) return;
    try {
      const member = await isCommunityMember(communityId, user.uid);
      setIsMember(member);
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };

  const handleJoinLeave = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setJoining(true);
    try {
      if (isMember) {
        await leaveCommunity(communityId, user.uid);
        setIsMember(false);
        if (community) {
          setCommunity({ ...community, memberCount: Math.max(0, community.memberCount - 1) });
        }
      } else {
        await joinCommunity(communityId, user.uid);
        setIsMember(true);
        if (community) {
          setCommunity({ ...community, memberCount: community.memberCount + 1 });
        }
      }
    } catch (error) {
      console.error('Error joining/leaving community:', error);
      alert('Failed to join/leave community. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!user || !community) return;
    
    if (!confirm('Are you sure you want to delete this community? This will also delete all posts in this community. This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteCommunity(communityId, user.uid);
      alert('Community deleted successfully!');
      router.push('/community');
    } catch (error: any) {
      console.error('Error deleting community:', error);
      alert(error.message || 'Failed to delete community. Please try again.');
      setDeleting(false);
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

  if (loading && !community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Community not found</h2>
          <Link href="/community" className="text-green-600 hover:text-green-700 font-semibold">
            Back to Communities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/community" className="flex items-center gap-2 group">
            <Leaf className="w-8 h-8 text-green-600 group-hover:rotate-12 transition-transform" />
            <span className="text-2xl font-bold text-gray-900">Eco-Eco Community</span>
          </Link>
          <Link href="/community" className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <main className="lg:col-span-8 space-y-4">
            {/* Community Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                {community.imageUrl ? (
                  <img
                    src={community.imageUrl}
                    alt={community.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {community.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">r/{community.name}</h1>
                  <p className="text-gray-700 mb-4">{community.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {community.memberCount} members
                    </span>
                    <span>•</span>
                    <span>{community.postCount} posts</span>
                    {community.category && (
                      <>
                        <span>•</span>
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: CATEGORY_COLORS[community.category] }}
                        >
                          {community.category}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {user && community.creatorId === user.uid && (
                    <button
                      onClick={handleDeleteCommunity}
                      disabled={deleting}
                      className="px-6 py-2 rounded-lg font-semibold transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                  <button
                    onClick={handleJoinLeave}
                    disabled={joining}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      isMember
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    } disabled:opacity-50`}
                  >
                    {joining ? '...' : isMember ? 'Joined' : 'Join'}
                  </button>
                </div>
              </div>
            </div>

            {/* Rules */}
            {community.rules && community.rules.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Community Rules</h2>
                <ul className="space-y-2">
                  {community.rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-green-600 font-bold">{index + 1}.</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Create Post Button */}
            {isMember && user && (
              <Link
                href={`/community/create?communityId=${communityId}`}
                className="block bg-green-600 text-white rounded-xl p-4 shadow-sm hover:bg-green-700 transition-colors text-center font-semibold"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Create Post in r/{community.name}
              </Link>
            )}

            {/* Posts */}
            {loading ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6">Be the first to post in this community!</p>
                {isMember && user && (
                  <Link
                    href={`/community/create?communityId=${communityId}`}
                    className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Create First Post
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/post/${post.id}`}
                    className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      {/* Voting */}
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            // Handle upvote
                          }}
                          className="text-gray-400 hover:text-green-600 transition-colors text-lg"
                        >
                          ▲
                        </button>
                        <span className="font-bold text-gray-900 text-sm">{post.upvotes - post.downvotes}</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            // Handle downvote
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors text-lg"
                        >
                          ▼
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: CATEGORY_COLORS[post.category] }}
                          >
                            {post.category}
                          </span>
                          {post.isTip && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              💡 Tip
                            </span>
                          )}
                          <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{post.title}</h3>
                        <p className="text-gray-700 mb-3 line-clamp-2 text-sm">{post.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <Link
                            href={`/community/user/${post.authorId}`}
                            className="hover:text-green-600 transition-colors font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            u/{post.authorName}
                          </Link>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {post.commentCount} comments
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-4">
            {/* Community Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-20">
              <h3 className="font-bold text-gray-900 mb-4">About r/{community.name}</h3>
              <p className="text-gray-700 text-sm mb-4">{community.description}</p>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Members</span>
                  <span className="font-semibold text-gray-900">{community.memberCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Posts</span>
                  <span className="font-semibold text-gray-900">{community.postCount}</span>
                </div>
                {community.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Category</span>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: CATEGORY_COLORS[community.category] }}
                    >
                      {community.category}
                    </span>
                  </div>
                )}
              </div>

              {community.tags && community.tags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {community.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

