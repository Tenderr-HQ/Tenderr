
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Post = {
  id: number;
  author: string;
  username: string;
  anonymous: boolean;
  content: string;
  time: string;
  likes: number;
  comments: number;
  trending: boolean;
};

const categoryInfo: Record<
  string,
  { title: string; icon: string; description: string }
> = {
  relationships: {
    title: "Relationships",
    icon: "♡",
    description:
      "Talk about love, dating, heartbreak, friendship and the connections that shape our lives.",
  },
  "mental-wellbeing": {
    title: "Mental Wellbeing",
    icon: "☁",
    description:
      "A place to discuss emotional wellbeing, personal struggles and finding support.",
  },
  "personal-growth": {
    title: "Personal Growth",
    icon: "✦",
    description:
      "Share lessons, challenges and experiences that help you become a better version of yourself.",
  },
  career: {
    title: "Career",
    icon: "⌘",
    description:
      "Discuss work, career decisions, professional challenges and opportunities.",
  },
  education: {
    title: "Education",
    icon: "▤",
    description:
      "Share your experiences, questions and thoughts about learning and education.",
  },
  family: {
    title: "Family",
    icon: "⌂",
    description:
      "Talk about family relationships, responsibilities and everyday experiences.",
  },
  friendship: {
    title: "Friendship",
    icon: "♧",
    description:
      "Discuss friendships, trust, loyalty and the people who matter to you.",
  },
  lifestyle: {
    title: "Lifestyle",
    icon: "☀",
    description:
      "Share everyday experiences, interests, habits and lifestyle conversations.",
  },
  technology: {
    title: "Technology",
    icon: "⌘",
    description:
      "Talk about technology, innovation, digital life and the future.",
  },
  finance: {
    title: "Finance",
    icon: "₦",
    description:
      "Discuss money management, financial experiences, saving and personal finance.",
  },
  entertainment: {
    title: "Entertainment",
    icon: "♫",
    description:
      "Talk about movies, music, celebrities, culture and everything entertaining.",
  },
  other: {
    title: "Other",
    icon: "✧",
    description:
      "Conversations that don't fit into any other category.",
  },
};

const samplePosts: Post[] = [
  {
    id: 101,
    author: "Anonymous",
    username: "",
    anonymous: true,
    content:
      "How do you know when it's time to walk away from a relationship, even when you still love the person?",
    time: "20 minutes ago",
    likes: 84,
    comments: 32,
    trending: true,
  },
  {
    id: 102,
    author: "Michael",
    username: "@michael",
    anonymous: false,
    content:
      "I think communication is one of the most underrated things in relationships. You cannot expect someone to understand what you never explain.",
    time: "1 hour ago",
    likes: 46,
    comments: 15,
    trending: false,
  },
  {
    id: 103,
    author: "Anonymous",
    username: "",
    anonymous: true,
    content:
      "Sometimes the hardest part is accepting that someone you imagined a future with may not be part of your future anymore.",
    time: "3 hours ago",
    likes: 112,
    comments: 41,
    trending: true,
  },
  {
    id: 104,
    author: "Grace",
    username: "@gracewrites",
    anonymous: false,
    content:
      "What is one lesson your past relationships taught you that you will never forget?",
    time: "Yesterday",
    likes: 29,
    comments: 18,
    trending: false,
  },
];

export default function CategoryDetailsPage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug || "").toLowerCase();

  const category = categoryInfo[slug] ?? {
    title: slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    icon: "✧",
    description: "Explore conversations and share your thoughts with the community.",
  };

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "trending">("all");
  const [sort, setSort] = useState<"recent" | "popular">("recent");

  const filteredPosts = useMemo(() => {
    let result = samplePosts.filter((post) =>
      post.content.toLowerCase().includes(search.toLowerCase())
    );

    if (filter === "trending") {
      result = result.filter((post) => post.trending);
    }

    if (sort === "popular") {
      result = [...result].sort((a, b) => b.likes - a.likes);
    }

    return result;
  }, [search, filter, sort]);

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <Link
        href="/categories"
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      >
        ← All categories
      </Link>

      {/* Category header */}
      <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-3xl text-purple-300">
            {category.icon}
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {category.title}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-400">
              {category.description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-5 border-t border-[#2b2038] pt-5 text-xs text-gray-500">
          <span>◯ Community discussions</span>
          <span>✦ Share your experience</span>
        </div>

        <Link
          href="/create-post"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          <span className="text-lg">+</span>
          Start a conversation
        </Link>
      </section>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          ⌕
        </span>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${category.title.toLowerCase()} discussions...`}
          className="w-full rounded-xl border border-[#2b2038] bg-[#15101e] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === "all"
                ? "bg-purple-500/15 text-purple-300"
                : "text-gray-500 hover:bg-white/5 hover:text-white"
            }`}
          >
            All discussions
          </button>

          <button
            onClick={() => setFilter("trending")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === "trending"
                ? "bg-purple-500/15 text-purple-300"
                : "text-gray-500 hover:bg-white/5 hover:text-white"
            }`}
          >
            Trending
          </button>
        </div>

        <select
          value={sort}
          onChange={(e) =>
            setSort(e.target.value as "recent" | "popular")
          }
          className="rounded-lg border border-[#2b2038] bg-[#15101e] px-3 py-2 text-sm text-gray-300 outline-none focus:border-purple-500"
        >
          <option value="recent">Most recent</option>
          <option value="popular">Most popular</option>
        </select>
      </div>

      {/* Discussion list */}
      <section className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 transition hover:border-[#49345e] sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-sm font-semibold text-purple-300">
                    {post.anonymous
                      ? "?"
                      : post.author.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {post.author}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {post.time}
                    </p>
                  </div>
                </div>

                {post.trending && (
                  <span className="shrink-0 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300">
                    Trending
                  </span>
                )}
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
                  className="text-xs font-semibold text-purple-400 transition hover:text-purple-300"
                >
                  Join discussion →
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#49345e] px-5 py-14 text-center">
            <div className="text-3xl text-gray-600">⌕</div>
            <h3 className="mt-4 text-base font-semibold text-white">
              No discussions found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Try another search or start a new conversation.
            </p>

            <Link
              href="/create-post"
              className="mt-5 inline-flex rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-500"
            >
              Create a post
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
