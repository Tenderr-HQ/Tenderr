
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { login } from "@/lib/api/auth";
import { toApiError } from "@/lib/api/errors";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      // Tokens are automatically saved by login().
      router.replace("/home");
    } catch (err) {
      const apiError = toApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-12 bg-[#0d0815]">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-10">
          <Link href="/">
            <h1 className="text-4xl font-bold tracking-wide text-purple-400">
              Tenderr
            </h1>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-[#171020] border border-[#30243c] rounded-2xl p-7 sm:p-9 shadow-2xl">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white">
              Welcome back
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              Sign in to continue to your account.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

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
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
                disabled={loading}
                className="w-full bg-[#21172d] border border-[#30243c] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="password"
                  className="text-sm text-gray-300"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="w-full bg-[#21172d] border border-[#30243c] rounded-xl px-4 py-3 pr-12 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-400 transition"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition duration-200"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          {/* Signup Link */}
          <p className="text-center text-sm text-gray-400 mt-7">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-purple-400 font-semibold hover:text-purple-300"
            >
              Create account
            </Link>
          </p>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8">
          Your voice deserves to be heard.
        </p>

      </div>
    </main>
  );
}