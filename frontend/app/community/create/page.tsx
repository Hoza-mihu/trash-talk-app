'use client';

import { useState, useEffect, Suspense, startTransition, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Leaf, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createPost, shareRecyclingStats } from '@/lib/community';
import { CATEGORY_KEYS, CATEGORY_COLORS, WasteCategoryKey } from '@/lib/stats';
import { getUserStats } from '@/lib/utils';

function CreatePostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<WasteCategoryKey>(
    (searchParams.get('category') as WasteCategoryKey) || 'Other'
  );
  const [isTip, setIsTip] = useState(searchParams.get('isTip') === 'true');
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  useEffect(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory && CATEGORY_KEYS.includes(urlCategory as WasteCategoryKey)) {
      setCategory(urlCategory as WasteCategoryKey);
    }
  }, [searchParams]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShareStats = async () => {
    if (!user || submitting || isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
    setSubmitting(true);
    
    // Defer async work to next tick to prevent blocking UI
    queueMicrotask(async () => {
      try {
        const stats = await getUserStats(user.uid);
        if (stats) {
          await shareRecyclingStats(
            user.uid,
            user.displayName || 'Anonymous',
            user.photoURL,
            stats
          );
          
          // Use startTransition for non-urgent navigation
          startTransition(() => {
            router.push('/community');
          });
        }
      } catch (error) {
        console.error('Error sharing stats:', error);
        alert('Failed to share stats. Please try again.');
        setSubmitting(false);
        isSubmittingRef.current = false;
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim() || submitting || isSubmittingRef.current) return;

    // Prevent double submission
    isSubmittingRef.current = true;
    setSubmitting(true);
    
    // Defer async work to next tick to prevent blocking UI
    queueMicrotask(async () => {
      try {
        let imageUrl: string | undefined = undefined;
        
        // Upload image to Firebase Storage if provided
        if (imageFile) {
          const { uploadPostImage } = await import('@/lib/community');
          imageUrl = await uploadPostImage(imageFile, user.uid);
        }

        await createPost(
          user.uid,
          user.displayName || 'Anonymous',
          user.photoURL,
          {
            title: title.trim(),
            content: content.trim(),
            category,
            isTip,
            imageUrl,
            tags: isTip ? ['tip', category.toLowerCase()] : [category.toLowerCase()]
          }
        );

        // Use startTransition for non-urgent navigation
        startTransition(() => {
          router.push('/community');
        });
      } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
        setSubmitting(false);
        isSubmittingRef.current = false;
      }
    });
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">Eco-Eco</span>
          </Link>
          <Link href="/community" className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Community</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Create Post</h1>

        <div className="bg-white rounded-xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WasteCategoryKey)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 !text-black"
              >
                {CATEGORY_KEYS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Tip Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isTip"
                checked={isTip}
                onChange={(e) => setIsTip(e.target.checked)}
                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="isTip" className="text-sm font-medium text-gray-700">
                Mark as Recycling Tip 💡
              </label>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 !text-black placeholder:text-gray-400"
                required
                maxLength={200}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your tip, question, or experience..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 !text-black placeholder:text-gray-400"
                rows={10}
                required
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image (optional)
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <ImageIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-700">Choose Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim()}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting...' : 'Create Post'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Quick Share Stats */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <button
              onClick={handleShareStats}
              disabled={submitting}
              className="w-full bg-blue-50 text-blue-700 py-3 rounded-lg font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              📊 Share My Recycling Stats
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <CreatePostForm />
    </Suspense>
  );
}

