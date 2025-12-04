'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, ArrowLeft, Leaf, Globe, Eye, Lock, Search, Image as ImageIcon, Upload, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createCommunity, uploadCommunityBanner, uploadCommunityIcon, updateCommunityImages, getCommunityBySlug } from '@/lib/community';
import { getUserProfile } from '@/lib/profile';
import { CATEGORY_KEYS, WasteCategoryKey } from '@/lib/stats';

type CommunityType = 'public' | 'restricted' | 'private';

// Predefined topics for selection
const AVAILABLE_TOPICS = [
  { category: 'Anime & Cosplay', emoji: '🎌', topics: ['Anime & Manga', 'Cosplay'] },
  { category: 'Art', emoji: '🧑‍🎨', topics: ['Performing Arts', 'Architecture', 'Design', 'Art', 'Filmmaking', 'Digital Art', 'Photography'] },
  { category: 'Business & Finance', emoji: '💵', topics: ['Personal Finance', 'Crypto', 'Economics', 'Business News & Discussion', 'Deals & Marketplace', 'Startups & Entrepreneurship', 'Real Estate', 'Stocks & Investing'] },
  { category: 'Collectibles & Other Hobbies', emoji: '⚙️', topics: ['Model Building', 'Collectibles', 'Other Hobbies', 'Toys'] },
  { category: 'Environment & Sustainability', emoji: '🌱', topics: ['Recycling', 'Composting', 'Zero Waste', 'Sustainability', 'Environmental Activism', 'Green Living', 'Waste Reduction'] },
  { category: 'Technology', emoji: '💻', topics: ['Programming', 'Hardware', 'Software', 'Gadgets', 'Tech News'] },
  { category: 'Food & Cooking', emoji: '🍳', topics: ['Recipes', 'Cooking Tips', 'Food Waste Reduction', 'Meal Planning'] },
];

export default function CreateCommunityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Name and Description
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameCharCount, setNameCharCount] = useState(0);

  // Step 2: Community Type
  const [communityType, setCommunityType] = useState<CommunityType>('public');
  const [matureContent, setMatureContent] = useState(false);

  // Step 3: Topics
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicSearch, setTopicSearch] = useState('');

  // Step 4: Style (Banner and Icon)
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNameCharCount(name.length);
    if (name.length > 0 && name.length <= 21) {
      setNameError(null);
    }
  }, [name]);

  const handleNameChange = async (value: string) => {
    if (value.length > 21) return;
    setName(value);
    
    if (value.length > 0) {
      // Check if name is already taken
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      try {
        const existing = await getCommunityBySlug(slug);
        if (existing) {
          setNameError(`"r/${value}" is already taken`);
        } else {
          setNameError(null);
        }
      } catch (error) {
        // Ignore errors during typing
      }
    }
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

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else if (selectedTopics.length < 3) {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const filteredTopics = AVAILABLE_TOPICS.map(category => ({
    ...category,
    topics: category.topics.filter(topic =>
      topic.toLowerCase().includes(topicSearch.toLowerCase())
    )
  })).filter(category => category.topics.length > 0);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return name.trim().length > 0 && description.trim().length > 0 && !nameError;
      case 2:
        return true; // Community type is always selected (defaults to public)
      case 3:
        return true; // Topics are optional
      case 4:
        return true; // Banner and icon are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('Please sign in to create a community.');
      return;
    }

    if (!canProceed()) {
      setError('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const profile = await getUserProfile(user.uid);
      const userName = profile?.name || user.displayName || 'Anonymous';

      // Upload images if provided
      let bannerUrl: string | undefined = undefined;
      let iconUrl: string | undefined = undefined;

      if (bannerFile) {
        try {
          bannerUrl = await uploadCommunityBanner(bannerFile, user.uid);
        } catch (uploadError: any) {
          console.error('Banner upload error:', uploadError);
          setError(`Banner upload failed: ${uploadError.message}. Continuing without banner.`);
        }
      }

      if (iconFile) {
        try {
          iconUrl = await uploadCommunityIcon(iconFile, user.uid);
        } catch (uploadError: any) {
          console.error('Icon upload error:', uploadError);
          setError(`Icon upload failed: ${uploadError.message}. Continuing without icon.`);
        }
      }

      const communityData = {
        name: name.trim(),
        description: description.trim(),
        bannerUrl,
        iconUrl,
        communityType,
        matureContent,
        topics: selectedTopics,
        tags: selectedTopics
      };

      const communityId = await createCommunity(user.uid, userName, communityData);

      router.push(`/community/c/${communityId}`);
    } catch (error: any) {
      console.error('Error creating community:', error);
      setError(error.message || 'Failed to create community. Please try again.');
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to create a community.</p>
          <Link href="/auth" className="text-green-600 hover:text-green-700 font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={() => router.push('/community')}></div>

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full z-50 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {currentStep === 1 && 'Tell us about your community'}
            {currentStep === 2 && 'What kind of community is this?'}
            {currentStep === 3 && 'Add topics'}
            {currentStep === 4 && 'Style your community'}
          </h2>
          <button
            onClick={() => router.push('/community')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Name and Description */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <p className="text-gray-400 text-sm">
                A name and description help people understand what your community is all about.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Community name *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">r/</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="iron"
                    className="w-full pl-8 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    maxLength={21}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    {nameCharCount}/21
                  </span>
                </div>
                {nameError && (
                  <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                    <span>⚠</span>
                    <span>{nameError}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us what your community is about..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={4}
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-gray-400">{description.length}/500</p>
              </div>

              {/* Preview */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    {name.charAt(0).toUpperCase() || 'r'}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">r/{name || 'community'}</h3>
                    <p className="text-xs text-gray-400">1 weekly visitor • 1 weekly contributor</p>
                  </div>
                </div>
                {description && (
                  <p className="text-sm text-gray-300 mt-2">{description}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Community Type */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <p className="text-gray-400 text-sm">
                Decide who can view and contribute in your community. Only public communities show up in search.
                <strong className="text-white"> Important:</strong> Once set, you will need to submit a request to change your community type.
              </p>

              <div className="space-y-3">
                <label className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  communityType === 'public' ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}>
                  <input
                    type="radio"
                    name="communityType"
                    value="public"
                    checked={communityType === 'public'}
                    onChange={(e) => setCommunityType(e.target.value as CommunityType)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-white">Public</span>
                    </div>
                    <p className="text-sm text-gray-400">Anyone can view, post, and comment to this community</p>
                  </div>
                </label>

                <label className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  communityType === 'restricted' ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}>
                  <input
                    type="radio"
                    name="communityType"
                    value="restricted"
                    checked={communityType === 'restricted'}
                    onChange={(e) => setCommunityType(e.target.value as CommunityType)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-white">Restricted</span>
                    </div>
                    <p className="text-sm text-gray-400">Anyone can view, but only approved users can contribute</p>
                  </div>
                </label>

                <label className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  communityType === 'private' ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}>
                  <input
                    type="radio"
                    name="communityType"
                    value="private"
                    checked={communityType === 'private'}
                    onChange={(e) => setCommunityType(e.target.value as CommunityType)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-white">Private</span>
                    </div>
                    <p className="text-sm text-gray-400">Only approved users can view and contribute</p>
                  </div>
                </label>
              </div>

              {/* Mature Content Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-600 bg-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center text-white font-bold">
                    18
                  </div>
                  <div>
                    <p className="font-semibold text-white">Mature (18+)</p>
                    <p className="text-sm text-gray-400">Users must be over 18 to view and contribute</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMatureContent(!matureContent)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    matureContent ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    matureContent ? 'translate-x-7' : 'translate-x-0'
                  }`}></span>
                </button>
              </div>

              <p className="text-xs text-gray-400">
                By continuing, you agree to our <a href="#" className="text-green-400 hover:underline">Mod Code of Conduct</a> and acknowledge that you understand the <a href="#" className="text-green-400 hover:underline">Eco-Eco Rules</a>.
              </p>
            </div>
          )}

          {/* Step 3: Topics */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-gray-400 text-sm mb-4">
                  Add up to 3 topics to help interested users find your community.
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    placeholder="Filter topics"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-400">Topics {selectedTopics.length}/3</p>
              </div>

              {selectedTopics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className="px-3 py-1 bg-green-600 text-white rounded-full text-sm flex items-center gap-2 hover:bg-green-700"
                    >
                      {topic}
                      <X className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredTopics.map((category) => (
                  <div key={category.category}>
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <span>{category.emoji}</span>
                      {category.category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {category.topics.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => toggleTopic(topic)}
                          disabled={!selectedTopics.includes(topic) && selectedTopics.length >= 3}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedTopics.includes(topic)
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Style */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <p className="text-gray-400 text-sm">
                Adding visual flair will catch new members attention and help establish your community's culture! You can update this at any time.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Banner */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Banner</label>
                  {bannerPreview ? (
                    <div className="relative">
                      <img src={bannerPreview} alt="Banner preview" className="w-full h-32 object-cover rounded-lg" />
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
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-green-500 transition-colors bg-gray-700">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-400">Add</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
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
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-600 rounded-full cursor-pointer hover:border-green-500 transition-colors bg-gray-700">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-400">Add</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleIconChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i + 1 === currentStep ? 'bg-white' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-2 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
            )}
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Community'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
