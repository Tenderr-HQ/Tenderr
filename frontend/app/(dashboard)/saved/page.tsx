
"use client";

import { useState } from "react";
import Link from "next/link";

type SavedPost = {
  id: number;
  name: string;
  username: string;
  content: string;
  category: string;
  time: string;
  likes: number;
  comments: number;
  anonymous: boolean;
};

const initialSavedPosts: SavedPost[] = [
  {
    id: 1,
    name: "Anonymous",
    username: "Hidden identity",
    content:
      "Healing is not always about becoming the person you were before. Sometimes it's about becoming someone who understands their worth and refuses to settle for less.",
    category: "Personal Growth",
    time: "2 hours ago",
    likes: 42,
    comments: 12,
    anonymous: true,
  },
  {
    id: 2,
    name: "David Williams",
    username: "@davidw",
    content:
      "Never underestimate the power of having someone who genuinely listens to you. Sometimes people don't need advice. They just need to know somebody cares.",
    category: "Relationships",
    time: "Yesterday",
    likes: 28,
    comments: 9,
    anonymous: false,
  },
  {
    id: 3,
    name: "Anonymous",
    username: "Hidden identity",
    content:
      "To anyone who feels behind in life, remember that your journey is not a competition. Keep learning, keep growing and give yourself time.",
    category: "Mental Wellbeing",
    time: "3 days ago",
    likes: 67,
    comments: 18,
    anonymous: true,
  },
];

export default function SavedPostsPage() {
  const [savedPosts, setSavedPosts] = useState(initialSavedPosts);
  const [showRemovedMessage, setShowRemovedMessage] = useState(false);

  function removeSavedPost(id: number) {
    setSavedPosts((current) =>
      current.filter((post) => post.id !== id)
    );

    setShowRemovedMessage(true);
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-purple-400">
          Your personal collection
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Saved Posts
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Keep the conversations and thoughts you want to revisit.
        </p>
      </div>

      {/* Saved count */}
      <div className="mt-7 flex items-center justify-between rounded-xl border border-[#2b2038] bg-[#15101e] p-4">
        <div>
          <p className="text-sm font-medium text-white">
            Your collection
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Posts you've saved for later.
          </p>
        </div>

        <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-purple-500/10 px-3 text-sm font-semibold text-purple-400">
          {savedPosts.length}
        </span>
      </div>

      {showRemovedMessage && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-300"
        >
          Post removed from your saved collection.
        </div>
      )}

      {/* Saved posts */}
      <div className="mt-6 space-y-4">
        {savedPosts.length > 0 ? (
          savedPosts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6"
            >
              {/* Author */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-sm font-semibold text-purple-300">
                    {post.anonymous ? "?" : post.name.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {post.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {post.username} · {post.time}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeSavedPost(post.id)}
                  className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
                  aria-label="Remove saved post"
                >
                  Remove
                </button>
              </div>

              {/* Content */}
              <p className="mt-5 text-sm leading-7 text-gray-200">
                {post.content}
              </p>

              {/* Footer */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                <span className="rounded-full bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300">
                  {post.category}
                </span>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>♥ {post.likes}</span>
                  <span>▤ {post.comments}</span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-[#2b2038] bg-[#15101e] px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-2xl text-purple-400">
              ♡
            </div>

            <h2 className="mt-5 font-semibold text-white">
              Your collection is empty
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              When you save a post, it will appear here so you can easily
              find it again.
            </p>

            <Link
              href="/explore"
              className="mt-6 inline-flex rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
            >
              Explore posts
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}