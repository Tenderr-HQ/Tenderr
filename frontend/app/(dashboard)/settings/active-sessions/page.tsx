
"use client";

import { useState } from "react";
import Link from "next/link";

type Session = {
  id: number;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
};

const initialSessions: Session[] = [
  {
    id: 1,
    device: "Windows PC",
    browser: "Chrome",
    location: "Lagos, Nigeria",
    lastActive: "Active now",
    current: true,
  },
  {
    id: 2,
    device: "iPhone",
    browser: "Safari",
    location: "Abuja, Nigeria",
    lastActive: "2 hours ago",
    current: false,
  },
  {
    id: 3,
    device: "Android phone",
    browser: "Chrome",
    location: "Unknown location",
    lastActive: "Yesterday",
    current: false,
  },
];

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState(initialSessions);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const otherSessions = sessions.filter((session) => !session.current);

  const signOutSession = (id: number) => {
    // Demo only: connect this action to your Django session-revocation API.
    setSessions((previous) =>
      previous.filter((session) => session.id !== id)
    );

    setShowConfirm(false);
    setSelectedSession(null);
    setNotice("The selected session was removed from this demo.");
  };

  const signOutAllOtherSessions = () => {
    // Demo only: connect this action to your Django API.
    setSessions((previous) =>
      previous.filter((session) => session.current)
    );

    setShowConfirm(false);
    setSelectedSession(null);
    setNotice("All other sessions were removed from this demo.");
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
          Active sessions
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Review the devices currently signed in to your Tenderr account.
        </p>
      </div>

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4 text-sm text-purple-200"
        >
          {notice}
        </div>
      )}

      <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">
              Signed-in devices
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              {sessions.length} session{sessions.length === 1 ? "" : "s"} in
              this demo
            </p>
          </div>

          {otherSessions.length > 0 && (
            <button
              onClick={() => {
                setSelectedSession(null);
                setShowConfirm(true);
              }}
              className="w-fit rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
            >
              Sign out other devices
            </button>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-xl border border-[#352744] bg-[#1d1629] p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
                    {session.device.includes("iPhone")
                      ? "📱"
                      : session.device.includes("Android")
                        ? "📱"
                        : "💻"}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">
                        {session.device}
                      </h3>

                      {session.current && (
                        <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-400">
                          This device
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-gray-400">
                      {session.browser}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      {session.location} · {session.lastActive}
                    </p>
                  </div>
                </div>

                {!session.current && (
                  <button
                    onClick={() => signOutSession(session.id)}
                    className="w-fit rounded-lg px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                  >
                    Sign out
                  </button>
                )}
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">
              No sessions are available in this demo.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5 sm:p-6">
        <div className="flex gap-3">
          <span className="text-xl">⚠️</span>

          <div>
            <h2 className="text-sm font-semibold text-amber-300">
              Notice an unfamiliar device?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Sign out of the unfamiliar session and change your password.
              Never share your login credentials with anyone.
            </p>

            <Link
              href="/settings/change-password"
              className="mt-3 inline-block text-sm font-semibold text-purple-400 hover:text-purple-300"
            >
              Change your password →
            </Link>
          </div>
        </div>
      </section>

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#352744] bg-[#15101e] p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white">
              Sign out other devices?
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              This will remove all other sessions from this demo. Your current
              device will remain signed in.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-xl border border-[#49345e] px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                onClick={signOutAllOtherSessions}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Sign out devices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}