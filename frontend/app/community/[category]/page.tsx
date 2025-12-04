'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, ArrowLeft, Leaf } from 'lucide-react';
import { getTipsByCategory, CommunityPost } from '@/lib/community';
import { CATEGORY_COLORS, WasteCategoryKey } from '@/lib/stats';

export default function CategoryTipsPage() {
  const params = useParams();
  const category = params.category as WasteCategoryKey;
  const [tips, setTips] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (category) {
      loadTips();
    }
  }, [category]);

  const loadTips = async () => {
    setLoading(true);
    try {
      const fetchedTips = await getTipsByCategory(category, 20);
      setTips(fetchedTips);
    } catch (error) {
      console.error('Error loading tips:', error);
    } finally {
      setLoading(false);
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
            <span className="text-2xl font-bold text-gray-900">Eco-Eco</span>
          </Link>
          <Link href="/community" className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Community</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="px-4 py-2 rounded-lg text-lg font-bold text-white"
              style={{ backgroundColor: CATEGORY_COLORS[category] }}
            >
              {category}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Recycling Tips for {category}</h1>
          <p className="text-gray-600">Community-shared tips and best practices</p>
        </div>

        {/* Tips List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tips...</p>
          </div>
        ) : tips.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No tips yet for {category}</h3>
            <p className="text-gray-600 mb-6">Be the first to share a tip!</p>
            <Link
              href={`/community/create?category=${category}&isTip=true`}
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Share a Tip
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tips.map((tip) => (
              <Link
                key={tip.id}
                href={`/community/post/${tip.id}`}
                className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Voting */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">💡</span>
                    <span className="font-bold text-gray-900">{tip.upvotes - tip.downvotes}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        💡 Tip
                      </span>
                      <span className="text-sm text-gray-500">{formatDate(tip.createdAt)}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{tip.title}</h3>
                    <p className="text-gray-700 mb-4 whitespace-pre-line">{tip.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>by {tip.authorName}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {tip.commentCount} comments
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

