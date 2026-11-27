
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe } from "@/lib/api/accounts";
import { getMyPosts } from "@/lib/api/posts";
import type { MeDto, PostDto } from "@/lib/api/types";

const categoryLabels: Record<string, string> = {
  love: "Love",
  life: "Life",
  mental_health: "Mental Health",
  family: "Family",
};

function formatDate(date: string) {
  if (!date) return "Recently joined";

  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatPostDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Posts");

  const [user, setUser] = useState<MeDto | null>(null);
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [postsCount, setPostsCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  const [error, setError] = useState("");
  const [postsError, setPostsError] = useState("");

  // Fetch current user's profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        setError("");

        const data = await getMe();
        setUser(data);
      } catch {
        setError("We couldn't load your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  // Fetch current user's posts
  useEffect(() => {
    async function fetchMyPosts() {
      try {
        setPostsError("");

        const response = await getMyPosts();

        setPosts(response.results);
        setPostsCount(response.count);
      } catch {
        setPostsError("Couldn't load your posts. Please try again.");
      } finally {
        setPostsLoading(false);
      }
    }

    fetchMyPosts();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse">
        <div className="h-40 rounded-2xl bg-[#21172d]" />
        <div className="mt-5 h-8 w-48 rounded bg-[#21172d]" />
        <div className="mt-3 h-4 w-32 rounded bg-[#21172d]" />
        <div className="mt-8 h-32 rounded-2xl bg-[#21172d]" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-[#2b2038] bg-[#15101e] p-8 text-center">
        <p className="text-sm text-red-400">
          {error || "Profile information is unavailable."}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const displayName =
    user.display_name || user.full_name || user.username;

  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const bio =
    user.bio ||
    "You haven't added a bio yet. Tell people a little about yourself.";

  return (
    <div className="mx-auto max-w-4xl">
      {/* Profile header */}
      <section className="overflow-hidden rounded-2xl border border-[#2b2038] bg-[#15101e]">
        {/* Cover banner */}
        <div className="h-32 bg-gradient-to-r from-purple-950 via-purple-800 to-[#251437] sm:h-40" />

        <div className="px-5 pb-6 sm:px-7">
          {/* Avatar and edit button */}
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[#15101e] bg-purple-600 text-3xl font-bold text-white">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={`${displayName}'s profile`}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <Link
              href="/settings/edit-profile"
              className="rounded-xl border border-[#49345e] px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-purple-500 hover:bg-purple-500/10"
            >
              Edit profile
            </Link>
          </div>

          {/* User information */}
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-white">
              {displayName}
            </h1>

            <p className="mt-1 text-sm text-purple-300">
              @{user.username}
            </p>

            <p className="mt-4 max-w-xl text-sm leading-7 text-gray-300">
              {bio}
            </p>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
              <span>◷ Joined {formatDate(user.date_joined)}</span>
            </div>
          </div>

          {/* Profile statistics */}
          <div className="mt-7 grid grid-cols-3 border-t border-white/[0.07] pt-6">
            <div>
              <p className="text-xl font-bold text-white">
                {postsCount}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Posts
              </p>
            </div>

            <div>
              <p className="text-xl font-bold text-white">—</p>
              <p className="mt-1 text-xs text-gray-500">
                Followers
              </p>
            </div>

            <div>
              <p className="text-xl font-bold text-white">—</p>
              <p className="mt-1 text-xs text-gray-500">
                Following
              </p>
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
          {postsLoading ? (
            [1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-[#2b2038] bg-[#15101e] p-6"
              >
                <div className="h-4 w-28 rounded bg-[#30243c]" />
                <div className="mt-5 h-4 w-full rounded bg-[#30243c]" />
                <div className="mt-3 h-4 w-3/4 rounded bg-[#30243c]" />
              </div>
            ))
          ) : postsError ? (
            <div className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-6 text-center">
              <p className="text-sm text-red-400">
                {postsError}
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-[#2b2038] bg-[#15101e] px-5 py-12 text-center">
              <h3 className="text-lg font-semibold text-white">
                No posts yet
              </h3>

              <p className="mt-2 text-sm text-gray-400">
                Your thoughts deserve to be heard. Create your first post!
              </p>

              <Link
                href="/create-post"
                className="mt-5 inline-flex rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Create a post
              </Link>
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300">
                    {categoryLabels[post.category] || post.category}
                  </span>

                  <span className="text-xs text-gray-500">
                    {formatPostDate(post.created_at)}
                  </span>
                </div>

                <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-gray-200">
                  {post.content}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-white/[0.07] pt-4 text-xs text-gray-500">
                  <span>
                    ♥ {post.reactions.love} likes
                  </span>

                  <span>
                    ✨ {post.reactions.me_too} me too
                  </span>

                  <span>
                    ▤ {post.comments_count ?? 0} comments
                  </span>
                </div>
              </article>
            ))
          )}

          {!postsLoading && !postsError && posts.length > 0 && (
            <Link
              href="/my-posts"
              className="block py-3 text-center text-sm font-medium text-purple-400 hover:text-purple-300"
            >
              Manage all your posts →
            </Link>
          )}
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
              <p className="text-xs text-gray-500">
                Display name
              </p>
              <p className="mt-1 text-sm text-gray-200">
                {displayName}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Username
              </p>
              <p className="mt-1 text-sm text-gray-200">
                @{user.username}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Email
              </p>
              <p className="mt-1 text-sm text-gray-200">
                {user.email}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Bio
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-200">
                {bio}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Member since
              </p>
              <p className="mt-1 text-sm text-gray-200">
                {formatDate(user.date_joined)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Profile visibility
              </p>
              <p className="mt-1 text-sm text-gray-200">
                {user.is_profile_private ? "Private" : "Public"}
              </p>
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