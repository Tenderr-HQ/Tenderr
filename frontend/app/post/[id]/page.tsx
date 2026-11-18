
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Comment = {
  id: number;
  author: string;
  username: string;
  content: string;
  time: string;
  anonymous: boolean;
};

const initialComments: Comment[] = [
  {
    id: 1,
    author: "Sarah Johnson",
    username: "@sarahj",
    content:
      "I completely understand this feeling. Sometimes having someone who listens without judging makes a huge difference.",
    time: "2 hours ago",
    anonymous: false,
  },
  {
    id: 2,
    author: "Anonymous",
    username: "",
    content:
      "I went through something similar. Give yourself time. You don't have to figure everything out today.",
    time: "1 hour ago",
    anonymous: true,
  },
  {
    id: 3,
    author: "David",
    username: "@davidwrites",
    content:
      "Thank you for sharing this. I hope things get better for you.",
    time: "30 minutes ago",
    anonymous: false,
  },
];

const demoPost = {
  author: "Anonymous",
  username: "",
  category: "Mental Wellbeing",
  time: "3 hours ago",
  content:
    "Sometimes I feel like I'm doing everything right, but somehow nothing seems to be working out. I keep showing up every day, smiling and pretending everything is fine, but deep down I'm exhausted. I wish I had someone I could talk to without feeling like I'm being judged.",
  likes: 128,
  comments: 24,
};

export default function PostDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id;

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState("");
  const [showShareNotice, setShowShareNotice] = useState(false);

  const handleComment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!commentText.trim()) {
      setError("Please write something before commenting.");
      return;
    }

    const newComment: Comment = {
      id: Date.now(),
      author: anonymous ? "Anonymous" : "You",
      username: anonymous ? "" : "@yourusername",
      content: commentText.trim(),
      time: "Just now",
      anonymous,
    };

    // Demo only: connect this to your Django comments endpoint.
    setComments((previous) => [...previous, newComment]);
    setCommentText("");
  };

  const handleShare = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "A conversation on Tenderr",
          text: "Join this conversation on Tenderr.",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShowShareNotice(true);
        setTimeout(() => setShowShareNotice(false), 2500);
      }
    } catch {
      // Sharing was cancelled or unavailable.
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      >
        <span>←</span> Back
      </button>

      {/* Post */}
      <article className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-lg">
              👤
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                {demoPost.author}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {demoPost.time}
              </p>
            </div>
          </div>

          <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300">
            {demoPost.category}
          </span>
        </div>

        <p className="mt-6 whitespace-pre-wrap text-sm leading-8 text-gray-200 sm:text-base">
          {demoPost.content}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#2b2038] pb-5 text-xs text-gray-500">
          <span>{demoPost.likes + (liked ? 1 : 0)} people found this meaningful</span>
          <span>{comments.length} comments shown</span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-4">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/5 ${
              liked ? "text-purple-400" : "text-gray-400"
            }`}
          >
            <span>{liked ? "♥" : "♡"}</span>
            <span>{liked ? "Liked" : "Like"}</span>
          </button>

          <button
            onClick={handleShare}
            className="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            ↗ Share
          </button>

          <button
            onClick={() => setSaved(!saved)}
            className={`rounded-lg px-3 py-2 text-sm transition hover:bg-white/5 ${
              saved ? "text-purple-400" : "text-gray-400"
            }`}
          >
            {saved ? "★ Saved" : "☆ Save"}
          </button>
        </div>

        {showShareNotice && (
          <p className="mt-3 text-xs text-green-400">
            Link copied to clipboard.
          </p>
        )}
      </article>

      {/* Comments */}
      <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Comments</h2>
            <p className="mt-1 text-xs text-gray-500">
              Join the conversation.
            </p>
          </div>

          <span className="rounded-lg bg-[#1d1629] px-3 py-2 text-xs text-gray-400">
            {comments.length} comments
          </span>
        </div>

        <form onSubmit={handleComment} className="mt-6">
          <div className="rounded-xl border border-[#352744] bg-[#1d1629] p-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              maxLength={1000}
              className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-gray-600"
            />

            <div className="mt-3 flex flex-col gap-3 border-t border-[#352744] pt-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="accent-purple-500"
                />
                Comment anonymously
              </label>

              <span className="text-xs text-gray-500">
                {commentText.length}/1000
              </span>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 sm:w-auto"
          >
            Post comment
          </button>
        </form>

        <div className="mt-8 space-y-6">
          {comments.map((comment) => (
            <article key={comment.id} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2b2038] text-sm text-purple-300">
                {comment.anonymous
                  ? "?"
                  : comment.author.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">
                    {comment.author}
                  </p>

                  {comment.username && (
                    <span className="text-xs text-gray-500">
                      {comment.username}
                    </span>
                  )}

                  <span className="text-xs text-gray-600">
                    · {comment.time}
                  </span>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-400">
                  {comment.content}
                </p>

                <button className="mt-3 text-xs font-medium text-gray-500 transition hover:text-purple-400">
                  Reply
                </button>
              </div>
            </article>
          ))}
        </div>

        {comments.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">
            No comments yet. Be the first to join the conversation.
          </p>
        )}
      </section>

      <div className="pb-4 text-center">
        <Link
          href="/home"
          className="text-sm font-medium text-purple-400 transition hover:text-purple-300"
        >
          Explore more conversations →
        </Link>
      </div>
    </div>
  );
}
