
"use client";

import { useState } from "react";
import Link from "next/link";

const userPosts = [
  {
    id: 1,
    category: "Personal Growth",
    date: "Today",
    content:
      "I've realized that growth sometimes means walking away from things that no longer give you peace. Not everything deserves another chance.",
    likes: 24,
    comments: 8,
    anonymous: false,
  },
  {
    id: 2,
    category: "Relationships",
    date: "Yesterday",
    content:
      "One thing I value most is consistency. It's easy to say you care about someone, but your actions should make them feel it.",
    likes: 18,
    comments: 6,
    anonymous: false,
  },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Posts");

  return (
    <div className="mx-auto max-w-4xl">
      {/* Profile header */}
      <section className="overflow-hidden rounded-2xl border border-[#2b2038] bg-[#15101e]">
        <div className="h-32 bg-gradient-to-r from-purple-950 via-purple-800 to-[#251437] sm:h-40" />

        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#15101e] bg-purple-600 text-3xl font-bold text-white">
              U
            </div>

            <Link
              href="/settings/edit-profile"
              className="rounded-xl border border-[#49345e] px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-purple-500 hover:bg-purple-500/10"
            >
              Edit profile
            </Link>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold text-white">
              Your Name
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              @yourusername
            </p>

            <p className="mt-4 max-w-xl text-sm leading-7 text-gray-300">
              Sharing thoughts, learning, growing and connecting with people.
              Everyone deserves a space where their voice matters.
            </p>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
              <span>◷ Joined recently</span>
              <span>📍 Your location</span>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-7 grid grid-cols-3 border-t border-white/[0.07] pt-6">
            <div>
              <p className="text-xl font-bold text-white">12</p>
              <p className="mt-1 text-xs text-gray-500">Posts</p>
            </div>

            <div>
              <p className="text-xl font-bold text-white">248</p>
              <p className="mt-1 text-xs text-gray-500">Followers</p>
            </div>

            <div>
              <p className="text-xl font-bold text-white">86</p>
              <p className="mt-1 text-xs text-gray-500">Following</p>
            </div>
          </div>
        </div>
      </section>

      {/* Profile navigation */}
      <div className="mt-7 flex gap-7 border-b border-white/[0.07]">
        {["Posts", "About"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative pb-3 text-sm font-medium transition ${
              activeTab === tab
                ? "text-purple-400"
                : "text-gray-500 hover:text-white"
            }`}
          >
            {tab}

            {activeTab === tab && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-purple-500" />
            )}
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {activeTab === "Posts" && (
        <div className="mt-5 space-y-4">
          {userPosts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300">
                  {post.category}
                </span>

                <span className="text-xs text-gray-500">
                  {post.date}
                </span>
              </div>

              <p className="mt-5 text-sm leading-7 text-gray-200">
                {post.content}
              </p>

              <div className="mt-5 flex items-center gap-5 border-t border-white/[0.07] pt-4 text-xs text-gray-500">
                <span>♥ {post.likes} likes</span>
                <span>▤ {post.comments} comments</span>
              </div>
            </article>
          ))}

          <Link
            href="/my-posts"
            className="block py-3 text-center text-sm font-medium text-purple-400 hover:text-purple-300"
          >
            Manage all your posts →
          </Link>
        </div>
      )}

      {/* About tab */}
      {activeTab === "About" && (
        <section className="mt-5 rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6">
          <h2 className="text-base font-semibold text-white">
            About this profile
          </h2>

          <div className="mt-5 space-y-5">
            <div>
              <p className="text-xs text-gray-500">Display name</p>
              <p className="mt-1 text-sm text-gray-200">Your Name</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Username</p>
              <p className="mt-1 text-sm text-gray-200">@yourusername</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Bio</p>
              <p className="mt-1 text-sm leading-6 text-gray-200">
                Sharing thoughts, learning, growing and connecting with people.
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Member since</p>
              <p className="mt-1 text-sm text-gray-200">Recently joined</p>
            </div>
          </div>

          <Link
            href="/settings/edit-profile"
            className="mt-7 inline-flex rounded-xl border border-[#49345e] px-4 py-2.5 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/10"
          >
            Edit your information
          </Link>
        </section>
      )}
    </div>
  );
}