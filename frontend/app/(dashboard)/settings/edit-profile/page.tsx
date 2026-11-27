
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  getMe,
  updateMyProfile,
  changeUsername,
  uploadAvatar,
} from "@/lib/api/accounts";

import type { MeDto } from "@/lib/api/types";

export default function EditProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<MeDto | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  // Fetch the current user's profile
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await getMe();

        if (!active) return;

        setUser(profile);
        setName(profile.display_name || profile.full_name || "");
        setUsername(profile.username || "");
        setBio(profile.bio || "");
        setAvatar(profile.avatar_url);
      } catch (error) {
        if (!active) return;

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load your profile. Please try again."
        );
        setMessageType("error");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  // Clean up temporary image previews
  useEffect(() => {
    return () => {
      if (avatar?.startsWith("blob:")) {
        URL.revokeObjectURL(avatar);
      }
    };
  }, [avatar]);

  function showMessage(
    text: string,
    type: "success" | "error"
  ) {
    setMessage(text);
    setMessageType(type);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      showMessage("Please select a JPG, PNG or WebP image.", "error");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage("Your profile image must be smaller than 5MB.", "error");
      event.target.value = "";
      return;
    }

    if (avatar?.startsWith("blob:")) {
      URL.revokeObjectURL(avatar);
    }

    const imageUrl = URL.createObjectURL(file);

    setAvatar(imageUrl);
    setAvatarFile(file);
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !username.trim()) {
      showMessage("Name and username are required.", "error");
      return;
    }

    if (username.length < 3) {
      showMessage("Username must contain at least 3 characters.", "error");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showMessage(
        "Username can only contain letters, numbers and underscores.",
        "error"
      );
      return;
    }

    if (!user) {
      showMessage("Your profile information is not available.", "error");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const trimmedName = name.trim();
      const trimmedUsername = username.trim().toLowerCase();
      const trimmedBio = bio.trim();

      // 1. Update display name and bio
      await updateMyProfile({
        display_name: trimmedName,
        bio: trimmedBio,
      });

      // 2. Change username only if it has changed
      if (trimmedUsername !== user.username) {
        await changeUsername(trimmedUsername);
      }

      // 3. Upload a new avatar if one was selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        await uploadAvatar(formData);
      }

      // 4. Fetch the updated profile
      const updatedUser = await getMe();

      setUser(updatedUser);
      setName(updatedUser.display_name || "");
      setUsername(updatedUser.username || "");
      setBio(updatedUser.bio || "");
      setAvatar(updatedUser.avatar_url);
      setAvatarFile(null);

      showMessage("Your profile has been updated successfully!", "success");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating your profile.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-lg bg-[#2b2038]" />
          <div className="h-4 w-72 rounded-lg bg-[#2b2038]" />

          <div className="h-40 rounded-2xl bg-[#15101e]" />
          <div className="h-96 rounded-2xl bg-[#15101e]" />
        </div>
      </div>
    );
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
                disabled={saving}
                className="rounded-xl border border-[#49345e] px-4 py-2.5 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
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
                disabled={saving}
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
            {/* Display name */}
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
                disabled={saving}
                className="mt-2 w-full rounded-xl border border-[#352744] bg-[#110c19] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-purple-500 disabled:opacity-50"
                placeholder="Enter your display name"
              />
            </div>

            {/* Username */}
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
                  disabled={saving}
                  className="w-full bg-transparent px-2 py-3 text-sm text-white outline-none disabled:opacity-50"
                  placeholder="yourusername"
                />
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Use letters, numbers and underscores. At least 3 characters.
              </p>
            </div>

            {/* Bio */}
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
                disabled={saving}
                className="mt-2 w-full resize-y rounded-xl border border-[#352744] bg-[#110c19] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-600 focus:border-purple-500 disabled:opacity-50"
                placeholder="Tell people a little about yourself..."
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
            aria-live="polite"
            className={`rounded-xl border px-4 py-3 text-sm ${
              messageType === "success"
                ? "border-green-500/20 bg-green-500/10 text-green-300"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => window.history.back()}
            disabled={saving}
            className="rounded-xl border border-[#49345e] px-6 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.04] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-purple-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving changes..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}