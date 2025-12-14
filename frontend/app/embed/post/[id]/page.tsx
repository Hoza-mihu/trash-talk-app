'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Leaf, MessageSquare, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { getPostById, CommunityPost } from '@/lib/community';

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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[760px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-slate-900">Eco-Eco Embed</span>
            <span className="text-xs text-slate-500">Post preview</span>
          </div>
          <Link
            href={viewUrl}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
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
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {post.communityId && <span className="font-semibold text-emerald-700">r/{post.communityId}</span>}
                <span>•</span>
                <span>{post.category}</span>
              </div>
              <h1 className="text-lg font-semibold text-slate-900">{post.title}</h1>
            </div>

            {post.imageUrl && (
              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.title || 'Post image'}
                  className="w-full max-h-[520px] object-contain bg-slate-100"
                />
              </div>
            )}

            {post.content && (
              <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4">
                {post.content}
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <ArrowUp className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-900">{score}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>{post.commentCount} comments</span>
                </span>
              </div>
              <Link
                href={viewUrl}
                target="_blank"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors"
              >
                View full post
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

