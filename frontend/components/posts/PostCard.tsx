
"use client";

import { useState } from "react";
import Link from "next/link";

export type PostCardData = {
  id: number | string;
  author: string;
  username?: string;
  avatar?: string;
  anonymous: boolean;
  category: string;
  content: string;
  time: string;
  likes: number;
  comments: number;
  saved?: boolean;
};

type PostCardProps = {
  post: PostCardData;
  showCategory?: boolean;
  showAuthorLink?: boolean;
};

export default function PostCard({
  post,
  showCategory = true,
  showAuthorLink = true,
}: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(post.saved ?? false);
  const [shareNotice, setShareNotice] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join this conversation on Tenderr",
          text: post.content.slice(0, 120),
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNotice(true);
        window.setTimeout(() => setShareNotice(false), 2500);
      }
    } catch {
      // The user cancelled sharing or sharing failed.
    }
  };

  return (
    <article className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 transition-colors hover:border-[#49345e] sm:p-6">
      {/* Author information */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-purple-500/15 text-base font-semibold text-purple-300">
            {post.anonymous ? (
              "?"
            ) : post.avatar ? (
              <img
                src={post.avatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              post.author.charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0">
            {showAuthorLink && !post.anonymous && post.username ? (
              <Link
                href={`/user/${post.username.replace(/^@/, "")}`}
                className="block truncate text-sm font-semibold text-white hover:text-purple-300"
              >
                {post.author}
              </Link>
            ) : (
              <p className="truncate text-sm font-semibold text-white">
                {post.anonymous ? "Anonymous" : post.author}
              </p>
            )}

            <p className="mt-1 text-xs text-gray-500">
              {post.time}
            </p>
          </div>
        </div>

        {showCategory && (
          <Link
            href={`/category/${post.category.toLowerCase().replace(/\s+/g, "-")}`}
            className="shrink-0 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-[11px] font-medium text-purple-300 transition hover:bg-purple-500/20"
          >
            {post.category}
          </Link>
        )}
      </div>

      {/* Post content */}
      <Link
        href={`/post/${post.id}`}
        className="mt-5 block text-sm leading-7 text-gray-300 transition hover:text-white"
      >
        {post.content}
      </Link>

      {/* Engagement */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#2b2038] pt-4">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setLiked(!liked)}
            aria-label={liked ? "Unlike post" : "Like post"}
            aria-pressed={liked}
            className={`flex items-center gap-2 text-xs transition ${
              liked
                ? "text-purple-400"
                : "text-gray-500 hover:text-purple-400"
            }`}
          >
            <span className="text-lg">{liked ? "♥" : "♡"}</span>
            {post.likes + (liked ? 1 : 0)}
          </button>

          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-2 text-xs text-gray-500 transition hover:text-purple-400"
          >
            <span className="text-base">◯</span>
            {post.comments} comments
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            aria-label="Share post"
            className="text-lg text-gray-500 transition hover:text-white"
          >
            ↗
          </button>

          <button
            onClick={() => setSaved(!saved)}
            aria-label={saved ? "Remove saved post" : "Save post"}
            aria-pressed={saved}
            className={`text-lg transition ${
              saved
                ? "text-purple-400"
                : "text-gray-500 hover:text-purple-400"
            }`}
          >
            {saved ? "★" : "☆"}
          </button>
        </div>
      </div>

      {shareNotice && (
        <p className="mt-3 text-right text-xs text-green-400">
          Link copied to clipboard.
        </p>
      )}
    </article>
  );
}
