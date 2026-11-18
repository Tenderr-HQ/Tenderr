
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-12 bg-[#0d0815]">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-wide text-purple-400">
            Tenderr
          </h1>

          <p className="text-gray-400 mt-3 text-sm">
            A space where your voice matters.
          </p>
        </div>

        {/* Reset Password Card */}
        <div className="bg-[#171020] border border-[#30243c] rounded-2xl p-7 sm:p-9 shadow-2xl">

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-400"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <path d="M12 15v3" />
            </svg>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white">
              Reset your password
            </h2>

            <p className="text-gray-400 text-sm mt-3 leading-relaxed">
              Create a new password for your Tenderr account.
              Make sure it's strong and easy for you to remember.
            </p>
          </div>

          {/* Reset Form */}
          <form className="space-y-5">

            <div>
              <label
                htmlFor="password"
                className="block text-sm text-gray-300 mb-2"
              >
                New password
              </label>

              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your new password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full bg-[#21172d] border border-[#30243c] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition"
              />

              <p className="text-xs text-gray-500 mt-2">
                Use at least 8 characters.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm text-gray-300 mb-2"
              >
                Confirm new password
              </label>

              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your new password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full bg-[#21172d] border border-[#30243c] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition duration-200"
            >
              Update password
            </button>

          </form>

          <div className="text-center mt-7">
            <Link
              href="/login"
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              ← Back to sign in
            </Link>
          </div>

        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          Your voice deserves to be heard.
        </p>

      </div>
    </main>
  );
}