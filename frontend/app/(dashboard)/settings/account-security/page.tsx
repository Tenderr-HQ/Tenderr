
"use client";

import { useState } from "react";
import Link from "next/link";

export default function AccountSecurityPage() {
  const [email, setEmail] = useState("hello@example.com");
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [showNotice, setShowNotice] = useState(false);

  const handleEmailUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedEmail = newEmail.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return;
    }

    // Demo only: connect this action to your Django API.
    setEmail(trimmedEmail);
    setNewEmail("");
    setEditingEmail(false);
    setShowNotice(true);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/settings"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          <span>←</span> Back to settings
        </Link>

        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Account security
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Manage your account details and keep your Tenderr account secure.
        </p>
      </div>

      {showNotice && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4 text-sm text-purple-200">
          Your email was updated in this demo. Connect the verification
          endpoint before using this in production.
        </div>
      )}

      {/* Email address */}
      <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Email address
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Your email is used for account access and important updates.
            </p>
          </div>

          <span className="w-fit rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            Verification not connected
          </span>
        </div>

        <div className="mt-6 rounded-xl border border-[#352744] bg-[#1d1629] p-4">
          <p className="text-xs text-gray-500">Current email address</p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="break-all text-sm font-medium text-white">
              {email}
            </p>

            <button
              onClick={() => {
                setEditingEmail(!editingEmail);
                setShowNotice(false);
              }}
              className="w-fit text-sm font-semibold text-purple-400 transition hover:text-purple-300"
            >
              {editingEmail ? "Cancel" : "Change email"}
            </button>
          </div>
        </div>

        {editingEmail && (
          <form onSubmit={handleEmailUpdate} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="new-email"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                New email address
              </label>

              <input
                id="new-email"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter your new email"
                className="w-full rounded-xl border border-[#352744] bg-[#1d1629] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
            >
              Update email
            </button>
          </form>
        )}

        <p className="mt-4 text-xs leading-5 text-gray-500">
          Email changes should require confirmation through a verification
          link sent to the new address.
        </p>
      </section>

      {/* Password */}
      <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Password
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Keep your account protected with a strong, unique password.
            </p>
          </div>

          <Link
            href="/settings/change-password"
            className="w-fit rounded-xl border border-[#49345e] px-4 py-2.5 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/10"
          >
            Change password
          </Link>
        </div>
      </section>

      {/* Active sessions */}
      <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Active sessions
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Review devices that are signed in to your account.
            </p>
          </div>

          <Link
            href="/settings/active-sessions"
            className="w-fit rounded-xl border border-[#49345e] px-4 py-2.5 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/10"
          >
            Manage sessions
          </Link>
        </div>
      </section>

      {/* Security tips */}
      <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">
          Security recommendations
        </h2>

        <div className="mt-5 space-y-4">
          {[
            {
              title: "Use a strong password",
              description:
                "Choose a password that is difficult to guess and avoid reusing passwords.",
            },
            {
              title: "Keep your email secure",
              description:
                "Make sure you can access the email address connected to your account.",
            },
            {
              title: "Review your active sessions",
              description:
                "Sign out of devices you no longer use or do not recognize.",
            },
          ].map((tip, index) => (
            <div key={tip.title} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-sm font-semibold text-purple-400">
                {index + 1}
              </div>

              <div>
                <h3 className="text-sm font-medium text-white">
                  {tip.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-gray-400">
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
