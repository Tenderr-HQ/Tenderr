
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordIsStrong =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /[0-9]/.test(newPassword);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (!passwordIsStrong) {
      setError(
        "Your new password must contain at least 8 characters, including uppercase, lowercase and a number."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setError("Your new password must be different from your current password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Your new passwords do not match.");
      return;
    }

    // Demo only: connect this form to your Django password-change endpoint.
    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const passwordField = (
    label: string,
    value: string,
    setValue: (value: string) => void,
    visible: boolean,
    setVisible: (value: boolean) => void,
    id: string,
    placeholder: string
  ) => (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-gray-300"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className="w-full rounded-xl border border-[#352744] bg-[#1d1629] px-4 py-3 pr-20 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500"
        />

        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-purple-400 hover:text-purple-300"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/settings"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          <span>←</span> Back to settings
        </Link>

        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Change password
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Update your password to keep your account secure.
        </p>
      </div>

      <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-7">
        {success && (
          <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
            Password validation passed. Connect the Django API to save the
            password securely.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {passwordField(
            "Current password",
            currentPassword,
            setCurrentPassword,
            showCurrent,
            setShowCurrent,
            "current-password",
            "Enter your current password"
          )}

          <div className="border-t border-[#2b2038]" />

          {passwordField(
            "New password",
            newPassword,
            setNewPassword,
            showNew,
            setShowNew,
            "new-password",
            "Enter your new password"
          )}

          <div className="rounded-xl bg-[#1d1629] p-4">
            <p className="mb-3 text-xs font-semibold text-gray-300">
              Your password should contain:
            </p>

            <div className="space-y-2 text-xs">
              {[
                {
                  label: "At least 8 characters",
                  valid: newPassword.length >= 8,
                },
                {
                  label: "One uppercase letter",
                  valid: /[A-Z]/.test(newPassword),
                },
                {
                  label: "One lowercase letter",
                  valid: /[a-z]/.test(newPassword),
                },
                {
                  label: "One number",
                  valid: /[0-9]/.test(newPassword),
                },
              ].map((rule) => (
                <div
                  key={rule.label}
                  className={`flex items-center gap-2 ${
                    rule.valid ? "text-green-400" : "text-gray-500"
                  }`}
                >
                  <span>{rule.valid ? "✓" : "○"}</span>
                  {rule.label}
                </div>
              ))}
            </div>
          </div>

          {passwordField(
            "Confirm new password",
            confirmPassword,
            setConfirmPassword,
            showConfirm,
            setShowConfirm,
            "confirm-password",
            "Enter your new password again"
          )}

          {confirmPassword && (
            <p
              className={`text-xs ${
                confirmPassword === newPassword
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {confirmPassword === newPassword
                ? "Passwords match."
                : "Passwords do not match."}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-purple-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-purple-500 sm:w-auto"
          >
            Update password
          </button>
        </form>
      </section>

      <div className="rounded-xl border border-[#2b2038] bg-[#15101e] p-5">
        <h2 className="text-sm font-semibold text-white">
          Security reminder
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Never share your password with anyone. Use a unique password for
          Tenderr and avoid saving it on shared devices.
        </p>
      </div>
    </div>
  );
}
