
import Link from "next/link";

const guidelines = [
  {
    number: "01",
    title: "Respect everyone",
    description:
      "Treat other people with kindness and respect. People come to Tenderr with different experiences, opinions and backgrounds. Disagreement is allowed; harassment and personal attacks are not.",
  },
  {
    number: "02",
    title: "No harassment or bullying",
    description:
      "Do not threaten, intimidate, shame, stalk or repeatedly target another person. Respect boundaries, even when you disagree with someone.",
  },
  {
    number: "03",
    title: "Protect personal information",
    description:
      "Do not publish another person's private information without their permission. This includes phone numbers, home addresses, private conversations and sensitive personal details.",
  },
  {
    number: "04",
    title: "Use anonymity responsibly",
    description:
      "Anonymous posting exists to help people express themselves freely. Do not use it to impersonate others, threaten people, spread private information or escape accountability for harmful behaviour.",
  },
  {
    number: "05",
    title: "No hate speech or discrimination",
    description:
      "Content that attacks, dehumanises or promotes hostility against people because of their identity or background is not welcome.",
  },
  {
    number: "06",
    title: "Share authentic content",
    description:
      "Do not deliberately spread false information, impersonate people or present fabricated stories as verified facts in ways that could harm others.",
  },
  {
    number: "07",
    title: "No harmful or illegal content",
    description:
      "Do not use Tenderr to promote violence, exploitation, illegal activities or content that puts other people at risk.",
  },
  {
    number: "08",
    title: "Keep discussions constructive",
    description:
      "Share your thoughts honestly, listen to other perspectives and contribute to conversations in a way that makes the community better.",
  },
];

export default function CommunityGuidelinesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/help"
          className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          <span>←</span> Back to Help & Support
        </Link>

        <div className="rounded-2xl border border-[#2b2038] bg-gradient-to-br from-[#21152f] to-[#15101e] p-6 sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
            🤝
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">
            Tenderr community
          </p>

          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Community Guidelines
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-400">
            Tenderr is a space where your voice matters. Everyone deserves to
            express themselves, feel heard and participate without fear of
            harassment or abuse. These guidelines help us protect that space.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Our community standards
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Every user is expected to follow these guidelines.
          </p>
        </div>

        {guidelines.map((item) => (
          <article
            key={item.number}
            className="flex gap-4 rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-xs font-bold text-purple-400">
              {item.number}
            </span>

            <div>
              <h3 className="text-sm font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-gray-400">
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-6">
        <h2 className="text-lg font-bold text-white">
          What happens when guidelines are violated?
        </h2>

        <p className="mt-3 text-sm leading-7 text-gray-400">
          Content reported for violating these guidelines may be reviewed.
          Depending on the seriousness and frequency of the violation, actions
          may include content removal, warnings, temporary restrictions or
          account suspension.
        </p>

        <p className="mt-3 text-sm leading-7 text-gray-400">
          Serious threats, exploitation and other unlawful activity may require
          additional action where appropriate.
        </p>
      </section>

      <section className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] p-6">
        <h2 className="text-base font-semibold text-white">
          Help us keep Tenderr safe
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-400">
          If you encounter content or behaviour that violates these
          guidelines, report it so it can be reviewed.
        </p>

        <Link
          href="/help/report-problem"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          Report a problem
        </Link>
      </section>

      <p className="pb-4 text-center text-xs leading-6 text-gray-500">
        These are starter community standards for Tenderr. Review them and
        align them with your moderation and enforcement policies before launch.
      </p>
    </div>
  );
}
