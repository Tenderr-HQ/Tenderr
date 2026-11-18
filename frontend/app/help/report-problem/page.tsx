
"use client";

import { useState } from "react";
import Link from "next/link";

const issueTypes = [
  "Account problem",
  "Login or registration issue",
  "Harassment or abuse",
  "Inappropriate content",
  "Anonymous posting issue",
  "Technical problem",
  "Other",
];

export default function ReportProblemPage() {
  const [issueType, setIssueType] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!issueType || !subject.trim() || !description.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (description.trim().length < 20) {
      setError("Please provide at least 20 characters describing the issue.");
      return;
    }

    setSubmitting(true);

    try {
      // Demo only: replace this with your Django API request.
      await new Promise((resolve) => setTimeout(resolve, 800));

      console.log({
        issueType,
        subject: subject.trim(),
        description: description.trim(),
        email: email.trim() || null,
      });

      setSuccess(true);
      setIssueType("");
      setSubject("");
      setDescription("");
      setEmail("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/help"
          className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          <span>←</span> Back to Help & Support
        </Link>

        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
            🚩
          </div>

          <h1 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
            Report a problem
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Something not working properly? Tell us what happened so we can
            investigate and improve Tenderr.
          </p>
        </div>
      </div>

      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-500/20 bg-green-500/10 p-4"
        >
          <h2 className="text-sm font-semibold text-green-300">
            Demo report submitted
          </h2>
          <p className="mt-1 text-sm text-green-300/80">
            Your report was processed locally. It has not been sent to a
            support team because the backend is not connected yet.
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-7"
      >
        <div>
          <label
            htmlFor="issueType"
            className="mb-2 block text-sm font-medium text-gray-200"
          >
            What is the problem? <span className="text-red-400">*</span>
          </label>

          <select
            id="issueType"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            required
            className="w-full rounded-xl border border-[#352744] bg-[#1d1629] px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
          >
            <option value="" disabled>
              Select an issue type
            </option>

            {issueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="subject"
            className="mb-2 block text-sm font-medium text-gray-200"
          >
            Subject <span className="text-red-400">*</span>
          </label>

          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Briefly describe the issue"
            maxLength={100}
            required
            className="w-full rounded-xl border border-[#352744] bg-[#1d1629] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500"
          />

          <p className="mt-2 text-right text-xs text-gray-500">
            {subject.length}/100
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-gray-200"
          >
            Describe the problem <span className="text-red-400">*</span>
          </label>

          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us what happened, what you expected to happen, and any steps we can follow to understand the issue..."
            rows={6}
            maxLength={2000}
            required
            className="w-full resize-y rounded-xl border border-[#352744] bg-[#1d1629] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500"
          />

          <p className="mt-2 text-right text-xs text-gray-500">
            {description.length}/2000
          </p>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-gray-200"
          >
            Contact email <span className="text-gray-500">(optional)</span>
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[#352744] bg-[#1d1629] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500"
          />

          <p className="mt-2 text-xs leading-5 text-gray-500">
            Provide an email if you would like the support team to contact you
            about your report.
          </p>
        </div>

        <div className="rounded-xl border border-[#352744] bg-[#1d1629] p-4">
          <p className="text-xs leading-6 text-gray-400">
            Please avoid including passwords, verification codes or other
            sensitive account credentials in your report.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-purple-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {submitting ? "Submitting..." : "Submit report"}
        </button>
      </form>
    </div>
  );
}
