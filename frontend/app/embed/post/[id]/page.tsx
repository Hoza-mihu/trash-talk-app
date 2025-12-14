'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Leaf,
  MessageSquare,
  ArrowUp,
  ExternalLink,
  Share2,
  Clock,
} from 'lucide-react';
import { getPostById, CommunityPost } from '@/lib/community';

function formatRelative(dateValue?: any) {
  if (!dateValue) return 'Recently';
  const d = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.max(1, Math.floor(diff))}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function PostEmbedPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);

  const appOrigin = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_APP_URL || '';
  }, []);

  const viewUrl = useMemo(() => {
    return appOrigin ? `${appOrigin}/community/post/${postId}` : `/community/post/${postId}`;
  }, [appOrigin, postId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const fetched = await getPostById(postId);
      setPost(fetched);
      setLoading(false);
    };
    if (postId) {
      load();
    }
  }, [postId]);

  const score = (post?.upvotes ?? 0) - (post?.downvotes ?? 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center px-4 py-6">
      <div className="text-sm text-slate-500 mb-3 font-medium">Here&apos;s your Eco-Eco embed:</div>
      <div className="w-full max-w-[720px] bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white/70 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
              {post?.communityId ? post.communityId.charAt(0).toUpperCase() : 'E'}
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2 text-sm">
                {post?.communityId ? (
                  <Link
                    href={`/community/c/${post.communityId}`}
                    target="_blank"
                    className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors"
                  >
                    r/{post.communityId}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-900">Eco-Eco</span>
                )}
                <span className="text-slate-400">•</span>
                <span className="text-emerald-700 font-medium">{post?.category}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">u/{post?.authorName || 'anonymous'}</span>
                <Clock className="w-3.5 h-3.5" />
                <span>{formatRelative(post?.createdAt)}</span>
              </div>
            </div>
          </div>
          <Link
            href={viewUrl}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
          >
            View on Eco-Eco
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-center text-slate-500">Loading embed...</div>
        ) : !post ? (
          <div className="p-6 text-center text-slate-500">Post not found.</div>
        ) : (
          <div className="p-4 space-y-4">
            <h1 className="text-lg font-semibold text-slate-900 leading-snug">{post.title}</h1>

            {post.imageUrl && (
              <div className="relative w-full rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.title || 'Post image'}
                  className="w-full max-h-[520px] object-contain bg-slate-100"
                />
                <Link
                  href={viewUrl}
                  target="_blank"
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs font-semibold text-slate-800 shadow hover:bg-white transition-colors"
                >
                  View on Eco-Eco
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {post.content && (
              <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-4">
                {post.content}
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-5">
                <span className="inline-flex items-center gap-1.5">
                  <ArrowUp className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-900">{score}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>{post.commentCount} comments</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </span>
              </div>
              <Link
                href={viewUrl}
                target="_blank"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors"
              >
                Open full post
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

