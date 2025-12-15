'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, TrendingUp, Plus, Leaf, Filter, Search, Users, Home, Sparkles, ArrowUp, ArrowDown, Award, MapPin, GraduationCap, Globe2, Sparkles as SparkleIcon, Check, Heart, Smile, Trophy, Flame, Clock, LayoutGrid } from 'lucide-react';
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
  isCommunityMember,
  getHotPosts
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
  const [sortOption, setSortOption] = useState<'best' | 'hot' | 'new' | 'top' | 'controversial' | 'old' | 'qa'>('best');
  const [topRange, setTopRange] = useState<'all' | 'year' | 'month' | 'week' | 'day'>('all');
  const [selectedCategory, setSelectedCategory] = useState<WasteCategoryKey | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [awardOpenId, setAwardOpenId] = useState<string | null>(null);

  useEffect(() => {
    loadCommunities();
    if (user) {
      loadUserCommunities();
    }
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      loadPosts();
    }
  }, [sortOption, selectedCategory, user, topRange]);

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

  const awardOptions = [
    // Eco / sustainability
    { name: 'Eco Hero', desc: 'Impactful recycling action', icon: <SparkleIcon className="w-4 h-4 text-emerald-600" /> },
    { name: 'Clean-Up Champion', desc: 'Cleanup organizer/volunteer', icon: <Award className="w-4 h-4 text-amber-500" /> },
    { name: 'Spotter Award', desc: 'Reported hazards/dumping', icon: <MapPin className="w-4 h-4 text-sky-600" /> },
    { name: 'Educator Award', desc: 'Shared guides/tips', icon: <GraduationCap className="w-4 h-4 text-indigo-500" /> },
    { name: 'Community Impact', desc: 'Verified sustainability win', icon: <Globe2 className="w-4 h-4 text-teal-500" /> },
    // General / Reddit-like
    { name: 'Helpful', desc: 'Great answer or solution', icon: <Check className="w-4 h-4 text-green-600" /> },
    { name: 'Insightful', desc: 'Smart or deep take', icon: <SparkleIcon className="w-4 h-4 text-purple-500" /> },
    { name: 'Wholesome', desc: 'Kind and supportive', icon: <Heart className="w-4 h-4 text-rose-500" /> },
    { name: 'Funny', desc: 'Made me laugh', icon: <Smile className="w-4 h-4 text-amber-600" /> },
    { name: 'Gold', desc: 'Outstanding contribution', icon: <Trophy className="w-4 h-4 text-yellow-500" /> },
  ];

  const handleGiveAward = (postId: string, awardName: string) => {
    setAwardOpenId(null);
    alert(`Award "${awardName}" sent for post ${postId}. Connect this to your awards backend.`);
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

  const getTimeValue = (date: any): number => {
    if (!date) return 0;
    if (date.toMillis && typeof date.toMillis === 'function') {
      return date.toMillis();
    }
    if (date instanceof Date) {
      return date.getTime();
    }
    try {
      return new Date(date).getTime();
    } catch {
      return 0;
    }
  };

  const isWithinTopRange = (createdAt: any, range: typeof topRange): boolean => {
    if (range === 'all') return true;
    const created = getTimeValue(createdAt);
    if (!created) return false;
    const now = Date.now();
    const oneDay = 1000 * 60 * 60 * 24;
    switch (range) {
      case 'day':
        return now - created <= oneDay;
      case 'week':
        return now - created <= oneDay * 7;
      case 'month':
        return now - created <= oneDay * 30;
      case 'year':
        return now - created <= oneDay * 365;
      default:
        return true;
    }
  };

  const calculateBalancedScore = (post: CommunityPost) => {
    const score = post.upvotes - post.downvotes;
    const engagement = post.commentCount || 0;
    const ageHours = Math.max(1, (Date.now() - getTimeValue(post.createdAt)) / (1000 * 60 * 60));
    return score * 0.6 + engagement * 0.3 + 15 / Math.pow(ageHours + 2, 0.3);
  };

  const calculateControversialScore = (post: CommunityPost) => {
    const ups = post.upvotes || 0;
    const downs = post.downvotes || 0;
    const total = ups + downs;
    const disagreement = total - Math.abs(ups - downs);
    const ageHours = Math.max(1, (Date.now() - getTimeValue(post.createdAt)) / (1000 * 60 * 60));
    return disagreement * 0.7 + total * 0.2 + 10 / Math.pow(ageHours + 2, 0.5);
  };

  const calculateQAScore = (post: CommunityPost) => {
    const isQuestion = post.title?.includes('?') || post.tags?.some((t) => t.toLowerCase?.() === 'question');
    const helpful = (post.commentCount || 0) * 1.5 + (post.upvotes - post.downvotes) * 0.5;
    const recencyBonus = 8 / Math.max(1, (Date.now() - getTimeValue(post.createdAt)) / (1000 * 60 * 60 * 24));
    return (isQuestion ? 10 : 0) + helpful + recencyBonus;
  };

  const sortPostsByOption = (items: CommunityPost[], option: typeof sortOption): CommunityPost[] => {
    let working = [...items];

    if (option === 'top' && topRange !== 'all') {
      working = working.filter((p) => isWithinTopRange(p.createdAt, topRange));
    }

    switch (option) {
      case 'best':
        return working.sort((a, b) => calculateBalancedScore(b) - calculateBalancedScore(a));
      case 'hot':
        return working.sort(
          (a, b) =>
            (b.hotScore ?? calculateBalancedScore(b)) - (a.hotScore ?? calculateBalancedScore(a))
        );
      case 'top':
        return working.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
      case 'new':
        return working.sort((a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt));
      case 'old':
        return working.sort((a, b) => getTimeValue(a.createdAt) - getTimeValue(b.createdAt));
      case 'controversial':
        return working.sort((a, b) => calculateControversialScore(b) - calculateControversialScore(a));
      case 'qa':
        return working.sort((a, b) => calculateQAScore(b) - calculateQAScore(a));
      default:
        return working;
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      let fetchedPosts: CommunityPost[] = [];

      const backendSort: 'hot' | 'top' | 'best' | 'new' = ['hot', 'top', 'best', 'new'].includes(sortOption)
        ? (sortOption as 'hot' | 'top' | 'best' | 'new')
        : 'new';

      switch (backendSort) {
        case 'hot':
          fetchedPosts = (await getHotPosts(50)).posts;
          break;
        case 'top':
          fetchedPosts = (await getPopularPosts(50)).posts;
          break;
        case 'best':
          fetchedPosts = (await getPopularPosts(50)).posts;
          break;
        case 'new':
        default:
          fetchedPosts = (await getAllPosts(50)).posts;
          break;
      }

      if (selectedCategory !== 'all') {
        fetchedPosts = fetchedPosts.filter((post) => post.category === selectedCategory);
      }

      const sorted = sortPostsByOption(fetchedPosts, sortOption);
      setPosts(sorted);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSortOption('best');
      loadPosts();
      return;
    }

    setIsSearching(true);
    setLoading(true);
    try {
      const results = await searchPosts(searchTerm, 50);
      
      const filtered = selectedCategory !== 'all' 
        ? results.filter(post => post.category === selectedCategory)
        : results;
      
      const sorted = sortPostsByOption(filtered, sortOption);
      setPosts(sorted);
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
                      className="block p-3 rounded-lg hover:bg-green-50 transition-colors border border-transparent hover:border-green-200"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {community.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">r/{community.name}</p>
                          <p className="text-xs text-gray-500">{community.memberCount} members</p>
                        </div>
                      </div>
                      {/* Weekly Stats */}
                      {(community.weeklyVisitors !== undefined || community.weeklyContributions !== undefined) && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                          {community.weeklyVisitors !== undefined && (
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900 mb-0.5">
                                {community.weeklyVisitors >= 1000000
                                  ? `${(community.weeklyVisitors / 1000000).toFixed(1)}M`
                                  : community.weeklyVisitors >= 1000
                                  ? `${(community.weeklyVisitors / 1000).toFixed(1)}K`
                                  : community.weeklyVisitors.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-gray-500">Weekly visitors</div>
                            </div>
                          )}
                          {community.weeklyContributions !== undefined && (
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900 mb-0.5">
                                {community.weeklyContributions >= 1000000
                                  ? `${(community.weeklyContributions / 1000000).toFixed(1)}M`
                                  : community.weeklyContributions >= 1000
                                  ? `${(community.weeklyContributions / 1000).toFixed(1)}K`
                                  : community.weeklyContributions.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-gray-500">Weekly contributions</div>
                            </div>
                          )}
                        </div>
                      )}
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
                        className="p-3 rounded-lg hover:bg-green-50 transition-colors border border-transparent hover:border-green-200"
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
                        {/* Weekly Stats */}
                        {(community.weeklyVisitors !== undefined || community.weeklyContributions !== undefined) && (
                          <div className="grid grid-cols-2 gap-3 pt-2 mb-2 border-t border-gray-100">
                            {community.weeklyVisitors !== undefined && (
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900 mb-0.5">
                                  {community.weeklyVisitors >= 1000000
                                    ? `${(community.weeklyVisitors / 1000000).toFixed(1)}M`
                                    : community.weeklyVisitors >= 1000
                                    ? `${(community.weeklyVisitors / 1000).toFixed(1)}K`
                                    : community.weeklyVisitors.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-gray-500">Weekly visitors</div>
                              </div>
                            )}
                            {community.weeklyContributions !== undefined && (
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900 mb-0.5">
                                  {community.weeklyContributions >= 1000000
                                    ? `${(community.weeklyContributions / 1000000).toFixed(1)}M`
                                    : community.weeklyContributions >= 1000
                                    ? `${(community.weeklyContributions / 1000).toFixed(1)}K`
                                    : community.weeklyContributions.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-gray-500">Weekly contributions</div>
                              </div>
                            )}
                          </div>
                        )}
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
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={() => { setSortOption('best'); setSearchTerm(''); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    sortOption === 'best' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Best
                </button>
                <button
                  onClick={() => { setSortOption('hot'); setSearchTerm(''); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    sortOption === 'hot' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  Hot
                </button>
                <button
                  onClick={() => { setSortOption('new'); setSearchTerm(''); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    sortOption === 'new' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  New
                </button>
                <button
                  onClick={() => { setSortOption('top'); setSearchTerm(''); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    sortOption === 'top' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  Top
                </button>
                <button
                  onClick={() => { setSortOption('controversial'); setSearchTerm(''); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    sortOption === 'controversial' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4 rotate-180" />
                  Controversial
                </button>
                <button
                  onClick={() => { setSortOption('old'); setSearchTerm(''); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    sortOption === 'old' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 rotate-180" />
                  Old
                </button>
                <button
                  onClick={() => { setSortOption('qa'); setSearchTerm(''); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    sortOption === 'qa' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Q&A
                </button>
                {sortOption === 'top' && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-medium">Range:</span>
                    <select
                      value={topRange}
                      onChange={(e) => setTopRange(e.target.value as typeof topRange)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All time</option>
                      <option value="year">Year</option>
                      <option value="month">Month</option>
                      <option value="week">Week</option>
                      <option value="day">Today</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
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

                        {/* Action bar - Reddit style pills */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                          <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                // hook actual vote here
                              }}
                              className="text-gray-500 hover:text-green-600 transition-colors"
                              title="Upvote"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <span className="font-semibold text-gray-900 text-sm min-w-[1.5rem] text-center">
                              {post.upvotes - post.downvotes}
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                // hook actual vote here
                              }}
                              className="text-gray-500 hover:text-red-600 transition-colors"
                              title="Downvote"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                            }}
                            className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 hover:border-green-500 hover:text-green-600 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {post.commentCount} comments
                          </button>

                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setAwardOpenId((prev) => (prev === post.id ? null : post.id || null));
                              }}
                              className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 px-3 py-1 hover:bg-amber-100 hover:border-amber-300 transition-colors"
                            >
                              <Award className="w-4 h-4" />
                              Award
                            </button>
                            {awardOpenId === post.id && (
                              <div className="absolute z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-xl p-3 space-y-2">
                                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Give an award</div>
                                {awardOptions.map((a) => (
                                  <button
                                    key={a.name}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleGiveAward(post.id!, a.name);
                                    }}
                                    className="w-full text-left flex items-start gap-3 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="mt-1">{a.icon}</div>
                                    <div>
                                      <div className="text-sm font-semibold text-gray-900">{a.name}</div>
                                      <div className="text-xs text-gray-500">{a.desc}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                            }}
                            className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 hover:border-slate-400 transition-colors"
                          >
                            <Search className="hidden" />
                            Share
                          </button>
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
                    setSortOption('best');
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
