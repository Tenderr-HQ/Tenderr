
"use client";

import { useState } from "react";
import Link from "next/link";

type Post = {
  id: number;
  content: string;
  category: string;
  date: string;
  likes: number;
  comments: number;
  anonymous: boolean;
  status: "Published" | "Draft";
};

const initialPosts: Post[] = [
  {
    id: 1,
    content:
      "Sometimes, the hardest part of life is pretending that everything is okay when deep down you're struggling. I hope everyone going through something silently finds the strength to keep going.",
    category: "Mental Wellbeing",
    date: "Today",
    likes: 24,
    comments: 8,
    anonymous: true,
    status: "Published",
  },
  {
    id: 2,
    content:
      "One thing I've learned about relationships is that communication matters more than expensive gifts. Someone who listens and understands you is worth appreciating.",
    category: "Relationships",
    date: "Yesterday",
    likes: 16,
    comments: 5,
    anonymous: false,
    status: "Published",
  },
  {
    id: 3,
    content:
      "I'm learning to stop comparing my journey with other people's progress. Everyone has their own timing.",
    category: "Personal Growth",
    date: "2 days ago",
    likes: 0,
    comments: 0,
    anonymous: true,
    status: "Draft",
  },
];

export default function MyPostsPage() {
  const [posts, setPosts] = useState(initialPosts);
  const [activeTab, setActiveTab] = useState("All");

  const filteredPosts = posts.filter((post) => {
    if (activeTab === "Published") return post.status === "Published";
    if (activeTab === "Drafts") return post.status === "Draft";
    return true;
  });

  const publishedCount = posts.filter(
    (post) => post.status === "Published"
  ).length;

  const draftCount = posts.filter(
    (post) => post.status === "Draft"
  ).length;

  function deletePost(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    setPosts((current) => current.filter((post) => post.id !== id));
  }

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

      {/* Stats */}
      <div className="mt-7 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#2b2038] bg-[#15101e] p-4">
          <p className="text-xs text-gray-500">Published posts</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {publishedCount}
          </p>
        </div>

        <div className="rounded-xl border border-[#2b2038] bg-[#15101e] p-4">
          <p className="text-xs text-gray-500">Drafts</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {draftCount}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-6 border-b border-white/[0.07]">
        {["All", "Published", "Drafts"].map((tab) => (
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

      {/* Posts */}
      <div className="mt-5 space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
                    {post.category}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      post.status === "Published"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {post.status}
                  </span>
                </div>

                <button
                  onClick={() => deletePost(post.id)}
                  aria-label="Delete post"
                  className="rounded-lg px-2 py-1 text-sm text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                >
                  Delete
                </button>
              </div>

              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-gray-200">
                {post.content}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span>
                    {post.anonymous ? "Posted anonymously" : "Posted publicly"}
                  </span>

                  <span>{post.date}</span>
                </div>

                {post.status === "Published" && (
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>♥ {post.likes} likes</span>
                    <span>▤ {post.comments} comments</span>
                  </div>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-[#2b2038] bg-[#15101e] px-5 py-14 text-center">
            <h2 className="font-semibold text-white">
              No {activeTab.toLowerCase()} posts
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your posts will appear here when you create them.
            </p>

            <Link
              href="/create-post"
              className="mt-5 inline-flex rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-500"
            >
              Create your first post
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
