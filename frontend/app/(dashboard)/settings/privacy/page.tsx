
"use client";

import { useState } from "react";
import Link from "next/link";

type ToggleProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function Toggle({
  title,
  description,
  checked,
  onChange,
}: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-5 py-5">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 max-w-xl text-sm leading-6 text-gray-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-purple-600" : "bg-[#493b56]"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState({
    privateProfile: false,
    anonymousByDefault: false,
    allowComments: true,
    showActivity: true,
    allowMentions: true,
  });

  const [saved, setSaved] = useState(false);

  const updateSetting = (
    key: keyof typeof settings,
    value: boolean
  ) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    // Demo only: send these preferences to your Django API later.
    console.log("Privacy settings:", settings);
    setSaved(true);
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
          Privacy settings
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Choose how people interact with you and what they can see on Tenderr.
        </p>
      </div>

      {saved && (
        <div
          role="status"
          className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300"
        >
          Your privacy preferences have been saved in this demo.
        </div>
      )}

      <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6">
        <h2 className="font-semibold text-white">Profile visibility</h2>
        <p className="mt-1 text-sm text-gray-400">
          Control how your profile appears to other people.
        </p>

        <div className="mt-3 divide-y divide-[#2b2038]">
          <Toggle
            title="Private profile"
            description="Limit access to your profile information and posts. Public posts may still be visible according to their individual visibility rules."
            checked={settings.privateProfile}
            onChange={(value) => updateSetting("privateProfile", value)}
          />

          <Toggle
            title="Show my activity"
            description="Allow other people to see activity displayed on your public profile."
            checked={settings.showActivity}
            onChange={(value) => updateSetting("showActivity", value)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6">
        <h2 className="font-semibold text-white">Posting preferences</h2>
        <p className="mt-1 text-sm text-gray-400">
          Manage your default preferences when sharing thoughts.
        </p>

        <div className="mt-3 divide-y divide-[#2b2038]">
          <Toggle
            title="Anonymous posting by default"
            description="Preselect anonymous identity when creating a post. You can still choose your identity for each individual post."
            checked={settings.anonymousByDefault}
            onChange={(value) => updateSetting("anonymousByDefault", value)}
          />

          <Toggle
            title="Allow comments by default"
            description="Preselect the option that allows people to comment on your new posts."
            checked={settings.allowComments}
            onChange={(value) => updateSetting("allowComments", value)}
          />
        </div>

        <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.06] p-4">
          <div className="flex gap-3">
            <span className="text-lg">🛡️</span>
            <div>
              <h3 className="text-sm font-semibold text-purple-200">
                About anonymous posts
              </h3>
              <p className="mt-1 text-xs leading-5 text-gray-400">
                Anonymous posting hides your public identity from other users.
                It does not mean your activity is completely untraceable to
                Tenderr's systems. Account and security data may still be
                processed according to the privacy policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6">
        <h2 className="font-semibold text-white">Interactions</h2>
        <p className="mt-1 text-sm text-gray-400">
          Choose how other users can interact with you.
        </p>

        <div className="mt-3 divide-y divide-[#2b2038]">
          <Toggle
            title="Allow mentions"
            description="Allow other users to mention your username in their posts and comments."
            checked={settings.allowMentions}
            onChange={(value) => updateSetting("allowMentions", value)}
          />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => {
            setSettings({
              privateProfile: false,
              anonymousByDefault: false,
              allowComments: true,
              showActivity: true,
              allowMentions: true,
            });
            setSaved(false);
          }}
          className="rounded-xl border border-[#49345e] px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
        >
          Reset changes
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          Save preferences
        </button>
      </div>
    </div>
  );
}