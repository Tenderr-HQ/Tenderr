
"use client";

import { useState } from "react";
import Link from "next/link";

const categories = [
  "Relationships",
  "Mental Wellbeing",
  "Personal Growth",
  "Career",
  "Education",
  "Family",
  "Friendship",
  "Lifestyle",
  "Technology",
  "Finance",
  "Entertainment",
  "Other",
];

export default function CreatePostPage() {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const maxCharacters = 2000;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (!content.trim()) {
      setError("Please write something before publishing.");
      return;
    }

    if (!category) {
      setError("Please select a category for your post.");
      return;
    }

    const postData = {
      content: content.trim(),
      category,
      anonymous,
      allowComments,
    };

    // Frontend demonstration only.
    // Connect this data to your Django API later.
    console.log("Post data:", postData);

    setSuccess(true);
    setContent("");
    setCategory("");
    setAnonymous(true);
    setAllowComments(true);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      {/* Page heading */}
      <div>
        <Link
          href="/home"
          className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-white"
        >
          ← Back to feed
        </Link>

        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Create a post
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-400">
          Share what's on your mind. Your voice matters.
        </p>
      </div>

      {/* Success message */}
      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400"
        >
          Your post passed validation. This is a frontend demo; it has not
          been published to the server.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-7"
      >
        {/* Post identity */}
        <div className="w-full space-y-3">
          <div>
            <label
              htmlFor="post-identity"
              className="block text-sm font-semibold text-white"
            >
              Post as
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Choose how others will see your identity.
            </p>
          </div>

          <select
            id="post-identity"
            value={anonymous ? "anonymous" : "profile"}
            onChange={(event) =>
              setAnonymous(event.target.value === "anonymous")
            }
            className="block w-full min-w-0 rounded-xl border border-[#352744] bg-[#110c19] px-4 py-3.5 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
          >
            <option value="anonymous">Anonymous</option>
            <option value="profile">Your profile</option>
          </select>

          <p className="text-xs leading-5 text-gray-500">
            {anonymous
              ? "Your public profile identity will not be displayed with this post."
              : "Your public profile will be displayed as the author of this post."}
          </p>
        </div>

        <div className="border-t border-[#2b2038]" />

        {/* Post content */}
        <div className="space-y-3">
          <div>
            <label
              htmlFor="post-content"
              className="block text-sm font-semibold text-white"
            >
              What's on your mind?
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Express yourself. Someone might need to hear your story.
            </p>
          </div>

          <textarea
            id="post-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Start writing your thoughts..."
            rows={7}
            maxLength={maxCharacters}
            className="w-full resize-y rounded-xl border border-[#352744] bg-[#110c19] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
          />

          <div className="flex justify-end">
            <span
              className={`text-xs ${
                content.length >= maxCharacters
                  ? "text-red-400"
                  : "text-gray-500"
              }`}
            >
              {content.length}/{maxCharacters}
            </span>
          </div>
        </div>

        {/* Category */}
        <div className="space-y-3">
          <div>
            <label
              htmlFor="post-category"
              className="block text-sm font-semibold text-white"
            >
              Choose a category
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Help people discover your post.
            </p>
          </div>

          <select
            id="post-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-xl border border-[#352744] bg-[#110c19] px-4 py-3.5 text-sm text-white outline-none transition focus:border-purple-500"
          >
            <option value="">Select a category</option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-[#2b2038]" />

        {/* Allow comments */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">
              Allow comments
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Let people respond to your post.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={allowComments}
            aria-label="Allow comments"
            onClick={() => setAllowComments(!allowComments)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              allowComments ? "bg-purple-600" : "bg-gray-700"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                allowComments ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
          >
            {error}
          </p>
        )}

        {/* Form actions */}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Link
            href="/home"
            className="flex items-center justify-center rounded-xl border border-[#352744] px-6 py-3 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
          >
            Publish post
            <span>→</span>
          </button>
        </div>
      </form>

      {/* Privacy note */}
      <div className="rounded-xl border border-purple-500/15 bg-purple-500/5 p-4">
        <p className="text-xs leading-6 text-gray-400">
          <span className="font-semibold text-purple-300">
            Your privacy matters.
          </span>{" "}
          Choosing Anonymous hides your public identity on the post. The
          platform may still process account information for security and
          moderation purposes.
        </p>
      </div>
    </div>
  );
}
