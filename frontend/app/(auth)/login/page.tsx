import Link from "next/link";

export default function LoginPage() {
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

        {/* Login Card */}
        <div className="bg-[#171020] border border-[#30243c] rounded-2xl p-7 sm:p-9 shadow-2xl">

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white">
              Welcome back
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              Sign in to continue to your account.
            </p>
          </div>

          {/* Login Form */}
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
                placeholder="Enter your email"
                required
                className="w-full bg-[#21172d] border border-[#30243c] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition"
              />
            </div>

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

              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                required
                className="w-full bg-[#21172d] border border-[#30243c] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition duration-200"
            >
              Sign in
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

        <p className="text-center text-xs text-gray-500 mt-8">
          Your voice deserves to be heard.
        </p>

      </div>
    </main>
  );
}
