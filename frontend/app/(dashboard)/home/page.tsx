
"use client";

import { useEffect, useState } from "react";
import PostCard, {
  type PostCardData,
} from "@/components/posts/PostCard";
import { getFeed } from "@/lib/api/posts";
import type { PostDto } from "@/lib/api/types";

const categoryLabels: Record<string, string> = {
  love: "Love",
  life: "Life",
  mental_health: "Mental Health",
  family: "Family",
};

export default function HomePage() {
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await getFeed();

        // Support both direct arrays and paginated responses.
        const feedPosts: PostDto[] = Array.isArray(response)
          ? response
          : response.results ?? [];

        console.log("Posts received from Django:", feedPosts);

        const formattedPosts: PostCardData[] = feedPosts.map(
          (post) => {
            const anonymous =
              post.is_anonymous ||
              post.author_info.type === "anonymous";

            return {
              id: post.id,

              author: anonymous
                ? "Anonymous"
                : post.author_info.display,

              username: anonymous
                ? undefined
                : post.author_info.username ?? undefined,

              avatar: anonymous
                ? undefined
                : post.author_info.avatar_url ?? undefined,

              anonymous,

              category:
                categoryLabels[post.category] ?? post.category,

              content: post.content,

              time: new Date(post.created_at).toLocaleString(),

              likes:
                post.reactions.love + post.reactions.me_too,

              comments: post.comments_count ?? 0,

              saved: post.is_saved,
            };
          }
        );

        setPosts(formattedPosts);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        setError("Unable to load posts. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Your Feed
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Discover conversations and share what's on your mind.
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-10 text-center text-gray-400">
          Loading posts...
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && posts.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
          <p className="font-medium text-white">
            No posts yet
          </p>

          <p className="mt-2 text-sm text-gray-400">
            There are no posts available in your feed right now.
          </p>
        </div>
      )}

      {/* Posts */}
      {!isLoading &&
        !error &&
        posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
    </div>
  );
}
