
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Bell, UserRound } from "lucide-react";
import Logo from "../ui/Logo";
import { getMe } from "@/lib/api/accounts";
import type { MeDto } from "@/lib/api/types";

const pageTitles: Record<string, string> = {
  "/home": "Home",
  "/explore": "Explore",
  "/notifications": "Notifications",
  "/profile": "My Profile",
  "/my-posts": "My Posts",
  "/saved": "Saved Posts",
  "/create-post": "Create a post",
  "/communities": "Communities",
  "/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname();

  const [user, setUser] = useState<MeDto | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchUser() {
      try {
        const profile = await getMe();

        if (active) {
          setUser(profile);
        }
      } catch (error) {
        console.error("Unable to fetch header profile:", error);
      }
    }

    fetchUser();

    return () => {
      active = false;
    };
  }, [pathname]);

  const title =
    pageTitles[pathname] ||
    (pathname.startsWith("/category/")
      ? "Category"
      : pathname.startsWith("/post/")
        ? "Discussion"
        : pathname.startsWith("/user/")
          ? "Profile"
          : "Your space");

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-white/[0.07] bg-[#0d0914]/90 px-4 backdrop-blur-xl sm:px-7">

      {/* Mobile Logo */}
      <div className="lg:hidden">
        <Logo size="small" />
      </div>

      {/* Desktop Page Title */}
      <div className="hidden lg:block">
        <h1 className="text-base font-semibold text-white">
          {title}
        </h1>

        <p className="mt-0.5 text-xs text-gray-500">
          A space where your voice matters.
        </p>
      </div>

      {/* Header Actions */}
      <div className="ml-auto flex items-center gap-2">

        {/* Settings */}
        <Link
          href="/settings"
          aria-label="Settings"
          title="Settings"
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
            pathname.startsWith("/settings")
              ? "bg-purple-500/10 text-purple-400"
              : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Settings className="h-5 w-5" />
        </Link>

        {/* Notifications */}
        <Link
          href="/notifications"
          aria-label="Notifications"
          title="Notifications"
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
            pathname.startsWith("/notifications")
              ? "bg-purple-500/10 text-purple-400"
              : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Bell className="h-5 w-5" />
        </Link>

        {/* User Profile Picture */}
        <Link
          href="/profile"
          aria-label="Your profile"
          title="Your profile"
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-purple-600 text-white ring-2 ring-purple-500/20 transition hover:ring-purple-400/50"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name || "Profile"}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserRound className="h-5 w-5" />
          )}
        </Link>

      </div>
    </header>
  );
}