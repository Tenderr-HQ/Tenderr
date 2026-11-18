
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const categories = [
  {
    name: "Relationships",
    slug: "relationships",
    icon: "♡",
    description: "Love, dating, marriage, heartbreak and human connections.",
    posts: "2.4k",
  },
  {
    name: "Mental Wellbeing",
    slug: "mental-wellbeing",
    icon: "☁",
    description: "Emotional wellbeing, personal struggles and self-care.",
    posts: "1.8k",
  },
  {
    name: "Personal Growth",
    slug: "personal-growth",
    icon: "✦",
    description: "Self-improvement, motivation and becoming your best self.",
    posts: "956",
  },
  {
    name: "Career",
    slug: "career",
    icon: "▤",
    description: "Work life, professional growth and career decisions.",
    posts: "724",
  },
  {
    name: "Education",
    slug: "education",
    icon: "⌂",
    description: "Learning, school life, academics and student experiences.",
    posts: "612",
  },
  {
    name: "Family",
    slug: "family",
    icon: "♧",
    description: "Family relationships, parenting and home experiences.",
    posts: "540",
  },
  {
    name: "Friendship",
    slug: "friendship",
    icon: "◎",
    description: "Friendships, trust, loyalty and social connections.",
    posts: "428",
  },
  {
    name: "Lifestyle",
    slug: "lifestyle",
    icon: "✧",
    description: "Everyday life, interests, experiences and culture.",
    posts: "382",
  },
  {
    name: "Technology",
    slug: "technology",
    icon: "⌘",
    description: "Technology, innovation, digital life and creativity.",
    posts: "316",
  },
  {
    name: "Finance",
    slug: "finance",
    icon: "₦",
    description: "Money management, financial goals and experiences.",
    posts: "289",
  },
  {
    name: "Entertainment",
    slug: "entertainment",
    icon: "▷",
    description: "Movies, music, celebrities and popular culture.",
    posts: "241",
  },
  {
    name: "Other",
    slug: "other",
    icon: "•••",
    description: "Everything else you want to talk about.",
    posts: "190",
  },
];

export default function CategoriesPage() {
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter((category) =>
      `${category.name} ${category.description}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Heading */}
      <section>
        <p className="text-sm font-medium text-purple-400">
          Find your community
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Categories
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
          Explore topics that matter to you. Find conversations,
          share experiences and connect with people.
        </p>
      </section>

      {/* Search */}
      <div className="mt-7">
        <div className="flex items-center gap-3 rounded-xl border border-[#352744] bg-[#15101e] px-4 py-3.5 focus-within:border-purple-500">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5 text-gray-500"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            aria-label="Search categories"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Category count */}
      <div className="mb-5 mt-8 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">
          Browse all topics
        </h2>

        <span className="text-xs text-gray-500">
          {filteredCategories.length} categories
        </span>
      </div>

      {/* Category grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="group rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-purple-500/50 hover:bg-[#1b1427]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-2xl text-purple-400 transition group-hover:bg-purple-500/20">
                  {category.icon}
                </div>

                <span className="text-lg text-gray-600 transition group-hover:translate-x-1 group-hover:text-purple-400">
                  →
                </span>
              </div>

              <h3 className="mt-5 text-base font-semibold text-white">
                {category.name}
              </h3>

              <p className="mt-2 min-h-12 text-sm leading-6 text-gray-400">
                {category.description}
              </p>

              <div className="mt-5 border-t border-white/[0.06] pt-4">
                <span className="text-xs text-gray-500">
                  {category.posts} conversations
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#2b2038] bg-[#15101e] py-16 text-center">
          <p className="text-lg text-gray-400">No categories found</p>
          <p className="mt-2 text-sm text-gray-500">
            Try searching for another topic.
          </p>
          <button
            onClick={() => setSearch("")}
            className="mt-4 text-sm font-medium text-purple-400"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Create conversation */}
      <div className="mt-9 flex flex-col justify-between gap-4 rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <h3 className="font-semibold text-white">
            Have something to share?
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Start a conversation in a category that matters to you.
          </p>
        </div>

        <Link
          href="/create-post"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          Create a post
        </Link>
      </div>
    </div>
  );
}