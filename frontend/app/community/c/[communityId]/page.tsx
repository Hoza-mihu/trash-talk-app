'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Leaf, Users, Plus, MessageSquare, TrendingUp, Filter, Trash2, Bell, MoreHorizontal, Clock, Flame, Trophy, LayoutGrid, List, Edit2, Image as ImageIcon, X, Star, Bookmark, VolumeX, Rocket, Check, Sparkles, Home, Calendar, Globe, ArrowUp, ArrowDown, Award, MapPin, GraduationCap, Heart, Smile } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getCommunityById,
  getPostsByCommunity,
  getHotPostsByCommunity,
  getTopPostsByCommunity,
  getBestPostsByCommunity,
  subscribeToCommunityPosts,
  joinCommunity,
  leaveCommunity,
  isCommunityMember,
  getCommunityMembership,
  updateNotificationPreference,
  deleteCommunity,
  deletePost,
  updateCommunityImages,
  uploadCommunityBanner,
  uploadCommunityIcon,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
  getUserCommunities,
  getPopularCommunities,
  getUserCommunityAchievements,
  calculateUserAchievements,
  getAchievementDefinition,
  calculateWeeklyCommunityStats,
  ACHIEVEMENT_DEFINITIONS,
  Community,
  CommunityPost,
  Notification,
  CommunityAchievement,
  AchievementType,
  getModerators,
  requestModerator,
  getModeratorRequests,
  approveModerator,
  rejectModerator,
  removeModerator,
  sendModeratorMessage,
  Moderator,
  ModRequest
} from '@/lib/community';
import { CATEGORY_COLORS } from '@/lib/stats';
import ShareDropdown from '@/components/ShareDropdown';
import CrosspostModal from '@/components/CrosspostModal';

type SortOption = 'best' | 'hot' | 'new' | 'top' | 'controversial' | 'old' | 'qa';
type TopTimeRange = 'all' | 'year' | 'month' | 'week' | 'day';
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
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('best');
  const [topRange, setTopRange] = useState<TopTimeRange>('all');
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
  const [latestPosts, setLatestPosts] = useState<CommunityPost[]>([]);
  const [topPosts, setTopPosts] = useState<CommunityPost[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationPreference, setNotificationPreference] = useState<'all' | 'popular' | 'off' | 'mute'>('all');
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [popularCommunities, setPopularCommunities] = useState<Community[]>([]);
  const [userAchievements, setUserAchievements] = useState<CommunityAchievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [crosspostModalPost, setCrosspostModalPost] = useState<{ id: string; title: string } | null>(null);
  const [awardOpenId, setAwardOpenId] = useState<string | null>(null);
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [modRequests, setModRequests] = useState<ModRequest[]>([]);
  const [loadingModerators, setLoadingModerators] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageTarget, setMessageTarget] = useState<'admin' | 'moderators'>('moderators');

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
        const unsubscribeNotifications = subscribeToNotifications(user.uid, (notifs) => {
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.read).length);
        });
        
        // Subscribe to real-time posts updates with proper sorting
        const backendSort: 'best' | 'hot' | 'new' | 'top' = ['best', 'hot', 'new', 'top'].includes(sortOption)
          ? (sortOption as 'best' | 'hot' | 'new' | 'top')
          : 'new';

        const unsubscribePosts = subscribeToCommunityPosts(
          communityId, 
          (fetchedPosts) => {
            const sorted = sortPostsByOption(fetchedPosts, sortOption);
            setPosts(sorted);
            setLoading(false);
            
            // Update highlights (latest and top posts)
            const latest = [...sorted]
              .sort((a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt))
              .slice(0, 3);
            setLatestPosts(latest);
            
            const top = [...sorted]
              .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
              .slice(0, 3);
            setTopPosts(top);
            setHighlights(top);
          },
          50,
          backendSort
        );
        
        return () => {
          unsubscribeNotifications();
          unsubscribePosts();
        };
      }
    }
  }, [communityId, sortOption, topRange, user]);

  useEffect(() => {
    // Resort locally when time range changes for top
    setPosts((prev) => sortPostsByOption(prev, sortOption));
  }, [topRange]);

  useEffect(() => {
    if (communityId) {
      loadModerators();
    }
  }, [communityId]);

  useEffect(() => {
    if (communityId && community?.creatorId && user?.uid === community.creatorId) {
      loadModeratorRequests();
    }
  }, [communityId, community?.creatorId, user?.uid]);

  // Reload posts when page becomes visible (e.g., returning from create post)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && communityId) {
        loadPosts();
        loadHighlights();
      }
    };
    
    const handleFocus = () => {
      if (communityId) {
        loadPosts();
        loadHighlights();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [communityId]);

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
      // Get all posts from this community
      const allPosts = await getPostsByCommunity(communityId, 50);
      
      // Get latest 3 posts (sorted by createdAt, most recent first)
      const latest = [...allPosts]
        .sort((a, b) => {
          const getTime = (date: any): number => {
            if (!date) return 0;
            // Check if it's a Firestore Timestamp
            if (date.toMillis && typeof date.toMillis === 'function') {
              return date.toMillis();
            }
            // Check if it's a Date object
            if (date instanceof Date) {
              return date.getTime();
            }
            // Try to convert to Date
            try {
              return new Date(date).getTime();
            } catch {
              return 0;
            }
          };
          const aTime = getTime(a.createdAt);
          const bTime = getTime(b.createdAt);
          return bTime - aTime;
        })
        .slice(0, 3);
      setLatestPosts(latest);
      
      // Get top 3 posts by upvotes (score = upvotes - downvotes)
      const top = [...allPosts]
        .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
        .slice(0, 3);
      setTopPosts(top);
      
      // Keep highlights for backward compatibility (use top posts)
      setHighlights(top);
    } catch (error) {
      console.error('Error loading highlights:', error);
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

  const loadPopularCommunities = async () => {
    try {
      const fetched = await getPopularCommunities(10);
      setPopularCommunities(fetched);
    } catch (error) {
      console.error('Error loading popular communities:', error);
    }
  };

  const loadModerators = async () => {
    if (!communityId) return;
    setLoadingModerators(true);
    try {
      const fetched = await getModerators(communityId);
      setModerators(fetched);
    } catch (error) {
      console.error('Error loading moderators:', error);
    } finally {
      setLoadingModerators(false);
    }
  };

  const loadModeratorRequests = async () => {
    if (!communityId || !user || community?.creatorId !== user.uid) return;
    setLoadingRequests(true);
    try {
      const fetched = await getModeratorRequests(communityId);
      setModRequests(fetched);
    } catch (error) {
      console.error('Error loading moderator requests:', error);
    } finally {
      setLoadingRequests(false);
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
      if (!fetched) {
        console.error('Community not found');
        return;
      }
      
      setCommunity(fetched);
      
      // Calculate and update weekly stats (always refresh to ensure accuracy)
      // Weekly stats should reflect the current week's activity
      try {
        console.log('[Community Page] Calculating weekly stats for community:', communityId);
        const stats = await calculateWeeklyCommunityStats(communityId);
        console.log('[Community Page] Weekly stats calculated:', stats);
        
        // Update local state immediately with calculated stats (no need to wait for Firestore)
        setCommunity(prev => {
          if (!prev) return prev; // If community is not loaded yet, don't update
          return {
            ...prev,
            weeklyVisitors: stats.weeklyVisitors,
            weeklyContributions: stats.weeklyContributions
          };
        });
        
        // Also try to reload from Firestore after a short delay as a backup
        setTimeout(async () => {
          try {
            const updated = await getCommunityById(communityId);
            if (updated && (updated.weeklyVisitors !== undefined || updated.weeklyContributions !== undefined)) {
              console.log('[Community Page] Updated community with stats from Firestore:', {
                weeklyVisitors: updated.weeklyVisitors,
                weeklyContributions: updated.weeklyContributions
              });
              setCommunity(updated);
            }
          } catch (reloadError) {
            console.error('[Community Page] Error reloading community:', reloadError);
          }
        }, 1000); // Delay to ensure Firestore has updated
      } catch (error) {
        console.error('[Community Page] Error calculating weekly stats:', error);
        // Still use existing stats from community document if available
        if (fetched.weeklyVisitors !== undefined || fetched.weeklyContributions !== undefined) {
          console.log('[Community Page] Using existing stats from community document');
        }
      }
    } catch (error) {
      console.error('Error loading community:', error);
    }
  };

  const loadUserAchievements = async () => {
    if (!user || !communityId) return;
    setLoadingAchievements(true);
    try {
      // Calculate achievements first (this will unlock new ones)
      await calculateUserAchievements(user.uid, communityId);
      // Then get all achievements
      const achievements = await getUserCommunityAchievements(user.uid, communityId);
      setUserAchievements(achievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoadingAchievements(false);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      let fetched: CommunityPost[] = [];
      const backendSort: 'best' | 'hot' | 'new' | 'top' = ['hot', 'top', 'best', 'new'].includes(sortOption)
        ? (sortOption as 'best' | 'hot' | 'new' | 'top')
        : 'new';
      
      // Use appropriate function based on sort option
      switch (backendSort) {
        case 'hot':
          fetched = await getHotPostsByCommunity(communityId, 50);
          break;
        case 'top':
          fetched = await getTopPostsByCommunity(communityId, 50);
          break;
        case 'best':
          fetched = await getBestPostsByCommunity(communityId, 50);
          break;
        case 'new':
        default:
          fetched = await getPostsByCommunity(communityId, 50);
          break;
      }
      
      const sorted = sortPostsByOption(fetched, sortOption);
      setPosts(sorted);
      
      // Update highlights (latest and top posts)
      const latest = [...sorted]
        .sort((a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt))
        .slice(0, 3);
      setLatestPosts(latest);
      
      const top = [...sorted]
        .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
        .slice(0, 3);
      setTopPosts(top);
      setHighlights(top);
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

  const handleRequestModerator = async () => {
    if (!user || !communityId) return;
    setSendingRequest(true);
    try {
      await requestModerator(communityId, user.uid, user.displayName || user.email || 'User', user.photoURL, requestMessage);
      alert('Request sent to admin.');
      setRequestMessage('');
    } catch (error: any) {
      alert(error.message || 'Failed to send request.');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleApproveModerator = async (req: ModRequest) => {
    if (!communityId) return;
    try {
      await approveModerator(communityId, req.id!, {
        userId: req.userId,
        userName: req.userName,
        userPhotoUrl: req.userPhotoUrl || undefined
      });
      await loadModerators();
      await loadModeratorRequests();
    } catch (error: any) {
      alert(error.message || 'Failed to approve moderator.');
    }
  };

  const handleRejectModerator = async (req: ModRequest) => {
    if (!communityId) return;
    try {
      await rejectModerator(communityId, req.id!);
      await loadModeratorRequests();
    } catch (error: any) {
      alert(error.message || 'Failed to reject request.');
    }
  };

  const handleRemoveModerator = async (moderatorId: string) => {
    if (!communityId) return;
    try {
      await removeModerator(communityId, moderatorId);
      await loadModerators();
    } catch (error: any) {
      alert(error.message || 'Failed to remove moderator.');
    }
  };

  const handleSendModeratorMessage = async () => {
    if (!user || !communityId || !messageText.trim()) return;
    try {
      await sendModeratorMessage(communityId, {
        fromUserId: user.uid,
        fromUserName: user.displayName || user.email || 'User',
        fromUserPhotoUrl: user.photoURL || undefined,
        to: messageTarget,
        text: messageText.trim()
      });
      setMessageText('');
      alert('Message sent.');
    } catch (error: any) {
      alert(error.message || 'Failed to send message.');
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

  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert('You must be logged in to delete posts.');
      return;
    }
    
    // Find the post to check permissions
    const postToDelete = posts.find(p => p.id === postId);
    if (!postToDelete) {
      alert('Post not found.');
      return;
    }
    
    // Check permissions before showing confirm
    const isAuthor = postToDelete.authorId === user.uid;
    const isCommunityCreator = community && community.creatorId === user.uid;
    
    if (!isAuthor && !isCommunityCreator) {
      alert('You do not have permission to delete this post. Only the post author or community creator can delete it.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this post? This will also delete all comments. This action cannot be undone.')) {
      return;
    }

    setDeletingPostId(postId);
    try {
      console.log(`Deleting post ${postId}...`, 'User:', user.uid, 'Is Author:', isAuthor, 'Is Community Creator:', isCommunityCreator);
      await deletePost(postId, user.uid);
      console.log(`Post ${postId} deleted successfully`);
      // Posts will automatically update via real-time subscription
      // The subscription will detect the deletion and remove it from the list
    } catch (error: any) {
      console.error('Error deleting post:', error);
      const errorMessage = error.message || 'Failed to delete post. Please check console for details.';
      alert(errorMessage);
    } finally {
      setDeletingPostId(null);
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

  const isWithinTopRange = (createdAt: any, range: TopTimeRange): boolean => {
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
    // Weight: quality (votes), engagement (comments), freshness (penalize older)
    return score * 0.6 + engagement * 0.3 + 15 / Math.pow(ageHours + 2, 0.3);
  };

  const calculateControversialScore = (post: CommunityPost) => {
    const ups = post.upvotes || 0;
    const downs = post.downvotes || 0;
    const total = ups + downs;
    const disagreement = total - Math.abs(ups - downs);
    // Reward volume with disagreement, light freshness boost
    const ageHours = Math.max(1, (Date.now() - getTimeValue(post.createdAt)) / (1000 * 60 * 60));
    return disagreement * 0.7 + total * 0.2 + 10 / Math.pow(ageHours + 2, 0.5);
  };

  const calculateQAScore = (post: CommunityPost) => {
    const isQuestion = post.title?.includes('?') || post.tags?.some((t) => t.toLowerCase?.() === 'question');
    const helpful = (post.commentCount || 0) * 1.5 + (post.upvotes - post.downvotes) * 0.5;
    const recencyBonus = 8 / Math.max(1, (Date.now() - getTimeValue(post.createdAt)) / (1000 * 60 * 60 * 24));
    return (isQuestion ? 10 : 0) + helpful + recencyBonus;
  };

  const sortPostsByOption = (items: CommunityPost[], option: SortOption): CommunityPost[] => {
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

  const isAdmin = user && community?.creatorId === user.uid;
  const isModerator = user ? moderators.some((m) => m.userId === user.uid) : false;

  const awardOptions = [
    // Eco / sustainability
    { name: 'Eco Hero', desc: 'Impactful recycling action', icon: 'sparkles-emerald' },
    { name: 'Clean-Up Champion', desc: 'Cleanup organizer/volunteer', icon: 'award-amber' },
    { name: 'Spotter Award', desc: 'Reported hazards/dumping', icon: 'map-sky' },
    { name: 'Educator Award', desc: 'Shared guides/tips', icon: 'grad-indigo' },
    { name: 'Community Impact', desc: 'Verified sustainability win', icon: 'globe-teal' },
    // General / Reddit-like
    { name: 'Helpful', desc: 'Great answer or solution', icon: 'check-green' },
    { name: 'Insightful', desc: 'Smart or deep take', icon: 'sparkles-purple' },
    { name: 'Wholesome', desc: 'Kind and supportive', icon: 'heart-rose' },
    { name: 'Funny', desc: 'Made me laugh', icon: 'smile-amber' },
    { name: 'Gold', desc: 'Outstanding contribution', icon: 'trophy-gold' },
  ];

  const renderAwardIcon = (code: string) => {
    const color = (cls: string) => cls;
    switch (code) {
      case 'sparkles-emerald':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'award-amber':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'map-sky':
        return <MapPin className="w-4 h-4 text-sky-600" />;
      case 'grad-indigo':
        return <GraduationCap className="w-4 h-4 text-indigo-500" />;
      case 'globe-teal':
        return <Globe className="w-4 h-4 text-teal-500" />;
      case 'check-green':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'sparkles-purple':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'heart-rose':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'smile-amber':
        return <Smile className="w-4 h-4 text-amber-600" />;
      case 'trophy-gold':
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      default:
        return <Award className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleGiveAward = (postId: string, awardName: string) => {
    setAwardOpenId(null);
    alert(`Award "${awardName}" sent for post ${postId}. Connect to awards backend.`);
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
        {/* Community Banner with Overlapping Icon - Reddit Style */}
        <div className="relative bg-white">
          {/* Banner */}
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
          
          {/* Community Info Section with Overlapping Icon */}
          <div className="px-4">
            <div className="bg-white rounded-lg border border-gray-200 border-t-0 rounded-t-none -mt-4 relative">
              <div className="p-4 pt-8">
                <div className="flex items-start gap-4">
                  {/* Community Icon - Overlapping Banner (Reddit Style) */}
                  <div className="relative -mt-16">
                    {(community.iconUrl || community.imageUrl) ? (
                      <img
                        src={community.iconUrl || community.imageUrl}
                        alt={community.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-sm">
                        {community.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {user && community.creatorId === user.uid && (
                      <button
                        onClick={() => setEditingImages(true)}
                        className="absolute -bottom-1 -right-1 bg-green-600 text-white rounded-full p-1.5 hover:bg-green-700 transition-colors shadow-md"
                        title="Edit Icon"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">r/{community.name}</h1>
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
                               {notificationPreference === 'mute' ? (
                                 <VolumeX className="w-5 h-5 text-red-600" />
                               ) : notificationPreference === 'off' ? (
                                 <Bell className="w-5 h-5 text-gray-400" />
                               ) : (
                                 <Bell className="w-5 h-5 text-gray-600" />
                               )}
                               {unreadCount > 0 && notificationPreference !== 'mute' && (
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 py-4">
          {/* Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20 space-y-4">
              <div>
                <Link href="/" className="flex items-center gap-2 mb-4 text-gray-700 hover:text-green-600 transition-colors">
                  <Leaf className="w-5 h-5" />
                  <span className="font-semibold">Eco-Eco</span>
                </Link>
                <nav className="space-y-1">
                  <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <Home className="w-4 h-4" />
                    Home
                  </Link>
                  <Link href="/community" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <TrendingUp className="w-4 h-4" />
                    Popular
                  </Link>
                  <Link href="/community" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <Sparkles className="w-4 h-4" />
                    All
                  </Link>
                </nav>
              </div>

              {user && (
                <>
                  <div className="pt-4 border-t border-gray-200">
                    <Link
                      href="/community/create-community"
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors w-full"
                    >
                      <Plus className="w-4 h-4" />
                      Start a community
                    </Link>
                  </div>

                  {userCommunities.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">Your Communities</h4>
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {userCommunities.slice(0, 10).map((comm) => (
                          <Link
                            key={comm.id}
                            href={`/community/c/${comm.id}`}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            {comm.iconUrl || comm.imageUrl ? (
                              <img
                                src={comm.iconUrl || comm.imageUrl}
                                alt={comm.name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {comm.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="truncate">r/{comm.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {popularCommunities.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">Popular Communities</h4>
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {popularCommunities.filter(c => c.id !== communityId).slice(0, 5).map((comm) => (
                          <Link
                            key={comm.id}
                            href={`/community/c/${comm.id}`}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            {comm.iconUrl || comm.imageUrl ? (
                              <img
                                src={comm.iconUrl || comm.imageUrl}
                                alt={comm.name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {comm.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="truncate">r/{comm.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-7 space-y-4">
            {/* Community Highlights */}
            {(latestPosts.length > 0 || topPosts.length > 0) && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Rocket className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Community highlights</h2>
                </div>
                
                {/* Latest Posts */}
                {latestPosts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Latest</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {latestPosts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/community/post/${post.id}`}
                          className="block p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer"
                        >
                          {post.imageUrl && (
                            <div className="mb-2">
                              <img
                                src={post.imageUrl}
                                alt={post.title}
                                className="w-full h-32 object-cover rounded"
                              />
                            </div>
                          )}
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{post.upvotes - post.downvotes} upvotes</span>
                            {post.commentCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{post.commentCount} comments</span>
                              </>
                            )}
                            {post.createdAt && (
                              <>
                                <span>•</span>
                                <span>{formatDate(post.createdAt)}</span>
                              </>
                            )}
                          </div>
                          {post.isTip && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              💡 Tip
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Top Posts */}
                {topPosts.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Top</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {topPosts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/community/post/${post.id}`}
                          className="block p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer"
                        >
                          {post.imageUrl && (
                            <div className="mb-2">
                              <img
                                src={post.imageUrl}
                                alt={post.title}
                                className="w-full h-32 object-cover rounded"
                              />
                            </div>
                          )}
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-semibold text-green-600">{post.upvotes - post.downvotes} upvotes</span>
                            {post.commentCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{post.commentCount} comments</span>
                              </>
                            )}
                            {post.createdAt && (
                              <>
                                <span>•</span>
                                <span>{formatDate(post.createdAt)}</span>
                              </>
                            )}
                          </div>
                          {post.isTip && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              💡 Tip
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sort and View Options */}
            <div className="bg-white rounded-lg border border-gray-200 p-2 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 flex-wrap">
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
                <button
                  onClick={() => setSortOption('controversial')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    sortOption === 'controversial'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Flame className="w-4 h-4 inline mr-1" />
                  Controversial
                </button>
                <button
                  onClick={() => setSortOption('old')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    sortOption === 'old'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-1 rotate-180" />
                  Old
                </button>
                <button
                  onClick={() => setSortOption('qa')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    sortOption === 'qa'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Q&amp;A
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {sortOption === 'top' && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <span className="font-medium">Range:</span>
                    <select
                      value={topRange}
                      onChange={(e) => setTopRange(e.target.value as TopTimeRange)}
                      className="border border-gray-200 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="all">All time</option>
                      <option value="year">Year</option>
                      <option value="month">Month</option>
                      <option value="week">Week</option>
                      <option value="day">Today</option>
                    </select>
                  </div>
                )}
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
                {posts.map((post) => {
                  const canDelete = user && (post.authorId === user.uid || (community && community.creatorId === user.uid));
                  return (
                    <div
                      key={post.id}
                      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <Link
                        href={`/community/post/${post.id}`}
                        className="block p-3"
                      >
                        <div className="flex gap-3 p-3">
                          {/* Voting column hidden (footer bar handles actions) */}
                          <div className="hidden flex-col items-center gap-1 pt-1">
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
                              <div onClick={(e) => e.stopPropagation()}>
                                <ShareDropdown
                                  postId={post.id!}
                                  postTitle={post.title}
                                  postImageUrl={post.imageUrl}
                                  onCrosspostClick={() => setCrosspostModalPost({ id: post.id!, title: post.title })}
                                />
                              </div>
                              <span className="flex items-center gap-1 hover:text-green-600 transition-colors cursor-pointer">
                                Save
                              </span>
                            </div>

                            {/* Inline action bar similar to Reddit (hidden, replaced by footer bar) */}
                            <div className="hidden mt-3 flex-wrap items-center gap-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    // hook real vote call here if desired
                                  }}
                                  className="inline-flex items-center justify-center px-2 py-1 rounded-full border border-gray-200 hover:border-green-500 hover:text-green-600 transition-colors"
                                  title="Upvote"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <span className="font-semibold text-gray-900">{post.upvotes - post.downvotes}</span>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    // hook real vote call here if desired
                                  }}
                                  className="inline-flex items-center justify-center px-2 py-1 rounded-full border border-gray-200 hover:border-red-500 hover:text-red-600 transition-colors"
                                  title="Downvote"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                              </div>

                              <span className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 hover:border-green-500 hover:text-green-600 transition-colors">
                                <MessageSquare className="w-4 h-4" />
                                {post.commentCount} comments
                              </span>

                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setAwardOpenId((prev) => (prev === post.id ? null : post.id || null));
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors text-xs font-semibold"
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
                                        <div className="mt-1">{renderAwardIcon(a.icon)}</div>
                                        <div>
                                          <div className="text-sm font-semibold text-gray-900">{a.name}</div>
                                          <div className="text-xs text-gray-500">{a.desc}</div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div onClick={(e) => e.stopPropagation()}>
                                <ShareDropdown
                                  postId={post.id!}
                                  postTitle={post.title}
                                  postImageUrl={post.imageUrl}
                                  onCrosspostClick={() => setCrosspostModalPost({ id: post.id!, title: post.title })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                      {/* Footer action bar - Reddit style */}
                      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/60 text-sm text-gray-600">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // hook upvote
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
                                e.stopPropagation();
                                // hook downvote
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
                              e.stopPropagation();
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
                                e.stopPropagation();
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
                                      e.stopPropagation();
                                      handleGiveAward(post.id!, a.name);
                                    }}
                                    className="w-full text-left flex items-start gap-3 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="mt-1">{renderAwardIcon(a.icon)}</div>
                                    <div>
                                      <div className="text-sm font-semibold text-gray-900">{a.name}</div>
                                      <div className="text-xs text-gray-500">{a.desc}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                            <ShareDropdown
                              postId={post.id!}
                              postTitle={post.title}
                              postImageUrl={post.imageUrl}
                              onCrosspostClick={() => setCrosspostModalPost({ id: post.id!, title: post.title })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="lg:col-span-3 space-y-4">
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
                <div className="flex items-center gap-2 py-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium text-gray-900 ml-auto">
                    {community.createdAt && (() => {
                      let date: Date;
                      if (community.createdAt instanceof Date) {
                        date = community.createdAt;
                      } else if (community.createdAt && typeof (community.createdAt as any).toDate === 'function') {
                        // Firestore Timestamp
                        date = (community.createdAt as any).toDate();
                      } else if (typeof community.createdAt === 'string' || typeof community.createdAt === 'number') {
                        date = new Date(community.createdAt);
                      } else {
                        date = new Date();
                      }
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    })()}
                  </span>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium text-gray-900 ml-auto capitalize">
                    {community.communityType || 'Public'}
                  </span>
                </div>
              </div>
              
               <div className="space-y-2 text-xs pt-2 border-t border-gray-200">
                 <div className="flex items-center justify-between py-1">
                   <span className="text-gray-500">Members</span>
                   <span className="font-semibold text-gray-900">{community.memberCount.toLocaleString()}</span>
                 </div>
                 <div className="flex items-center justify-between py-1">
                   <span className="text-gray-500">Posts</span>
                   <span className="font-semibold text-gray-900">{community.postCount.toLocaleString()}</span>
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
               </div>

                {/* Weekly Stats - Reddit Style */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {community.weeklyVisitors !== undefined
                          ? community.weeklyVisitors >= 1000000
                            ? `${(community.weeklyVisitors / 1000000).toFixed(1)}M`
                            : community.weeklyVisitors >= 1000
                            ? `${(community.weeklyVisitors / 1000).toFixed(1)}K`
                            : community.weeklyVisitors.toLocaleString()
                          : '0'}
                      </div>
                      <div className="text-xs text-gray-500">Weekly visitors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {community.weeklyContributions !== undefined
                          ? community.weeklyContributions >= 1000000
                            ? `${(community.weeklyContributions / 1000000).toFixed(1)}M`
                            : community.weeklyContributions >= 1000
                            ? `${(community.weeklyContributions / 1000).toFixed(1)}K`
                            : community.weeklyContributions.toLocaleString()
                          : '0'}
                      </div>
                      <div className="text-xs text-gray-500">Weekly contributions</div>
                    </div>
                  </div>
                </div>

              {/* Moderators */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    Moderators
                  </h4>
                  {user && !isAdmin && !isModerator && (
                    <button
                      onClick={handleRequestModerator}
                      disabled={sendingRequest}
                      className="text-xs font-semibold text-green-600 hover:text-green-700"
                    >
                      {sendingRequest ? 'Requesting...' : 'Request mod'}
                    </button>
                  )}
                </div>

                {user && !isAdmin && !isModerator && (
                  <div className="space-y-2">
                    <textarea
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Why should you be a moderator?"
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                      rows={2}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold">
                      {community.creatorName?.charAt(0) || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 truncate">{community.creatorName || 'Admin'}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Admin</span>
                      </div>
                    </div>
                  </div>
                  {loadingModerators && <div className="text-xs text-gray-500">Loading moderators...</div>}
                  {!loadingModerators && moderators.length === 0 && (
                    <div className="text-xs text-gray-500">No moderators yet.</div>
                  )}
                  {!loadingModerators && moderators.length > 0 && (
                    <div className="space-y-2">
                      {moderators.map((mod) => (
                        <div key={mod.userId} className="flex items-center gap-2">
                          {mod.userPhotoUrl ? (
                            <img src={mod.userPhotoUrl} alt={mod.userName} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold">
                              {mod.userName?.charAt(0) || 'M'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 truncate">{mod.userName}</span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Moderator</span>
                            </div>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => handleRemoveModerator(mod.userId)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-700">Message admin/mods</label>
                    <div className="flex items-center gap-2">
                      <input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <select
                        value={messageTarget}
                        onChange={(e) => setMessageTarget(e.target.value as 'admin' | 'moderators')}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="moderators">Mods</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={handleSendModeratorMessage}
                        className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-semibold text-gray-900 uppercase">Requests</h5>
                      {loadingRequests && <span className="text-[11px] text-gray-500">Loading...</span>}
                    </div>
                    {modRequests.length === 0 && !loadingRequests && (
                      <div className="text-xs text-gray-500">No pending requests.</div>
                    )}
                    {modRequests.map((req) => (
                      <div key={req.id} className="flex items-center gap-2">
                        {req.userPhotoUrl ? (
                          <img src={req.userPhotoUrl} alt={req.userName} className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-xs">
                            {req.userName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{req.userName}</div>
                          {req.message && <div className="text-xs text-gray-600 line-clamp-2">{req.message}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveModerator(req)}
                            className="text-xs text-green-600 hover:text-green-700 font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectModerator(req)}
                            className="text-xs text-red-600 hover:text-red-700 font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

              {/* User Achievements */}
              {user && isMember && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-gray-900 uppercase">Community Achievements</h4>
                    <button
                      onClick={() => setShowAllAchievements(!showAllAchievements)}
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      {showAllAchievements ? 'Show Less' : 'View All'}
                    </button>
                  </div>
                  {!showAllAchievements ? (
                    // Show only unlocked achievements (first 4)
                    userAchievements.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {userAchievements.slice(0, 4).map((achievement) => {
                            const def = getAchievementDefinition(achievement.achievementType);
                            if (!def) return null;
                            return (
                              <div
                                key={achievement.id}
                                className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:border-green-300 transition-colors"
                                title={def.description}
                              >
                                <span className="text-2xl mb-1">{def.icon}</span>
                                <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">
                                  {def.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {userAchievements.length} of {ACHIEVEMENT_DEFINITIONS.length} unlocked
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-500 text-center py-2">
                        No achievements unlocked yet. Click "View All" to see available badges.
                      </div>
                    )
                  ) : (
                    // Show all achievements (locked and unlocked)
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {ACHIEVEMENT_DEFINITIONS.map((def) => {
                        const unlockedAchievement = userAchievements.find(
                          a => a.achievementType === def.type
                        );
                        const isUnlocked = !!unlockedAchievement;
                        
                        return (
                          <div
                            key={def.type}
                            className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                              isUnlocked
                                ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                                : 'bg-gray-50 border-gray-200 opacity-60'
                            }`}
                          >
                            <div className={`text-2xl flex-shrink-0 ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                              {def.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {def.name}
                                </span>
                                {isUnlocked && (
                                  <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                                    Unlocked
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-600 mt-0.5">{def.description}</p>
                              {isUnlocked && unlockedAchievement && (
                                <p className="text-[10px] text-gray-500 mt-1">
                                  Unlocked {(() => {
                                    let date: Date;
                                    if (unlockedAchievement.unlockedAt instanceof Date) {
                                      date = unlockedAchievement.unlockedAt;
                                    } else if (unlockedAchievement.unlockedAt && typeof (unlockedAchievement.unlockedAt as any).toDate === 'function') {
                                      date = (unlockedAchievement.unlockedAt as any).toDate();
                                    } else {
                                      date = new Date();
                                    }
                                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                  })()}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

      {/* Crosspost Modal */}
      {crosspostModalPost && (
        <CrosspostModal
          isOpen={!!crosspostModalPost}
          onClose={() => setCrosspostModalPost(null)}
          postId={crosspostModalPost.id}
          postTitle={crosspostModalPost.title}
          onSuccess={() => {
            setCrosspostModalPost(null);
            // Optionally refresh posts
          }}
        />
      )}
    </div>
  );
}

