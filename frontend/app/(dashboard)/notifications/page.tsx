
"use client";

import { useState } from "react";

type Notification = {
  id: number;
  type: "like" | "comment" | "follow" | "mention";
  name: string;
  username: string;
  message: string;
  time: string;
  unread: boolean;
};

const initialNotifications: Notification[] = [
  {
    id: 1,
    type: "like",
    name: "Sarah Johnson",
    username: "@sarahj",
    message: "reacted to your post.",
    time: "5 minutes ago",
    unread: true,
  },
  {
    id: 2,
    type: "comment",
    name: "Michael James",
    username: "@michaelj",
    message: "commented: \"I completely understand how you feel.\"",
    time: "20 minutes ago",
    unread: true,
  },
  {
    id: 3,
    type: "follow",
    name: "Grace Williams",
    username: "@gracew",
    message: "started following you.",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 4,
    type: "mention",
    name: "Daniel Smith",
    username: "@danielsmith",
    message: "mentioned you in a conversation.",
    time: "3 hours ago",
    unread: false,
  },
  {
    id: 5,
    type: "like",
    name: "Emma Brown",
    username: "@emmab",
    message: "reacted to your post.",
    time: "Yesterday",
    unread: false,
  },
];

const filters = ["All", "Unread", "Mentions"];

const icons = {
  like: "♥",
  comment: "▤",
  follow: "+",
  mention: "@",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState("All");

  const unreadCount = notifications.filter((item) => item.unread).length;

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === "Unread") return item.unread;
    if (activeFilter === "Mentions") return item.type === "mention";
    return true;
  });

  function markAsRead(id: number) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, unread: false } : item
      )
    );
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((item) => ({ ...item, unread: false }))
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-purple-400">
            Stay connected
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Notifications
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Keep up with what's happening around you.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="mt-7 flex items-center justify-between rounded-xl border border-[#2b2038] bg-[#15101e] p-4">
        <div>
          <p className="text-sm font-medium text-white">
            Your activity
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {unreadCount} unread notifications
          </p>
        </div>

        <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-purple-500/10 px-3 text-sm font-semibold text-purple-400">
          {unreadCount}
        </span>
      </div>

      {/* Filters */}
      <div className="mt-7 flex gap-6 border-b border-white/[0.07]">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`relative pb-3 text-sm font-medium transition ${
              activeFilter === filter
                ? "text-purple-400"
                : "text-gray-500 hover:text-white"
            }`}
          >
            {filter}
            {activeFilter === filter && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-purple-500" />
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="mt-4 space-y-2">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition hover:border-purple-500/30 ${
                notification.unread
                  ? "border-purple-500/15 bg-purple-500/[0.05]"
                  : "border-transparent bg-[#15101e] hover:bg-[#1b1427]"
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-lg text-purple-400">
                {icons[notification.type]}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-6 text-gray-300">
                  <strong className="font-semibold text-white">
                    {notification.name}
                  </strong>{" "}
                  {notification.message}
                </span>

                <span className="mt-1 block text-xs text-gray-500">
                  {notification.username} · {notification.time}
                </span>
              </span>

              {notification.unread && (
                <span
                  className="mt-2 h-2 w-2 shrink-0 rounded-full bg-purple-500"
                  aria-label="Unread"
                />
              )}
            </button>
          ))
        ) : (
          <div className="rounded-xl border border-[#2b2038] bg-[#15101e] px-5 py-14 text-center">
            <p className="font-medium text-white">
              Nothing to see here yet
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {activeFilter === "Unread"
                ? "You're all caught up."
                : "You don't have any mentions yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
