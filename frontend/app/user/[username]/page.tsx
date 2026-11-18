
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Post = {
  id: number;
  category: string;
  content: string;
  time: string;
  likes: number;
  comments: number;
  anonymous: boolean;
};

const userPosts: Post[] = [
  {
    id: 1,
    category: "Personal Growth",
    content:
      "One thing I'm learning is that you cannot force people to understand your journey. Sometimes you just have to keep growing quietly.",
    time: "2 hours ago",
    likes: 42,
    comments: 12,
    anonymous: false,
  },
  {
    id: 2,
    category: "Relationships",
    content:
      "I think one of the most beautiful things in life is finding someone you can be completely yourself around.",
    time: "Yesterday",
    likes: 86,
    comments: 19,
    anonymous: false,
  },
  {
    id: 3,
    category: "Mental Wellbeing",
    content:
      "Sometimes I need to disappear for a little while, not because I don't care about anyone, but because I need time to understand myself.",
    time: "3 days ago",
    likes: 31,
    comments: 8,
    anonymous: true,
  },
];

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username || "user");

  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");

  const displayName = username
    .replace(/^@/, "")
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      >
        ← Back to Explore
      </Link>

      {/* Profile header */}
      <section className="overflow-hidden rounded-2xl border border-[#2b2038] bg-[#15101e]">
        <div className="h-32 bg-gradient-to-r from-[#32164f] via-[#54218a] to-[#251239] sm:h-44" />

        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#15101e] bg-purple-600 text-3xl font-bold text-white sm:h-28 sm:w-28">
              {displayName.charAt(0) || "U"}
            </div>

            <button
              onClick={() => setFollowing(!following)}
              className={`rounded-xl px-6 py-3 text-sm font-semibold transition ${
                following
                  ? "border border-[#49345e] bg-[#1d1629] text-white hover:border-red-500/40 hover:text-red-400"
                  : "bg-purple-600 text-white hover:bg-purple-500"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          </div>

          <div className="mt-4">
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              {displayName}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              @{username.replace(/^@/, "")}
            </p>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-400">
              Sharing thoughts, experiences and lessons from everyday life.
              Everyone has a story worth hearing.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <span>◷ Joined October 2026</span>
              <span>📍 Nigeria</span>
            </div>
          </div>

          {/* Profile statistics */}
          <div className="mt-7 flex flex-wrap gap-8 border-t border-[#2b2038] pt-6">
            <div>
              <p className="text-lg font-bold text-white">24</p>
              <p className="mt-1 text-xs text-gray-500">Posts</p>
            </div>

            <div>
              <p className="text-lg font-bold text-white">
                {following ? "1,249" : "1,248"}
              </p>
              <p className="mt-1 text-xs text-gray-500">Followers</p>
            </div>

            <div>
              <p className="text-lg font-bold text-white">386</p>
              <p className="mt-1 text-xs text-gray-500">Following</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#2b2038]">
        <button
          onClick={() => setActiveTab("posts")}
          className={`border-b-2 px-2 pb-4 text-sm font-semibold transition ${
            activeTab === "posts"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-gray-500 hover:text-white"
          }`}
        >
          Posts
        </button>

        <button
          onClick={() => setActiveTab("about")}
          className={`border-b-2 px-2 pb-4 text-sm font-semibold transition ${
            activeTab === "about"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-gray-500 hover:text-white"
          }`}
        >
          About
        </button>
      </div>

      {/* Posts */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          {userPosts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 transition hover:border-[#49345e] sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300">
                  {post.category}
                </span>

                <span className="text-xs text-gray-600">
                  {post.time}
                </span>
              </div>

              <p className="mt-5 text-sm leading-7 text-gray-300">
                {post.content}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#2b2038] pt-4">
                <div className="flex gap-5 text-xs text-gray-500">
                  <span>♡ {post.likes}</span>
                  <span>◯ {post.comments} comments</span>
                </div>

                <Link
                  href={`/post/${post.id}`}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300"
                >
                  View discussion →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* About */}
      {activeTab === "about" && (
        <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-7">
          <h2 className="text-base font-bold text-white">About {displayName}</h2>

          <p className="mt-4 text-sm leading-7 text-gray-400">
            Sharing thoughts, experiences and lessons from everyday life.
            Everyone has a story worth hearing.
          </p>

          <div className="mt-6 space-y-4 border-t border-[#2b2038] pt-5">
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="mt-1 text-sm text-gray-300">Nigeria</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Member since</p>
              <p className="mt-1 text-sm text-gray-300">October 2026</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
