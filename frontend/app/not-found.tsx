
import Link from "next/link";

export default function AuthNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0d0815] px-5">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-purple-400">
          Tenderr
        </h1>

        <h2 className="text-xl text-white mt-6">
          Page not found
        </h2>

        <p className="text-gray-400 mt-2">
          Sorry, we couldn't find this page.
        </p>

        <Link
          href="/login"
          className="inline-block mt-6 rounded-xl bg-purple-600 px-6 py-3 text-white"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}
