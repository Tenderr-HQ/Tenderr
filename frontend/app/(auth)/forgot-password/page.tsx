
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-12 bg-[#0d0815]">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-wide text-purple-400">
            Tenderr
          </h1>
        </div>

        {/* Forgot Password Card */}
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
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 6L2 7" />
            </svg>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white">
              Forgot your password?
            </h2>

            <p className="text-gray-400 text-sm mt-3 leading-relaxed">
              Don't worry, it happens. Enter the email address
              associated with your Tenderr account and we'll
              send you instructions to reset your password.
            </p>
          </div>

          {/* Email Form */}
          <form className="space-y-5">

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
                placeholder="Enter your email address"
                required
                autoComplete="email"
                className="w-full bg-[#21172d] border border-[#30243c] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition duration-200"
            >
              Send reset link
            </button>

          </form>

          {/* Back to Login */}
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