
import { Users, Sparkles } from "lucide-react";

export default function CommunitiesPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-purple-500/20 bg-purple-500/10">
          <Users className="h-12 w-12 text-purple-400" />
        </div>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-xs font-medium text-purple-300">
          <Sparkles className="h-4 w-4" />
          Something exciting is coming
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Communities
          <span className="block mt-2 text-purple-400">
            Coming Soon
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-gray-400">
          We're working on a better way for you to connect with people
          who share your interests, experiences and ideas.
        </p>

        <p className="mt-8 text-sm font-medium text-purple-300">
          Your people. Your space. Your community.
        </p>
      </div>
    </div>
  );
}
