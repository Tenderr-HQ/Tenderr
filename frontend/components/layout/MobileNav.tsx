
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Home", href: "/home", icon: "⌂" },
  { label: "Explore", href: "/explore", icon: "⌕" },
  { label: "Create", href: "/create-post", icon: "+" },
  { label: "Activity", href: "/notifications", icon: "♧" },
  { label: "Profile", href: "/profile", icon: "○" },
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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-[#110c19]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {items.map((item) => {
          const active = isActive(item.href);

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
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl transition ${
                  item.label === "Create"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                    : active
                      ? "bg-purple-500/10"
                      : "hover:bg-white/5"
                }`}
              >
                {item.icon}
              </span>

              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
