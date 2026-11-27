
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Check, Info } from "lucide-react";
import { createPost } from "@/lib/api/posts";
import type { PostCategory, PostIntent } from "@/lib/api/types";

type DropdownOption = {
  label: string;
  value: string;
  description?: string;
};

const categories: DropdownOption[] = [
  { label: "Love", value: "love" },
  { label: "Life", value: "life" },
  { label: "Mental Health", value: "mental_health" },
  { label: "Family", value: "family" },
];

const intents: DropdownOption[] = [
  {
    label: "I just want to vent",
    value: "vent",
    description: "Sometimes you just need someone to listen.",
  },
  {
    label: "I need advice",
    value: "advice",
    description: "Get different perspectives and suggestions.",
  },
  {
    label: "I want to hear similar experiences",
    value: "similar",
    description: "Connect with people who understand.",
  },
  {
    label: "I don't know, I just want to talk",
    value: "talk",
    description: "Start a conversation without pressure.",
  },
];

type CustomDropdownProps = {
  value: string;
  options: DropdownOption[];
  placeholder: string;
  onChange: (value: string) => void;
};

function CustomDropdown({
  value,
  options,
  placeholder,
  onChange,
}: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(
    (option) => option.value === value
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex w-full items-center justify-between rounded-xl border bg-[#110c19] px-4 py-3.5 text-left text-sm transition-all duration-200 ${
          open
            ? "border-purple-500 ring-2 ring-purple-500/10"
            : "border-[#352744] hover:border-purple-500/60"
        }`}
      >
        <span className={selectedOption ? "text-white" : "text-gray-500"}>
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180 text-purple-400" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+8px)] z-50 max-h-64 w-full overflow-y-auto rounded-xl border border-[#3b2a50] bg-[#1a1225] p-2 shadow-2xl shadow-black/40 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {options.map((option) => {
            const selected = value === option.value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                  selected
                    ? "bg-purple-600/15 text-purple-300"
                    : "text-gray-300 hover:bg-purple-500/10 hover:text-white"
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {option.label}
                  </span>

                  {option.description && (
                    <span className="mt-1 block text-xs text-gray-500">
                      {option.description}
                    </span>
                  )}
                </span>

                {selected && (
                  <Check
                    size={17}
                    className="shrink-0 text-purple-400"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CreatePostPage() {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory | "">("");
  const [intent, setIntent] = useState<PostIntent>("talk");
  const [anonymous, setAnonymous] = useState(true);
  const [allowComments, setAllowComments] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const maxCharacters = 2000;

  const identityOptions: DropdownOption[] = [
    {
      label: "Anonymous",
      value: "anonymous",
      description: "Hide your public profile identity",
    },
    {
      label: "Your profile",
      value: "profile",
      description: "Show your profile as the author",
    },
  ];

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!content.trim()) {
      setError("Please write something before publishing.");
      return;
    }

    if (!category) {
      setError("Please select a category for your post.");
      return;
    }

    if (isPublishing) return;

    setIsPublishing(true);

    try {
      await createPost({
        content: content.trim(),
        category,
        intent,
        allow_comments: allowComments,
        is_anonymous: anonymous,
      });

      setSuccess(
        "Your post has been submitted successfully. It is awaiting moderation and will appear in the public feed once approved."
      );

      // Reset the form after successful submission.
      setContent("");
      setCategory("");
      setIntent("talk");
      setAnonymous(true);
      setAllowComments(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while publishing your post.";

      setError(message);
    } finally {
      setIsPublishing(false);
    }
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

        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Create a post
          </h1>

          <div className="group relative">
            <button
              type="button"
              aria-label="Information about creating a post"
              className="flex items-center justify-center rounded-full text-gray-500 transition hover:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <Info size={19} />
            </button>

            <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 rounded-xl border border-[#49335d] bg-[#1a1225] p-4 text-left text-xs leading-6 text-gray-300 opacity-0 shadow-xl shadow-black/30 transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100 sm:left-0 sm:translate-x-0">
              <p className="mb-1 font-semibold text-purple-300">
                About creating posts
              </p>

              Share your thoughts, experiences, or questions on Tenderr.
              Choose a category and tell the community what you need.
              You can publish using your profile or choose to remain anonymous.

              <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-[#49335d] bg-[#1a1225] sm:left-2 sm:translate-x-0" />
            </div>
          </div>
        </div>

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
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-7"
      >
        {/* Post identity */}
        <div className="w-full space-y-3">
          <div>
            <label className="block text-sm font-semibold text-white">
              Post as
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Choose how others will see your identity.
            </p>
          </div>

          <CustomDropdown
            value={anonymous ? "anonymous" : "profile"}
            options={identityOptions}
            placeholder="Choose your identity"
            onChange={(value) =>
              setAnonymous(value === "anonymous")
            }
          />

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
            <label className="block text-sm font-semibold text-white">
              Choose a category
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Help people discover your post.
            </p>
          </div>

          <CustomDropdown
            value={category}
            options={categories}
            placeholder="Select a category"
            onChange={(value) =>
              setCategory(value as PostCategory)
            }
          />
        </div>

        {/* Intent */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-white">
              What do you need right now?
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Let people understand how they can support you.
            </p>
          </div>

          <CustomDropdown
            value={intent}
            options={intents}
            placeholder="Choose what you need"
            onChange={(value) =>
              setIntent(value as PostIntent)
            }
          />
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
            onClick={() =>
              setAllowComments((previous) => !previous)
            }
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
            disabled={isPublishing}
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPublishing ? "Publishing..." : "Publish post"}
            {!isPublishing && <span>→</span>}
          </button>
        </div>
      </form>

      {/* Privacy note */}
      <div className="rounded-xl border border-purple-500/15 bg-purple-500/5 p-4">
        <p className="text-xs leading-6 text-gray-400">
          <span className="font-semibold text-purple-300">
            Your privacy matters.
          </span>{" "}
          Choosing Anonymous hides your public identity on the post.
          The platform may still process account information for
          security and moderation purposes.
        </p>
      </div>
    </div>
  );
}