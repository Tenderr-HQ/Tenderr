feature/frontend

import PostCard from "@/components/posts/PostCard";

const posts = [
  {
    id: 1,
    author: "Anonymous",
    anonymous: true,
    category: "Relationships",
    content:
      "Sometimes walking away is the hardest decision, especially when you still love someone. But choosing your peace is important too.",
    time: "2 hours ago",
    likes: 45,
    comments: 12,
  },
  {
    id: 2,
    author: "Michael",
    username: "@michael",
    anonymous: false,
    category: "Personal Growth",
    content:
      "Your growth doesn't have to make sense to everyone. Keep becoming the person you want to be.",
    time: "4 hours ago",
    likes: 28,
    comments: 8,
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Your Feed
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Discover conversations and share what's on your mind.
        </p>
      </div>

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
"use client";

import { useMemo, useRef, useState } from "react";

/* ------------------------------- Icons (inline, no dependency) ------------------------------- */

type IconProps = { size?: number; fill?: string; className?: string };

function makeIcon(paths: React.ReactNode) {
  return function Icon({ size = 24, fill = "none", className }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={fill}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {paths}
      </svg>
    );
  };
}

const Bell = makeIcon(<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>);
const Bookmark = makeIcon(<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />);
const Briefcase = makeIcon(<><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" /></>);
const Brain = makeIcon(<><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" /><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /></>);
const Clock = makeIcon(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>);
const Compass = makeIcon(<><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></>);
const Flame = makeIcon(<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />);
const Globe = makeIcon(<><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></>);
const Heart = makeIcon(<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />);
const Home = makeIcon(<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>);
const ImageIcon = makeIcon(<><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></>);
const LayoutGrid = makeIcon(<><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></>);
const MessageCircle = makeIcon(<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />);
const MessageSquare = makeIcon(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />);
const MoreHorizontal = makeIcon(<><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>);
const Plus = makeIcon(<><path d="M5 12h14" /><path d="M12 5v14" /></>);
const Search = makeIcon(<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>);
const Send = makeIcon(<><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>);
const Share2 = makeIcon(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></>);
const User = makeIcon(<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>);
const Users = makeIcon(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>);
const VenetianMask = makeIcon(<><path d="M18 11c-1.5 0-2.5.5-3 2" /><path d="M4 6a2 2 0 0 0-2 2v4a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V8a2 2 0 0 0-2-2h-3a8 8 0 0 0-5 2 8 8 0 0 0-5-2z" /><path d="M6 11c1.5 0 2.5.5 3 2" /></>);
const X = makeIcon(<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>);

/* ----------------------------- Types & data ----------------------------- */

type Tab = "for-you" | "following" | "trending" | "recent";
type Category = "All" | "Relationships" | "Mental Health" | "Work" | "Family";

interface Post {
  id: string;
  author: string;
  anonymous: boolean;
  avatarUrl?: string;
  text: string;
  imageUrl?: string;
  category: Exclude<Category, "All">;
  createdAt: number;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  saved: boolean;
  following: boolean;
}

const HOUR = 60 * 60 * 1000;
const now = Date.now();

const SEED_POSTS: Post[] = [
  {
    id: "1",
    author: "Anonymous",
    anonymous: true,
    text: "I'm tired of pretending I'm okay.\nLately, everything just feels heavy... 😔",
    category: "Mental Health",
    createdAt: now - 2 * HOUR,
    likes: 1400,
    comments: 328,
    shares: 96,
    liked: false,
    saved: false,
    following: false,
  },
  {
    id: "2",
    author: "Amara K.",
    anonymous: false,
    // avatarUrl: "/avatars/amara.jpg",
    text: "Sometimes, you have to choose your peace,\neven if it means letting go of people you love. 💜",
    category: "Relationships",
    createdAt: now - 4 * HOUR,
    likes: 2300,
    comments: 417,
    shares: 210,
    liked: false,
    saved: false,
    following: true,
  },
  {
    id: "3",
    author: "Anonymous",
    anonymous: true,
    text: "Is it normal to feel lonely even when you're surrounded by people? 🤔",
    category: "Mental Health",
    createdAt: now - 6 * HOUR,
    likes: 864,
    comments: 152,
    shares: 41,
    liked: false,
    saved: false,
    following: false,
  },
  {
    id: "4",
    author: "Tunde A.",
    anonymous: false,
    text: "Got passed over for the promotion again. Smiling in meetings is getting harder.",
    category: "Work",
    createdAt: now - 9 * HOUR,
    likes: 530,
    comments: 87,
    shares: 12,
    liked: false,
    saved: false,
    following: true,
  },
  {
    id: "5",
    author: "Anonymous",
    anonymous: true,
    text: "My family keeps asking when I'll 'settle down'. I just want to be heard, not fixed.",
    category: "Family",
    createdAt: now - 12 * HOUR,
    likes: 975,
    comments: 203,
    shares: 58,
    liked: false,
    saved: false,
    following: false,
  },
];

const TABS: { id: Tab; label: string; icon?: React.ReactNode }[] = [
  { id: "for-you", label: "For You" },
  { id: "following", label: "Following", icon: undefined },
  { id: "trending", label: "Trending", icon: <Flame size={16} /> },
  { id: "recent", label: "Recent", icon: <Clock size={16} /> },
];

const CATEGORIES: { id: Category; icon: React.ReactNode }[] = [
  { id: "All", icon: <LayoutGrid size={16} /> },
  { id: "Relationships", icon: <Heart size={16} /> },
  { id: "Mental Health", icon: <Brain size={16} /> },
  { id: "Work", icon: <Briefcase size={16} /> },
  { id: "Family", icon: <Users size={16} /> },
];

/* -------------------------------- Helpers ------------------------------- */

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function timeAgo(ts: number) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

/* ------------------------------ Small pieces ----------------------------- */

function HoodedAvatar({ size = 48 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="shrink-0 overflow-hidden rounded-full border border-purple-400/40 bg-linear-to-b from-purple-700/60 to-purple-950"
    >
      <svg viewBox="0 0 48 48" className="h-full w-full">
        <path d="M24 6c-9 0-15 7-15 17 0 7 3 13 6 19h18c3-6 6-12 6-19C39 13 33 6 24 6z" fill="#120a24" />
        <ellipse cx="24" cy="25" rx="9" ry="11" fill="#05030b" />
        <ellipse cx="20.3" cy="23.5" rx="1.6" ry="0.9" fill="#a78bfa" />
        <ellipse cx="27.7" cy="23.5" rx="1.6" ry="0.9" fill="#a78bfa" />
      </svg>
    </div>
  );
}

function Avatar({ post, size = 48 }: { post: Post; size?: number }) {
  if (post.anonymous) return <HoodedAvatar size={size} />;
  if (post.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={post.avatarUrl}
        alt={post.author}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full border border-purple-400/40 object-cover"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full border border-purple-400/40 bg-linear-to-br from-orange-400 to-rose-600 text-sm font-semibold text-white"
    >
      {post.author.slice(0, 1)}
    </div>
  );
}

function PostCard({
  post,
  onLike,
  onSave,
}: {
  post: Post;
  onLike: () => void;
  onSave: () => void;
}) {
  return (
    <article className="rounded-2xl border border-purple-500/40 bg-linear-to-b from-purple-900/30 to-purple-950/40 p-4 shadow-[0_0_24px_-8px_rgba(168,85,247,0.55)] backdrop-blur">
      <header className="flex items-start gap-3">
        <Avatar post={post} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[15px] font-semibold text-white">{post.author}</span>
            {post.anonymous && (
              <span className="flex h-5 w-6 items-center justify-center rounded-md bg-purple-500 text-white">
                <VenetianMask size={14} />
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-purple-200/60">
            <span suppressHydrationWarning>{timeAgo(post.createdAt)}</span>
            <span>·</span>
            <Globe size={12} />
            <span>Public</span>
          </div>
        </div>
        <button aria-label="More options" className="p-1 text-purple-100/70 hover:text-white">
          <MoreHorizontal size={20} />
        </button>
      </header>

      <p className="mt-3 whitespace-pre-line text-[17px] leading-snug text-purple-50">{post.text}</p>

      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="" className="mt-3 max-h-80 w-full rounded-xl object-cover" />
      )}

      <footer className="mt-4 flex items-center justify-between text-sm text-purple-100/80">
        <div className="flex items-center gap-6">
          <button
            onClick={onLike}
            aria-pressed={post.liked}
            className={`flex items-center gap-1.5 transition-colors ${post.liked ? "text-fuchsia-400" : "hover:text-white"}`}
          >
            <Heart size={20} fill={post.liked ? "currentColor" : "none"} />
            {formatCount(post.likes)}
          </button>
          <button className="flex items-center gap-1.5 hover:text-white">
            <MessageCircle size={20} />
            {formatCount(post.comments)}
          </button>
          <button className="flex items-center gap-1.5 hover:text-white">
            <Share2 size={20} />
            {formatCount(post.shares)}
          </button>
        </div>
        <button
          onClick={onSave}
          aria-pressed={post.saved}
          aria-label="Save post"
          className={post.saved ? "text-purple-300" : "hover:text-white"}
        >
          <Bookmark size={20} fill={post.saved ? "currentColor" : "none"} />
        </button>
      </footer>
    </article>
  );
}

/* --------------------------------- Page ---------------------------------- */

export default function Page() {
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [tab, setTab] = useState<Tab>("for-you");
  const [category, setCategory] = useState<Category>("All");
  const [draft, setDraft] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [nav, setNav] = useState("Home");
  const fileRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    let list = posts.filter((p) => category === "All" || p.category === category);
    if (tab === "following") list = list.filter((p) => p.following);
    if (tab === "trending") list = [...list].sort((a, b) => b.likes - a.likes);
    if (tab === "recent") list = [...list].sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }, [posts, tab, category]);

  const submit = () => {
    const text = draft.trim();
    if (!text && !image) return;
    const post: Post = {
      id: crypto.randomUUID(),
      author: anonymous ? "Anonymous" : "You",
      anonymous,
      text,
      imageUrl: image ?? undefined,
      category: category === "All" ? "Mental Health" : category,
      createdAt: Date.now(),
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      saved: false,
      following: true,
    };
    setPosts((prev) => [post, ...prev]);
    setDraft("");
    setImage(null);
  };

  const toggle = (id: string, key: "liked" | "saved") =>
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (key === "liked") return { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) };
        return { ...p, saved: !p.saved };
      })
    );

  const navItems = [
    { label: "Home", icon: Home },
    { label: "Explore", icon: Compass },
    { label: "Communities", icon: Users },
    { label: "Messages", icon: MessageSquare },
    { label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#0a0412]">
      <div className="relative mx-auto min-h-screen w-full max-w-md bg-[radial-gradient(ellipse_at_top,#2a0f4d_0%,#12062a_45%,#08030f_100%)] text-white">
        {/* Header */}
        <header className="flex items-center justify-between px-4 pt-4">
          <button aria-label="Your profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/70">
            <User size={22} />
          </button>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.7)]">
              <MessageCircle size={20} fill="currentColor" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight">unheard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button aria-label="Notifications" className="relative">
              <Bell size={24} />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-fuchsia-500" />
            </button>
            <button aria-label="Search">
              <Search size={24} />
            </button>
          </div>
        </header>

        {/* Feed tabs */}
        <nav className="mt-5 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-5 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? "border-purple-400 bg-linear-to-r from-purple-600 to-fuchsia-600 shadow-[0_0_18px_rgba(168,85,247,0.6)]"
                  : "border-purple-500/40 bg-purple-950/40 text-purple-100/90 hover:border-purple-400"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {/* Composer */}
        <section className="mx-4 mt-4 rounded-2xl border border-purple-500/40 bg-purple-950/40 p-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAnonymous((a) => !a)}
              aria-label={anonymous ? "Posting anonymously" : "Posting as yourself"}
              title={anonymous ? "Posting anonymously" : "Posting as yourself"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-500/70"
            >
              {anonymous ? <VenetianMask size={22} /> : <User size={22} />}
            </button>
            <div className="flex flex-1 items-center rounded-full border border-purple-500/30 bg-purple-900/40 pl-4 pr-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Share something on your mind..."
                className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-purple-200/50"
              />
              <button aria-label="Add image" onClick={() => fileRef.current?.click()} className="text-purple-100/80 hover:text-white">
                <ImageIcon size={22} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setImage(URL.createObjectURL(f));
                  e.target.value = "";
                }}
              />
            </div>
            <button
              onClick={submit}
              aria-label="Post"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-fuchsia-600 shadow-[0_0_16px_rgba(168,85,247,0.6)] disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
          {image && (
            <div className="relative mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Selected" className="max-h-48 w-full rounded-xl object-cover" />
              <button
                onClick={() => setImage(null)}
                aria-label="Remove image"
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </section>

        {/* Categories */}
        <div className="mt-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition ${
                category === c.id
                  ? "border-purple-400 bg-purple-600/40 text-white"
                  : "border-purple-500/40 bg-purple-950/30 text-purple-100/90 hover:border-purple-400"
              }`}
            >
              {c.icon}
              {c.id}
            </button>
          ))}
        </div>

        {/* Feed */}
        <main className="space-y-4 px-4 pb-32 pt-4">
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-purple-500/40 p-8 text-center text-sm text-purple-100/70">
              Nothing here yet. Be the first to share something in this space.
            </div>
          ) : (
            visible.map((p) => (
              <PostCard key={p.id} post={p} onLike={() => toggle(p.id, "liked")} onSave={() => toggle(p.id, "saved")} />
            ))
          )}
        </main>

        {/* Floating action button */}
        <button
          aria-label="New post"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-[max(1rem,calc(50%-14rem+1rem))] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-fuchsia-600 shadow-[0_0_24px_rgba(168,85,247,0.8)]"
        >
          <Plus size={30} />
        </button>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 rounded-t-4xl border-t border-purple-500/40 bg-[#120626]/95 px-4 pb-5 pt-3 backdrop-blur">
          <ul className="flex items-center justify-between">
            {navItems.map(({ label, icon: Icon }) => (
              <li key={label}>
                <button
                  onClick={() => setNav(label)}
                  className={`flex w-16 flex-col items-center gap-1 text-[11px] ${nav === label ? "text-purple-400" : "text-purple-100/80"}`}
                >
                  <Icon size={24} fill={nav === label && label === "Home" ? "currentColor" : "none"} />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
main
