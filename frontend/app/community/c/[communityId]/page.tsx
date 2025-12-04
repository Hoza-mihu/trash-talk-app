'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Leaf, Users, Plus, MessageSquare, TrendingUp, Filter, Trash2, Bell, MoreHorizontal, Clock, Flame, Trophy, LayoutGrid, List, Edit2, Image as ImageIcon, X, Star, Bookmark, VolumeX, Rocket, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getCommunityById,
  getPostsByCommunity,
  joinCommunity,
  leaveCommunity,
  isCommunityMember,
  getCommunityMembership,
  updateNotificationPreference,
  deleteCommunity,
  updateCommunityImages,
  uploadCommunityBanner,
  uploadCommunityIcon,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
  Community,
  CommunityPost,
  Notification
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
  const [editingImages, setEditingImages] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [highlights, setHighlights] = useState<CommunityPost[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationPreference, setNotificationPreference] = useState<'all' | 'popular' | 'off' | 'mute'>('all');

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
      loadHighlights();
      // Load favorites and muted status from localStorage
      if (user) {
        const favorites = JSON.parse(localStorage.getItem('favoriteCommunities') || '[]');
        const muted = JSON.parse(localStorage.getItem('mutedCommunities') || '[]');
        setIsFavorite(favorites.includes(communityId));
        setIsMuted(muted.includes(communityId));
        loadNotifications();
        // Subscribe to real-time notifications
        const unsubscribe = subscribeToNotifications(user.uid, (notifs) => {
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.read).length);
        });
        return () => unsubscribe();
      }
    }
  }, [communityId, sortOption, user]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const notifs = await getUserNotifications(user.uid, 20);
      setNotifications(notifs);
      const count = await getUnreadNotificationCount(user.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read && notification.id) {
      await markNotificationAsRead(notification.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    if (notification.postId) {
      router.push(`/community/post/${notification.postId}`);
    } else if (notification.communityId) {
      router.push(`/community/c/${notification.communityId}`);
    }
    setShowNotifications(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsAsRead(user.uid);
      setUnreadCount(0);
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const loadHighlights = async () => {
    try {
      // Get top 3 posts by upvotes from this community
      const allPosts = await getPostsByCommunity(communityId, 50);
      const sorted = [...allPosts].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
      setHighlights(sorted.slice(0, 3));
    } catch (error) {
      console.error('Error loading highlights:', error);
    }
  };

  const handleToggleFavorite = () => {
    if (!user) return;
    const favorites = JSON.parse(localStorage.getItem('favoriteCommunities') || '[]');
    if (isFavorite) {
      const updated = favorites.filter((id: string) => id !== communityId);
      localStorage.setItem('favoriteCommunities', JSON.stringify(updated));
      setIsFavorite(false);
    } else {
      favorites.push(communityId);
      localStorage.setItem('favoriteCommunities', JSON.stringify(favorites));
      setIsFavorite(true);
    }
    setShowDropdown(false);
  };

  const handleToggleMute = () => {
    if (!user) return;
    const muted = JSON.parse(localStorage.getItem('mutedCommunities') || '[]');
    if (isMuted) {
      const updated = muted.filter((id: string) => id !== communityId);
      localStorage.setItem('mutedCommunities', JSON.stringify(updated));
      setIsMuted(false);
    } else {
      muted.push(communityId);
      localStorage.setItem('mutedCommunities', JSON.stringify(muted));
      setIsMuted(true);
    }
    setShowDropdown(false);
  };

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
      const membership = await getCommunityMembership(communityId, user.uid);
      if (membership) {
        setIsMember(membership.isMember);
        if (membership.notificationPreference) {
          setNotificationPreference(membership.notificationPreference);
        }
      } else {
        const member = await isCommunityMember(communityId, user.uid);
        setIsMember(member);
      }
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
        setNotificationPreference('all'); // Reset preference when leaving
        if (community) {
          setCommunity({ ...community, memberCount: Math.max(0, community.memberCount - 1) });
        }
      } else {
        await joinCommunity(communityId, user.uid, notificationPreference);
        // Reload membership to ensure state is correct
        await checkMembership();
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

  const handleNotificationPreferenceChange = async (preference: 'all' | 'popular' | 'off' | 'mute') => {
    if (!user || !isMember) return;
    
    try {
      await updateNotificationPreference(communityId, user.uid, preference);
      setNotificationPreference(preference);
      setShowNotifications(false);
      
      // If muting, also add to muted communities list
      if (preference === 'mute') {
        const muted = JSON.parse(localStorage.getItem('mutedCommunities') || '[]');
        if (!muted.includes(communityId)) {
          muted.push(communityId);
          localStorage.setItem('mutedCommunities', JSON.stringify(muted));
          setIsMuted(true);
        }
      } else {
        // Remove from muted list if unmuting
        const muted = JSON.parse(localStorage.getItem('mutedCommunities') || '[]');
        const updated = muted.filter((id: string) => id !== communityId);
        localStorage.setItem('mutedCommunities', JSON.stringify(updated));
        setIsMuted(false);
      }
    } catch (error) {
      console.error('Error updating notification preference:', error);
      alert('Failed to update notification preference. Please try again.');
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

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateImages = async () => {
    if (!user || !community || community.creatorId !== user.uid) return;

    setUploading(true);
    try {
      let bannerUrl: string | undefined = undefined;
      let iconUrl: string | undefined = undefined;

      if (bannerFile) {
        bannerUrl = await uploadCommunityBanner(bannerFile, user.uid, community.id);
      }

      if (iconFile) {
        iconUrl = await uploadCommunityIcon(iconFile, user.uid, community.id);
      }

      if (bannerUrl || iconUrl) {
        await updateCommunityImages(community.id!, user.uid, {
          bannerUrl: bannerUrl || community.bannerUrl,
          iconUrl: iconUrl || community.iconUrl
        });

        // Reload community data
        await loadCommunity();
        setEditingImages(false);
        setBannerFile(null);
        setBannerPreview(null);
        setIconFile(null);
        setIconPreview(null);
      }
    } catch (error: any) {
      console.error('Error updating images:', error);
      alert(error.message || 'Failed to update images. Please try again.');
    } finally {
      setUploading(false);
    }
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
        <div className="relative h-32 md:h-48 bg-gradient-to-r from-green-400 to-teal-400 overflow-hidden">
          {(community.bannerUrl || community.imageUrl) && (
            <img
              src={community.bannerUrl || community.imageUrl}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          )}
          {user && community.creatorId === user.uid && (
            <button
              onClick={() => setEditingImages(true)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-colors text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit Banner
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 py-4">
          {/* Main Content */}
          <main className="lg:col-span-8 space-y-4">
            {/* Community Header */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Community Icon - Overlapping Banner */}
                  {(community.iconUrl || community.imageUrl) ? (
                    <img
                      src={community.iconUrl || community.imageUrl}
                      alt={community.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white -mt-10 relative z-10"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-white -mt-10 relative z-10">
                      {community.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">r/{community.name}</h1>
                        {user && community.creatorId === user.uid && (
                          <button
                            onClick={() => setEditingImages(true)}
                            className="text-gray-400 hover:text-green-600 transition-colors p-1"
                            title="Edit Icon"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-2">
                        {user && community.creatorId === user.uid && (
                          <button
                            onClick={handleDeleteCommunity}
                            disabled={deleting}
                            className="px-4 py-2 rounded-lg font-semibold transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            {deleting ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                        {user && (
                          <Link
                            href={`/community/create?communityId=${communityId}`}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Create Post
                          </Link>
                        )}
                        {isMember && user && (
                          <div className="relative">
                            <button
                              onClick={() => {
                                setShowNotificationSettings(!showNotificationSettings);
                                setShowNotifications(false);
                              }}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                            >
                              <Bell className="w-5 h-5 text-gray-600" />
                              {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                              )}
                            </button>
                            {showNotificationSettings && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowNotificationSettings(false)}
                                ></div>
                                <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-xl z-20 border border-gray-700">
                                  <div className="p-3 border-b border-gray-700">
                                    <h3 className="text-sm font-semibold text-white">Community notifications</h3>
                                  </div>
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleNotificationPreferenceChange('all')}
                                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3"
                                    >
                                      <Bell className={`w-4 h-4 ${notificationPreference === 'all' ? 'text-green-400' : ''}`} />
                                      <div className="flex-1">
                                        <div className="font-medium">All new posts</div>
                                      </div>
                                      {notificationPreference === 'all' && (
                                        <Check className="w-4 h-4 text-green-400" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleNotificationPreferenceChange('popular')}
                                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3"
                                    >
                                      <Bell className={`w-4 h-4 ${notificationPreference === 'popular' ? 'text-green-400' : ''}`} />
                                      <div className="flex-1">
                                        <div className="font-medium">Popular posts</div>
                                      </div>
                                      {notificationPreference === 'popular' && (
                                        <Check className="w-4 h-4 text-green-400" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleNotificationPreferenceChange('off')}
                                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3"
                                    >
                                      <Bell className={`w-4 h-4 ${notificationPreference === 'off' ? 'text-green-400' : ''}`} />
                                      <div className="flex-1">
                                        <div className="font-medium">Off</div>
                                      </div>
                                      {notificationPreference === 'off' && (
                                        <Check className="w-4 h-4 text-green-400" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleNotificationPreferenceChange('mute')}
                                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3"
                                    >
                                      <VolumeX className={`w-4 h-4 ${notificationPreference === 'mute' ? 'text-red-400' : ''}`} />
                                      <div className="flex-1">
                                        <div className="font-medium">Mute</div>
                                        <div className="text-xs text-gray-400 mt-0.5">Hide everything from this community</div>
                                      </div>
                                      {notificationPreference === 'mute' && (
                                        <Check className="w-4 h-4 text-red-400" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        <button
                          onClick={handleJoinLeave}
                          disabled={joining}
                          className={`px-6 py-2 rounded-lg font-semibold transition-colors text-sm flex items-center gap-2 ${
                            isMember
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          } disabled:opacity-50`}
                        >
                          {joining ? '...' : isMember ? (
                            <>
                              <Check className="w-4 h-4" />
                              Joined
                            </>
                          ) : 'Join'}
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <MoreHorizontal className="w-5 h-5 text-gray-600" />
                          </button>
                          {showDropdown && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowDropdown(false)}
                              ></div>
                              <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-20 border border-gray-700">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      alert('Custom feed feature coming soon!');
                                      setShowDropdown(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Bookmark className="w-4 h-4" />
                                    Add to custom feed
                                  </button>
                                  <button
                                    onClick={handleToggleFavorite}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                                    {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                  </button>
                                  <button
                                    onClick={handleToggleMute}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <VolumeX className={`w-4 h-4 ${isMuted ? 'text-red-400' : ''}`} />
                                    {isMuted ? 'Unmute r/' + community.name : 'Mute r/' + community.name}
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{community.description}</p>
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
                </div>
              </div>
            </div>

            {/* Community Highlights */}
            {highlights.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Rocket className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Community highlights</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {highlights.map((post) => (
                    <Link
                      key={post.id}
                      href={`/community/post/${post.id}`}
                      className="block p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer"
                    >
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
                        {post.title}
                      </h3>
                      {post.imageUrl && (
                        <div className="mb-2">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full h-24 object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {post.isTip && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            💡 Tip
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {post.upvotes - post.downvotes} upvotes
                        </span>
                        {post.commentCount > 0 && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{post.commentCount} comments</span>
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

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
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {(community.iconUrl || community.imageUrl) ? (
                    <img
                      src={community.iconUrl || community.imageUrl}
                      alt={community.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                      {community.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 text-base">r/{community.name}</h3>
                </div>
                <p className="text-gray-700 text-sm">{community.description}</p>
              </div>
              
              <div className="space-y-2 text-xs">
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
                  <span className="font-medium text-gray-900 capitalize">
                    {community.communityType || 'Public'}
                  </span>
                </div>
              </div>

              {/* User Flair Section */}
              {user && isMember && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2 uppercase">User Flair</h4>
                  <div className="flex items-center gap-2">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="text-sm text-gray-700">{user.displayName || user.email || 'User'}</span>
                  </div>
                </div>
              )}

              {/* Community Achievements */}
              {community.postCount > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2 uppercase">Community Achievements</h4>
                  <div className="space-y-2">
                    {community.postCount >= 10 && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span>Active Community</span>
                      </div>
                    )}
                    {community.memberCount >= 10 && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Users className="w-4 h-4 text-green-500" />
                        <span>Growing Community</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

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

      {/* Edit Images Modal */}
      {editingImages && user && community && community.creatorId === user.uid && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Community Images</h2>
              <button
                onClick={() => {
                  setEditingImages(false);
                  setBannerFile(null);
                  setBannerPreview(null);
                  setIconFile(null);
                  setIconPreview(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Banner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banner</label>
                {bannerPreview ? (
                  <div className="relative">
                    <img src={bannerPreview} alt="Banner preview" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => {
                        setBannerFile(null);
                        setBannerPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    {community.bannerUrl || community.imageUrl ? (
                      <div className="relative">
                        <img
                          src={community.bannerUrl || community.imageUrl}
                          alt="Current banner"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    ) : null}
                    <label className="mt-4 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors bg-gray-50">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to change banner</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                {iconPreview ? (
                  <div className="relative inline-block">
                    <img src={iconPreview} alt="Icon preview" className="w-32 h-32 object-cover rounded-full" />
                    <button
                      type="button"
                      onClick={() => {
                        setIconFile(null);
                        setIconPreview(null);
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {(community.iconUrl || community.imageUrl) ? (
                      <img
                        src={community.iconUrl || community.imageUrl}
                        alt="Current icon"
                        className="w-32 h-32 object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-4xl">
                        {community.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-green-500 transition-colors bg-gray-50">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Change</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleIconChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingImages(false);
                  setBannerFile(null);
                  setBannerPreview(null);
                  setIconFile(null);
                  setIconPreview(null);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateImages}
                disabled={uploading || (!bannerFile && !iconFile)}
                className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

