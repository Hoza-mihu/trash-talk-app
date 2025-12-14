'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, ArrowRightLeft, Code, Check, Share2 } from 'lucide-react';

interface ShareDropdownProps {
  postId: string;
  postTitle: string;
  postImageUrl?: string;
  onCrosspostClick?: () => void;
}

export default function ShareDropdown({ postId, postTitle, postImageUrl, onCrosspostClick }: ShareDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [showEmbed, setShowEmbed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const embedTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const postUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/community/post/${postId}`
    : '';

  const embedUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/embed/post/${postId}`
    : `${process.env.NEXT_PUBLIC_APP_URL || ''}/embed/post/${postId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = postUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 2000);
    }
  };

  const handleCrosspost = () => {
    setIsOpen(false);
    if (onCrosspostClick) {
      onCrosspostClick(); // Will trigger crosspost modal
    }
  };

  const handleEmbed = () => {
    const embedHtml = `<iframe src="${embedUrl}" width="720" height="820" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;" loading="lazy" title="Eco-Eco post"></iframe>`;
    setEmbedCode(embedHtml);
    setShowEmbed(true);
    // Focus and select for quick copy
    setTimeout(() => {
      embedTextareaRef.current?.focus();
      embedTextareaRef.current?.select();
    }, 50);
  };

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
        setShowEmbed(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy embed code:', err);
    }
  };

  return (
    <div className="relative inline-flex" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
          setShowEmbed(false);
        }}
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-full shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <Share2 className="w-4 h-4 text-gray-500" />
        <span>Share</span>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 mt-2 w-64 rounded-lg bg-slate-900 text-white shadow-2xl ring-1 ring-black/10 z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {!showEmbed ? (
            <div className="py-1">
              <div className="px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-white/60">
                Share options
              </div>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors text-left"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-200">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white/70 flex-shrink-0" />
                    <span>Copy link</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCrosspost}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors text-left"
              >
                <ArrowRightLeft className="w-4 h-4 text-white/70 flex-shrink-0" />
                <span>Crosspost</span>
              </button>

              <button
                onClick={handleEmbed}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors text-left"
              >
                <Code className="w-4 h-4 text-white/70 flex-shrink-0" />
                <span>Embed</span>
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4 bg-slate-900">
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">
                  Embed code
                </label>
                <p className="text-xs text-white/60">
                  Paste this into your site or blog to show the Eco-Eco post preview.
                </p>
                <textarea
                  value={embedCode}
                  readOnly
                  ref={embedTextareaRef}
                  onFocus={(e) => e.target.select()}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-[13px] font-mono text-white resize-none focus:outline-none focus:ring-1 focus:ring-emerald-400 shadow-inner"
                  rows={5}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyEmbedCode}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-md hover:bg-emerald-600 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <a
                  href={embedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2 border border-slate-700 text-xs font-semibold rounded-md text-white hover:bg-white/5 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Preview
                </a>
                <button
                  onClick={() => {
                    setShowEmbed(false);
                    setIsOpen(false);
                  }}
                  className="px-3 py-2 border border-slate-700 text-xs font-semibold rounded-md text-white hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

