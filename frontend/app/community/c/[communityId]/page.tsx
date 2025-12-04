'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Leaf, Users, Plus, MessageSquare, TrendingUp, Filter, Trash2, Bell, MoreHorizontal, Clock, Flame, Trophy, LayoutGrid, List } from 'lucide-react';
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

type SortOption = 'best' | 'hot' | 'new' | 'top';
type ViewOption = 'card' | 'compact';

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
  const [sortOption, setSortOption] = useState<SortOption>('best');
  const [viewOption, setViewOption] = useState<ViewOption>('card');

  useEffect(() => {
    if (communityId) {
      loadCommunity();
      if (user) {
        checkMembership();
      }
    }
  }, [communityId, user]);

  useEffect(() => {
    if (communityId) {
      loadPosts();
    }
  }, [communityId, sortOption]);

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
      // Sort posts based on selected option
      let sortedPosts = [...fetched];
      switch (sortOption) {
        case 'hot':
          // Sort by upvotes - downvotes (score) in last 24 hours
          sortedPosts.sort((a, b) => {
            const scoreA = (a.upvotes - a.downvotes) || 0;
            const scoreB = (b.upvotes - b.downvotes) || 0;
            return scoreB - scoreA;
          });
          break;
        case 'new':
          // Already sorted by createdAt desc from query
          break;
        case 'top':
          // Sort by highest score (upvotes - downvotes)
          sortedPosts.sort((a, b) => {
            const scoreA = (a.upvotes - a.downvotes) || 0;
            const scoreB = (b.upvotes - b.downvotes) || 0;
            return scoreB - scoreA;
          });
          break;
        case 'best':
        default:
          // Sort by score (upvotes - downvotes) as default
          sortedPosts.sort((a, b) => {
            const scoreA = (a.upvotes - a.downvotes) || 0;
            const scoreB = (b.upvotes - b.downvotes) || 0;
            return scoreB - scoreA;
          });
          break;
      }
      setPosts(sortedPosts);
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/community" className="flex items-center gap-2 group">
            <Leaf className="w-8 h-8 text-green-600 group-hover:rotate-12 transition-transform" />
            <span className="text-xl font-bold text-gray-900">Eco-Eco Community</span>
          </Link>
          <Link href="/community" className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto">
        {/* Community Banner */}
        {community.imageUrl && (
          <div className="relative h-32 md:h-48 bg-gradient-to-r from-green-400 to-teal-400 overflow-hidden">
            <img
              src={community.imageUrl}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 py-6">
          {/* Main Content */}
          <main className="lg:col-span-8 space-y-4">
            {/* Community Header */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {community.imageUrl ? (
                    <img
                      src={community.imageUrl}
                      alt={community.name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white -mt-8"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white -mt-8">
                      {community.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 pt-2">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">r/{community.name}</h1>
                    <p className="text-sm text-gray-600 mb-3">{community.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {community.memberCount} members
                      </span>
                      <span>•</span>
                      <span>{community.postCount} posts</span>
                      {community.category && (
                        <>
                          <span>•</span>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: CATEGORY_COLORS[community.category] }}
                          >
                            {community.category}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    {user && community.creatorId === user.uid && (
                      <button
                        onClick={handleDeleteCommunity}
                        disabled={deleting}
                        className="px-4 py-2 rounded-full font-semibold transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                    {isMember && user && (
                      <Link
                        href={`/community/create?communityId=${communityId}`}
                        className="px-4 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Create Post
                      </Link>
                    )}
                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                      <Bell className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={handleJoinLeave}
                      disabled={joining}
                      className={`px-6 py-2 rounded-full font-semibold transition-colors text-sm ${
                        isMember
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      } disabled:opacity-50`}
                    >
                      {joining ? '...' : isMember ? 'Joined' : 'Join'}
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                      <MoreHorizontal className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sort and View Options */}
            <div className="bg-white rounded-lg border border-gray-200 p-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSortOption('best')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    sortOption === 'best'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Best
                </button>
                <button
                  onClick={() => setSortOption('hot')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    sortOption === 'hot'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Flame className="w-4 h-4 inline mr-1" />
                  Hot
                </button>
                <button
                  onClick={() => setSortOption('new')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    sortOption === 'new'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  New
                </button>
                <button
                  onClick={() => setSortOption('top')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    sortOption === 'top'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Trophy className="w-4 h-4 inline mr-1" />
                  Top
                </button>
              </div>
              <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                <button
                  onClick={() => setViewOption('card')}
                  className={`p-2 rounded-md transition-colors ${
                    viewOption === 'card'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewOption('compact')}
                  className={`p-2 rounded-md transition-colors ${
                    viewOption === 'compact'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Compact View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Posts */}
            {loading ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6">Be the first to post in this community!</p>
                {isMember && user && (
                  <Link
                    href={`/community/create?communityId=${communityId}`}
                    className="inline-block bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors"
                  >
                    Create First Post
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/post/${post.id}`}
                    className="block bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex gap-3 p-3">
                      {/* Voting */}
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            // Handle upvote
                          }}
                          className="text-gray-400 hover:text-green-600 transition-colors text-lg leading-none"
                        >
                          ▲
                        </button>
                        <span className="font-bold text-gray-900 text-xs">{post.upvotes - post.downvotes}</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            // Handle downvote
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors text-lg leading-none"
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
                            onClick={(e) => e.stopPropagation()}
                          >
                            u/{post.authorName}
                          </Link>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-green-600 transition-colors">
                          {post.title}
                        </h3>
                        {viewOption === 'card' && post.imageUrl && (
                          <div className="mb-2">
                            <img 
                              src={post.imageUrl} 
                              alt={post.title || 'Post image'} 
                              className="w-full rounded-md max-h-64 object-cover"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1 hover:text-green-600 transition-colors cursor-pointer">
                            <MessageSquare className="w-3 h-3" />
                            {post.commentCount} comments
                          </span>
                          <span className="flex items-center gap-1 hover:text-green-600 transition-colors cursor-pointer">
                            Share
                          </span>
                          <span className="flex items-center gap-1 hover:text-green-600 transition-colors cursor-pointer">
                            Save
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
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">About r/{community.name}</h3>
              <p className="text-gray-700 text-xs mb-4">{community.description}</p>
              
              <div className="space-y-2 text-xs mb-4">
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium text-gray-900">
                    {community.createdAt && formatDate(community.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">Members</span>
                  <span className="font-semibold text-gray-900">{community.memberCount}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">Posts</span>
                  <span className="font-semibold text-gray-900">{community.postCount}</span>
                </div>
                {community.category && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-500">Category</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: CATEGORY_COLORS[community.category] }}
                    >
                      {community.category}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900">Public</span>
                </div>
              </div>

              {community.tags && community.tags.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {community.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Community Rules */}
            {community.rules && community.rules.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">r/{community.name.toUpperCase()} RULES</h3>
                <ul className="space-y-2">
                  {community.rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="text-green-600 font-bold flex-shrink-0">{index + 1}.</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

