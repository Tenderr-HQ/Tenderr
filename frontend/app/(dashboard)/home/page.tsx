
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
