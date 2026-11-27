
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getSavedPosts,
  toggleSavePost,
} from "@/lib/api/posts";
import type { PostDto } from "@/lib/api/types";

const categoryLabels: Record<string, string> = {
  love: "Love",
  life: "Life",
  mental_health: "Mental Wellbeing",
  family: "Family",
};

export default function SavedPostsPage() {
  const [savedPosts, setSavedPosts] = useState<PostDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [showRemovedMessage, setShowRemovedMessage] = useState(false);

  // Fetch saved posts from Django
  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await getSavedPosts();

        const posts = Array.isArray(response)
          ? response
          : response.results ?? [];

        setSavedPosts(posts);
      } catch (err) {
        console.error("Failed to fetch saved posts:", err);
        setError("Unable to load your saved posts. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedPosts();
  }, []);

  // Remove a saved post through Django
  async function removeSavedPost(id: string) {
    try {
      setRemovingIds((current) => [...current, id]);
      setError("");
      setShowRemovedMessage(false);

      const response = await toggleSavePost(id);

      if (!response.saved) {
        setSavedPosts((current) =>
          current.filter((post) => post.id !== id)
        );

        setShowRemovedMessage(true);
      }
    } catch (err) {
      console.error("Failed to remove saved post:", err);
      setError("Unable to remove this post. Please try again.");
    } finally {
      setRemovingIds((current) =>
        current.filter((postId) => postId !== id)
      );
    }
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

      {/* Removed message */}
      {showRemovedMessage && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-300"
        >
          Post removed from your saved collection.
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="py-14 text-center text-gray-400">
          Loading your saved posts...
        </div>
      )}

      {/* Saved posts */}
      {!isLoading && (
        <div className="mt-6 space-y-4">
          {savedPosts.length > 0 ? (
            savedPosts.map((post) => {
              const anonymous =
                post.is_anonymous ||
                post.author_info.type === "anonymous";

              const author = post.author_info;

              const isRemoving = removingIds.includes(post.id);

              return (
                <article
                  key={post.id}
                  className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6"
                >
                  {/* Author */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-purple-500/10 text-sm font-semibold text-purple-300">
                        {anonymous ? (
                          "?"
                        ) : author.avatar_url ? (
                          <img
                            src={author.avatar_url}
                            alt={author.display}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          author.display.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        {author.clickable &&
                        !anonymous &&
                        author.username ? (
                          <Link
                            href={`/profile/${author.username.replace(/^@/, "")}`}
                            className="block truncate text-sm font-semibold text-white hover:text-purple-300"
                          >
                            {author.display}
                          </Link>
                        ) : (
                          <p className="truncate text-sm font-semibold text-white">
                            {anonymous ? "Anonymous" : author.display}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-gray-500">
                          {anonymous
                            ? "Hidden identity"
                            : author.username
                              ? `@${author.username.replace(/^@/, "")}`
                              : "Tenderr member"}{" "}
                          · {new Date(post.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeSavedPost(post.id)}
                      disabled={isRemoving}
                      className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Remove saved post"
                    >
                      {isRemoving ? "Removing..." : "Remove"}
                    </button>
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
                    <span className="rounded-full bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300">
                      {categoryLabels[post.category] ?? post.category}
                    </span>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        ♥ {post.reactions.love + post.reactions.me_too}
                      </span>

                      <span>
                        ▤ {post.comments_count ?? 0}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
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
      )}
    </div>
  );
}