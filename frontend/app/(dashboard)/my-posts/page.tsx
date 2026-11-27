
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyPosts } from "@/lib/api/posts";
import type { PostDto } from "@/lib/api/types";

const categoryLabels: Record<string, string> = {
  love: "Love",
  life: "Life",
  mental_health: "Mental Wellbeing",
  family: "Family",
};

export default function MyPostsPage() {
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await getMyPosts();

        const myPosts = Array.isArray(response)
          ? response
          : response.results ?? [];

        setPosts(myPosts);
      } catch (err) {
        console.error("Failed to fetch my posts:", err);
        setError("Unable to load your posts. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyPosts();
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-purple-400">
            Your activity
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            My Posts
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Manage your thoughts and conversations.
          </p>
        </div>

        <Link
          href="/create-post"
          className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          + Create post
        </Link>
      </div>

      {/* Posts heading */}
      <div className="mt-8 border-b border-white/[0.07] pb-3">
        <h2 className="text-sm font-semibold text-purple-400">
          All posts ({posts.length})
        </h2>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="py-14 text-center text-gray-400">
          Loading your posts...
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Posts */}
      {!isLoading && !error && (
        <div className="mt-5 space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => {
              const anonymous =
                post.is_anonymous ||
                post.author_info.type === "anonymous";

              return (
                <article
                  key={post.id}
                  className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6"
                >
                  {/* Category */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
                      {categoryLabels[post.category] ?? post.category}
                    </span>

                    <Link
                      href={`/post/${post.id}`}
                      className="text-xs text-purple-400 transition hover:text-purple-300"
                    >
                      View post →
                    </Link>
                  </div>

                  {/* Content */}
                  <Link
                    href={`/post/${post.id}`}
                    className="mt-5 block whitespace-pre-line text-sm leading-7 text-gray-200 transition hover:text-white"
                  >
                    {post.content}
                  </Link>

                  {/* Footer */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>
                        {anonymous
                          ? "Posted anonymously"
                          : "Posted publicly"}
                      </span>

                      <span>
                        {new Date(post.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        ♥ {post.reactions.love + post.reactions.me_too} reactions
                      </span>

                      <span>
                        ▤ {post.comments_count ?? 0} comments
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-[#2b2038] bg-[#15101e] px-5 py-14 text-center">
              <h2 className="font-semibold text-white">
                You haven't created any posts yet.
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Share what's on your mind. Your posts will appear here.
              </p>

              <Link
                href="/create-post"
                className="mt-5 inline-flex rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
              >
                Create your first post
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
