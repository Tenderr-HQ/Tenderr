
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await register({
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        password_confirm: confirmPassword,
      });

      console.log("Registration successful:", response);

      router.replace("/home");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-12 bg-[#0d0815]">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-wide text-purple-400">
            Tenderr
          </h1>
        </div>

        {/* Signup Card */}
        <div className="bg-[#171020] border border-[#30243c] rounded-2xl p-7 sm:p-9 shadow-2xl">

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-semibold text-white">
              Create your account
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              Join the conversation. Your voice matters here.
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm text-gray-300 mb-2"
              >
                Full name
              </label>

              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                autoComplete="name"
                className="w-full bg-[#21172d] border border-[#30243c] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition"
              />
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm text-gray-300 mb-2"
              >
                Username
              </label>

              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                autoComplete="username"
                className="w-full bg-[#21172d] border border-[#30243c] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm text-gray-300 mb-2"
              >
                Email address
              </label>

              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoComplete="email"
                className="w-full bg-[#21172d] border border-[#30243c] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm text-gray-300 mb-2"
              >
                Password
              </label>

              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                autoComplete="new-password"
                className="w-full bg-[#21172d] border border-[#30243c] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition"
              />

              <p className="text-xs text-gray-500 mt-2">
                Use at least 8 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm text-gray-300 mb-2"
              >
                Confirm password
              </label>

              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
                className="w-full bg-[#21172d] border border-[#30243c] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition"
              />
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-400 leading-relaxed">
              By creating an account, you agree to our{" "}
              <Link
                href="/help/terms"
                className="text-purple-400 hover:text-purple-300"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/help/privacy-policy"
                className="text-purple-400 hover:text-purple-300"
              >
                Privacy Policy
              </Link>.
            </p>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            {/* Create Account */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition duration-200"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#30243c]" />

            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Or continue with
            </span>

            <div className="flex-1 h-px bg-[#30243c]" />
          </div>

          {/* Google and Apple Signup */}
          <div className="space-y-3">

            {/* Google */}
            <a
              href={`${API_URL}/api/auth/google/`}
              className="w-full flex items-center justify-center gap-3 bg-[#21172d] border border-[#30243c] hover:border-purple-500 rounded-xl px-4 py-3 text-white font-medium transition"
            >
              <span className="font-bold text-lg bg-gradient-to-r from-blue-500 via-green-500 to-red-500 bg-clip-text text-transparent">
                G
              </span>

              Continue with Google
            </a>

            {/* Apple */}
            <a
              href={`${API_URL}/api/auth/apple/`}
              className="w-full flex items-center justify-center gap-3 bg-[#21172d] border border-[#30243c] hover:border-purple-500 rounded-xl px-4 py-3 text-white font-medium transition"
            >
              <span className="text-xl"></span>

              Continue with Apple
            </a>

          </div>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-400 mt-7">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-purple-400 font-semibold hover:text-purple-300"
            >
              Sign in
            </Link>
          </p>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-7">
          Your voice deserves to be heard.
        </p>

      </div>
    </main>
  );
}