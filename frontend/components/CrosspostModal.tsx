'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { getUserCommunities, createCrosspost, Community } from '@/lib/community';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/profile';

interface CrosspostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
  onSuccess?: () => void;
}

export default function CrosspostModal({ isOpen, onClose, postId, postTitle, onSuccess }: CrosspostModalProps) {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && user) {
      loadCommunities();
    }
  }, [isOpen, user]);

  const loadCommunities = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    try {
      const userCommunities = await getUserCommunities(user.uid);
      setCommunities(userCommunities);
      if (userCommunities.length === 0) {
        setError('You need to join a community first to crosspost. Visit the community page to join.');
      }
    } catch (err) {
      console.error('Error loading communities:', err);
      setError('Failed to load communities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCommunityId) return;

    setSubmitting(true);
    setError('');
    try {
      const profile = await getUserProfile(user.uid);
      const userName = profile?.name || user.displayName || 'Anonymous';
      const userPhoto = profile?.photoUrl || user.photoURL;

      await createCrosspost(
        user.uid,
        userName,
        userPhoto,
        postId,
        selectedCommunityId
      );

      if (onSuccess) {
        onSuccess();
      }
      onClose();
      setSelectedCommunityId('');
    } catch (err: any) {
      console.error('Error creating crosspost:', err);
      setError(err.message || 'Failed to create crosspost. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Crosspost to a community</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Share this post to another community:</p>
            <p className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded border border-gray-200">
              {postTitle}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose a community
              </label>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                </div>
              ) : error && communities.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">{error}</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
                  {communities.map((community) => (
                    <label
                      key={community.id}
                      className={`block px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedCommunityId === community.id ? 'bg-green-50' : ''
                      } ${selectedCommunityId === community.id ? 'border-l-4 border-l-green-600' : 'border-l-4 border-l-transparent'}`}
                    >
                      <input
                        type="radio"
                        name="community"
                        value={community.id}
                        checked={selectedCommunityId === community.id}
                        onChange={(e) => setSelectedCommunityId(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        {community.iconUrl || community.imageUrl ? (
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
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">r/{community.name}</div>
                          <div className="text-xs text-gray-500">{community.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && communities.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedCommunityId || loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Crossposting...
                  </span>
                ) : (
                  'Crosspost'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

