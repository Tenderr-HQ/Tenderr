
import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-12 bg-[#0d0815]">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-wide text-purple-400">
            Tenderr
          </h1>

          <p className="text-gray-400 mt-3 text-sm">
            A space where your voice matters.
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-[#171020] border border-[#30243c] rounded-2xl p-7 sm:p-9 shadow-2xl">

          <div className="mb-7">
            <h2 className="text-2xl font-semibold text-white">
              Create your account
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              Join the conversation. Your voice matters here.
            </p>
          </div>

          {/* Signup Form */}
          <form className="space-y-5">

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
                name="fullName"
                placeholder="Enter your full name"
                required
                autoComplete="name"
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
                name="email"
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
                name="password"
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
                name="confirmPassword"
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

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition duration-200"
            >
              Create account
            </button>

          </form>

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

        <p className="text-center text-xs text-gray-500 mt-7">
          Your voice deserves to be heard.
        </p>

      </div>
    </main>
  );
}