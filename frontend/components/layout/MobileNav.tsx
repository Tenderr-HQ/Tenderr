
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Plus,
  Bookmark,
  Users,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const items: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Create", href: "/create-post", icon: Plus },
  { label: "Saved", href: "/saved", icon: Bookmark },
  { label: "Communities", href: "/communities", icon: Users },
];

export default function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home";

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#110c19]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const isCreate = item.label === "Create";

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 text-[10px] font-medium transition ${
                active ? "text-purple-400" : "text-gray-500"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  isCreate
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                    : active
                      ? "bg-purple-500/10"
                      : "hover:bg-white/[0.05]"
                }`}
              >
                <Icon
                  className={isCreate ? "h-6 w-6" : "h-5 w-5"}
                  strokeWidth={isCreate ? 2.5 : 2}
                />
              </span>

              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
