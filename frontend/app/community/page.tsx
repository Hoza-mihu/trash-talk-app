'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, TrendingUp, Plus, Leaf, Filter, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAllPosts, getPopularPosts, searchPosts, CommunityPost } from '@/lib/community';
import { CATEGORY_KEYS, CATEGORY_COLORS, WasteCategoryKey } from '@/lib/stats';

export default function CommunityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'search'>('recent');
  const [selectedCategory, setSelectedCategory] = useState<WasteCategoryKey | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (sortBy === 'search' && searchTerm.trim()) {
      handleSearch();
    } else {
      loadPosts();
    }
  }, [sortBy, selectedCategory]);

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
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">Eco-Eco Community</span>
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/" className="text-gray-700 hover:text-green-600 font-medium">
              Home
            </Link>
            <Link href="/upload" className="text-gray-700 hover:text-green-600 font-medium">
              Trash Talk
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-green-600 font-medium">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Recycling Community</h1>
          <p className="text-gray-600">Share tips, ask questions, and connect with eco-warriors!</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search posts by title, content, or tags..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSortBy('recent');
                  loadPosts();
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === 'popular'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Popular
              </button>
            </div>

            <div className="flex gap-2 items-center">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as WasteCategoryKey | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                <Plus className="w-5 h-5" />
                Create Post
              </Link>
            )}
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="text-center py-12">
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
                className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Voting */}
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        // Handle upvote
                      }}
                      className="text-gray-400 hover:text-green-600 transition-colors"
                    >
                      ▲
                    </button>
                    <span className="font-bold text-gray-900">{post.upvotes - post.downvotes}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        // Handle downvote
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
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
                      <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-gray-700 mb-4 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <Link
                        href={`/community/user/${post.authorId}`}
                        className="hover:text-green-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        by {post.authorName}
                      </Link>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {post.commentCount} comments
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

