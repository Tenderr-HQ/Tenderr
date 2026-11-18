
import Link from "next/link";

const settingsGroups = [
  {
    title: "Account",
    description: "Manage your personal account information.",
    items: [
      {
        icon: "○",
        title: "Edit profile",
        description: "Update your name, username, bio and profile picture.",
        href: "/settings/edit-profile",
      },
      {
        icon: "✉",
        title: "Account security",
        description: "Manage your email address and account security.",
        href: "/settings/account-security",
      },
      {
        icon: "⌑",
        title: "Change password",
        description: "Update your account password.",
        href: "/settings/change-password",
      },
    ],
  },
  {
    title: "Privacy and security",
    description: "Control your privacy and account access.",
    items: [
      {
        icon: "◉",
        title: "Privacy settings",
        description: "Manage who can interact with your account.",
        href: "/settings/privacy",
      },
      {
        icon: "⌘",
        title: "Active sessions",
        description: "Review devices currently signed into your account.",
        href: "/settings/active-sessions",
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Heading */}
      <div>
        <p className="text-sm font-medium text-purple-400">
          Manage your account
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Settings
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Customize your Tenderr experience and manage your account.
        </p>
      </div>

      {/* Account overview */}
      <div className="mt-8 flex items-center gap-4 rounded-2xl border border-[#2b2038] bg-[#15101e] p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xl font-bold text-white">
          U
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-white">
            Your Name
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            @yourusername
          </p>
        </div>

        <Link
          href="/settings/edit-profile"
          className="ml-auto shrink-0 text-xs font-semibold text-purple-400 transition hover:text-purple-300"
        >
          Edit profile
        </Link>
      </div>

      {/* Settings groups */}
      <div className="mt-8 space-y-9">
        {settingsGroups.map((group) => (
          <section key={group.title}>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-white">
                {group.title}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {group.description}
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#2b2038] bg-[#15101e]">
              {group.items.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 p-5 transition hover:bg-white/[0.03] ${
                    index !== group.items.length - 1
                      ? "border-b border-white/[0.06]"
                      : ""
                  }`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-lg text-purple-400">
                    {item.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {item.description}
                    </p>
                  </div>

                  <span className="text-lg text-gray-500">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Help and support */}
      <section className="mt-9">
        <h2 className="text-base font-semibold text-white">
          Support
        </h2>

        <div className="mt-4 overflow-hidden rounded-2xl border border-[#2b2038] bg-[#15101e]">
          <Link
            href="/help"
            className="flex items-center justify-between p-5 transition hover:bg-white/[0.03]"
          >
            <div>
              <p className="text-sm font-semibold text-white">
                Help and support
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Find answers and get assistance.
              </p>
            </div>

            <span className="text-lg text-gray-500">→</span>
          </Link>
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-gray-600">
        Tenderr · A space where your voice matters.
      </p>
    </div>
  );
}
