
"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";

export default function EditProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("Your Name");
  const [username, setUsername] = useState("yourusername");
  const [bio, setBio] = useState(
    "Sharing thoughts, learning, growing and connecting with people. Everyone deserves a space where their voice matters."
  );
  const [location, setLocation] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Your profile image must be smaller than 5MB.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setAvatar(imageUrl);
    setMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !username.trim()) {
      setMessage("Name and username are required.");
      return;
    }

    // Frontend demonstration only.
    // Connect to the Django profile API later.
    console.log({
      name,
      username,
      bio,
      location,
      avatar,
    });

    setMessage("Profile details validated. Backend saving will be connected later.");
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Heading */}
      <div>
        <p className="text-sm font-medium text-purple-400">
          Personal information
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Edit Profile
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Keep your profile up to date so people can get to know you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Profile picture */}
        <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-7">
          <h2 className="text-base font-semibold text-white">
            Profile picture
          </h2>

          <div className="mt-5 flex flex-wrap items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#49345e] bg-purple-600 text-2xl font-bold text-white">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                name.charAt(0).toUpperCase() || "U"
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-[#49345e] px-4 py-2.5 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/10"
              >
                Upload photo
              </button>

              <p className="mt-2 text-xs text-gray-500">
                JPG, PNG or WebP. Maximum size 5MB.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>
        </section>

        {/* Personal details */}
        <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-7">
          <h2 className="text-base font-semibold text-white">
            Personal information
          </h2>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-200"
              >
                Display name
              </label>

              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                required
                className="mt-2 w-full rounded-xl border border-[#352744] bg-[#110c19] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-purple-500"
                placeholder="Enter your display name"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="text-sm font-medium text-gray-200"
              >
                Username
              </label>

              <div className="mt-2 flex items-center rounded-xl border border-[#352744] bg-[#110c19] focus-within:border-purple-500">
                <span className="pl-4 text-sm text-gray-500">@</span>

                <input
                  id="username"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "")
                    )
                  }
                  maxLength={30}
                  required
                  className="w-full bg-transparent px-2 py-3 text-sm text-white outline-none"
                  placeholder="yourusername"
                />
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Use letters, numbers and underscores.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="bio"
                  className="text-sm font-medium text-gray-200"
                >
                  Bio
                </label>

                <span className="text-xs text-gray-500">
                  {bio.length}/160
                </span>
              </div>

              <textarea
                id="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={160}
                rows={4}
                className="mt-2 w-full resize-y rounded-xl border border-[#352744] bg-[#110c19] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-600 focus:border-purple-500"
                placeholder="Tell people a little about yourself..."
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="text-sm font-medium text-gray-200"
              >
                Location
                <span className="ml-2 text-xs font-normal text-gray-500">
                  Optional
                </span>
              </label>

              <input
                id="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                maxLength={80}
                className="mt-2 w-full rounded-xl border border-[#352744] bg-[#110c19] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-purple-500"
                placeholder="City or country"
              />
            </div>
          </div>
        </section>

        {/* Privacy note */}
        <div className="rounded-xl border border-purple-500/15 bg-purple-500/[0.06] p-4">
          <p className="text-sm font-medium text-purple-300">
            A note about your profile
          </p>

          <p className="mt-2 text-xs leading-6 text-gray-400">
            Your profile information is separate from your anonymous posts.
            Changing your display name does not change the identity settings
            of posts you've already published.
          </p>
        </div>

        {/* Feedback */}
        {message && (
          <div
            role="status"
            className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-300"
          >
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-xl border border-[#49345e] px-6 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.04]"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-xl bg-purple-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
