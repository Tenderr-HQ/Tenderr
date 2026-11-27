
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  LayoutGrid,
  Bell,
  User,
  FileText,
  Bookmark,
  Settings,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";
import Logo from "../ui/Logo";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navigation: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Explore", href: "/explore", icon: Search },
  { label: "Communities", href: "/communities", icon: Users },
];

const personal: NavItem[] = [
  { label: "My Profile", href: "/profile", icon: User },
  { label: "My Posts", href: "/my-posts", icon: FileText },
  { label: "Saved Posts", href: "/saved", icon: Bookmark },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home";

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderLinks = (items: NavItem[]) =>
    items.map((item) => {
      const active = isActive(item.href);
      const Icon = item.icon;

      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
            active
              ? "bg-purple-500/10 text-purple-400"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Icon className="h-5 w-5" />
          {item.label}
        </Link>
      );
    });

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/[0.07] bg-[#110c19] px-5 py-7 lg:flex">
      <Logo size="medium" />

      <Link
        href="/create-post"
        className="mt-10 flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
      >
        <Plus className="h-5 w-5" />
        Create a post
      </Link>

      <nav className="mt-9 space-y-2">
        <p className="mb-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Menu
        </p>

        {renderLinks(navigation)}
      </nav>

      <nav className="mt-9 space-y-2">
        <p className="mb-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Personal
        </p>

        {renderLinks(personal)}
      </nav>

      <div className="mt-auto border-t border-white/[0.07] pt-5">
        <div className="mt-5 flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 font-semibold text-white">
            U
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              Your Account
            </p>
            <p className="text-xs text-gray-500">
              Personal profile
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
