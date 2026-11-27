
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const topics = [
  "Relationships",
  "Mental Wellbeing",
  "Personal Growth",
  "Education",
  "Career",
  "Family",
  "Lifestyle",
  "Technology",
];

const discussions = [
  {
    id: 1,
    category: "Relationships",
    title: "Why is communication so difficult in relationships?",
    description:
      "Let's talk about understanding each other, expressing feelings and building healthier relationships.",
    trending: true,
  },
  {
    id: 2,
    category: "Mental Wellbeing",
    title: "It's okay to admit that you're not okay.",
    description:
      "A space for honest conversations about emotional wellbeing and the things we rarely talk about.",
    trending: true,
  },
  {
    id: 3,
    category: "Personal Growth",
    title: "Becoming the person you always wanted to be.",
    description:
      "Share your experiences, lessons and the little things helping you grow.",
    trending: false,
  },
  {
    id: 4,
    category: "Career",
    title: "Figuring out your career path.",
    description:
      "Discuss career decisions, professional challenges and finding your direction.",
    trending: false,
  },
  {
    id: 5,
    category: "Education",
    title: "The pressure to succeed academically.",
    description:
      "Talk about school, expectations, learning and balancing everything.",
    trending: false,
  },
];

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredDiscussions = useMemo(() => {
    return discussions.filter((discussion) => {
      const matchesSearch =
        discussion.title.toLowerCase().includes(search.toLowerCase()) ||
        discussion.category.toLowerCase().includes(search.toLowerCase()) ||
        discussion.description.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Most Discussed" && discussion.trending) ||
        discussion.category === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [search, activeFilter]);

  return (
    <div className="mx-auto max-w-5xl space-y-9">
      {/* Page heading */}
      <section>
        <p className="text-sm font-medium text-purple-400">
          Discover something new
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Explore
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
          Find conversations, discover different perspectives and connect
          with people who understand.
        </p>
      </section>

      {/* Search */}
      <section>
        <label htmlFor="explore-search" className="sr-only">
          Search conversations and topics
        </label>

        <div className="flex items-center gap-3 rounded-2xl border border-[#352744] bg-[#15101e] px-4 py-4 transition focus-within:border-purple-500">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5 shrink-0 text-gray-500"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>

          <input
            id="explore-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search topics, conversations..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Topics */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">
            Explore topics
          </h2>

          <Link
            href="/categories"
            className="text-xs font-medium text-purple-400 hover:text-purple-300"
          >
            View all
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => {
                setActiveFilter(topic);
                setSearch("");
              }}
              className={`rounded-full border px-4 py-2.5 text-xs font-medium transition ${
                activeFilter === topic
                  ? "border-purple-500 bg-purple-500/15 text-purple-300"
                  : "border-[#352744] bg-[#15101e] text-gray-400 hover:border-purple-500/50 hover:text-white"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </section>

      {/* Discussions */}
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Conversations worth exploring
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Discover what the community is talking about.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-[#15101e] p-1">
            {["All", "Most Discussed"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeFilter === filter
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredDiscussions.length > 0 ? (
            filteredDiscussions.map((discussion) => (
              <article
                key={discussion.id}
                className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 transition hover:border-purple-500/40 sm:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-purple-500/10 px-3 py-1.5 text-[11px] font-medium text-purple-300">
                    {discussion.category}
                  </span>

                  {discussion.trending && (
                    <span className="text-xs font-medium text-orange-300">
                      ↗ Most Discussed
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-base font-semibold leading-6 text-white">
                  {discussion.title}
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                  {discussion.description}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-white/08 pt-4">

                  <Link
                    href={`/category/${discussion.category.toLowerCase().replaceAll(" ", "-")}`}
                    className="text-xs font-semibold text-purple-400 transition hover:text-purple-300"
                  >
                    Explore topic →
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-[#2b2038] bg-[#15101e] px-5 py-14 text-center">
              <div className="text-3xl text-gray-500">⌕</div>

              <h3 className="mt-3 font-semibold text-white">
                No conversations found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Try another search or explore a different topic.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setActiveFilter("All");
                }}
                className="mt-5 text-sm font-medium text-purple-400 hover:text-purple-300"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
