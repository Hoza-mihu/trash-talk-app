'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, TrendingUp, Plus, Leaf, Filter, Search, Users, Home, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { 
  getAllPosts, 
  getPopularPosts, 
  searchPosts, 
  CommunityPost,
  getAllCommunities,
  getPopularCommunities,
  getUserCommunities,
  joinCommunity,
  leaveCommunity,
  isCommunityMember
} from '@/lib/community';
import { Community } from '@/lib/community';
import { CATEGORY_KEYS, CATEGORY_COLORS, WasteCategoryKey } from '@/lib/stats';

export default function CommunityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'search'>('recent');
  const [selectedCategory, setSelectedCategory] = useState<WasteCategoryKey | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadCommunities();
    if (user) {
      loadUserCommunities();
    }
    if (sortBy === 'search' && searchTerm.trim()) {
      handleSearch();
    } else {
      loadPosts();
    }
  }, [sortBy, selectedCategory, user]);

  const loadCommunities = async () => {
    setCommunitiesLoading(true);
    try {
      const fetchedCommunities = await getPopularCommunities(10);
      setCommunities(fetchedCommunities);
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setCommunitiesLoading(false);
    }
  };

  const loadUserCommunities = async () => {
    if (!user) return;
    try {
      const fetched = await getUserCommunities(user.uid);
      setUserCommunities(fetched);
    } catch (error) {
      console.error('Error loading user communities:', error);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      let fetchedPosts: CommunityPost[] = [];
      
      if (sortBy === 'popular') {
        fetchedPosts = await getPopularPosts(50);
      } else {
        fetchedPosts = await getAllPosts(50);
      }
      
      // Filter by category if selected
      if (selectedCategory !== 'all') {
        fetchedPosts = fetchedPosts.filter(post => post.category === selectedCategory);
      }
      
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSortBy('recent');
      loadPosts();
      return;
    }

    setIsSearching(true);
    setLoading(true);
    try {
      const results = await searchPosts(searchTerm, 50);
      
      // Filter by category if selected
      const filtered = selectedCategory !== 'all' 
        ? results.filter(post => post.category === selectedCategory)
        : results;
      
      setPosts(filtered);
      setSortBy('search');
    } catch (error) {
      console.error('Error searching posts:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      const isMember = await isCommunityMember(communityId, user.uid);
      if (isMember) {
        await leaveCommunity(communityId, user.uid);
      } else {
        await joinCommunity(communityId, user.uid);
      }
      await loadUserCommunities();
      await loadCommunities();
    } catch (error) {
      console.error('Error joining/leaving community:', error);
      alert('Failed to join/leave community. Please try again.');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Leaf className="w-8 h-8 text-green-600 group-hover:rotate-12 transition-transform" />
            <span className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">Eco-Eco Community</span>
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              Home
            </Link>
            <Link href="/upload" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              Trash Talk
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Communities */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Navigation */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="space-y-2">
                <Link
                  href="/community"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition-colors text-gray-700"
                >
                  <Home className="w-5 h-5" />
                  <span className="font-medium">Home</span>
                </Link>
                <Link
                  href="/community/create-community"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition-colors text-gray-700"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create Community</span>
                </Link>
              </div>
            </div>

            {/* Your Communities */}
            {user && userCommunities.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Your Communities
                </h3>
                <div className="space-y-2">
                  {userCommunities.map((community) => (
                    <Link
                      key={community.id}
                      href={`/community/c/${community.id}`}
                      className="block p-2 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {community.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">r/{community.name}</p>
                          <p className="text-xs text-gray-500">{community.memberCount} members</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Communities */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Popular Communities
              </h3>
              {communitiesLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {communities.slice(0, 5).map((community) => {
                    const isMember = userCommunities.some(c => c.id === community.id);
                    return (
                      <div
                        key={community.id}
                        className="p-2 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {community.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/community/c/${community.id}`}
                              className="font-medium text-gray-900 hover:text-green-600 transition-colors"
                            >
                              r/{community.name}
                            </Link>
                            <p className="text-xs text-gray-500">{community.memberCount} members</p>
                          </div>
                        </div>
                        {user && (
                          <button
                            onClick={() => handleJoinCommunity(community.id!)}
                            className={`w-full text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                              isMember
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {isMember ? 'Joined' : 'Join'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-6 space-y-4">
            {/* Search Bar */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search posts..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 !text-black placeholder:text-gray-400"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSearching ? '...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSortBy('recent');
                      setSearchTerm('');
                      loadPosts();
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      sortBy === 'recent'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('popular');
                      setSearchTerm('');
                      loadPosts();
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      sortBy === 'popular'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Popular
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as WasteCategoryKey | 'all')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 !text-black bg-white text-sm"
                  >
                    <option value="all">All Categories</option>
                    {CATEGORY_KEYS.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {user && (
                  <Link
                    href="/community/create"
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Post
                  </Link>
                )}
              </div>
            </div>

            {/* Posts List */}
            {loading ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6">Be the first to share a recycling tip!</p>
                {user && (
                  <Link
                    href="/community/create"
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
                          {post.communityId && (
                            <Link
                              href={`/community/c/${post.communityId}`}
                              className="text-xs font-medium text-green-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              r/{post.communityId}
                            </Link>
                          )}
                          <span className="text-xs text-gray-500">•</span>
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
                            className="hover:text-green-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            by {post.authorName}
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

          {/* Right Sidebar - Recent Posts */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-xl p-4 shadow-sm sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  Recent Posts
                </h3>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSortBy('recent');
                    loadPosts();
                  }}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-3">
                {posts.slice(0, 5).map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/post/${post.id}`}
                    className="block p-2 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{post.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{post.upvotes - post.downvotes} upvotes</span>
                      <span>•</span>
                      <span>{post.commentCount} comments</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
