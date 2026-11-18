
import Link from "next/link";

const helpSections = [
  {
    title: "Community guidelines",
    description: "Learn how to keep Tenderr safe and welcoming for everyone.",
    href: "/help/community-guidelines",
    icon: "🤝",
  },
  {
    title: "Privacy policy",
    description: "Understand how your information is collected and handled.",
    href: "/help/privacy-policy",
    icon: "🔒",
  },
  {
    title: "Terms of service",
    description: "Read the rules and conditions for using Tenderr.",
    href: "/help/terms",
    icon: "📄",
  },
  {
    title: "Report a problem",
    description: "Tell us about an issue or something that needs attention.",
    href: "/help/report-problem",
    icon: "🚩",
  },
];

const faqs = [
  {
    question: "What is Tenderr?",
    answer:
      "Tenderr is a space where you can share your thoughts, express what is bothering you and connect with people who understand.",
  },
  {
    question: "Can I post anonymously?",
    answer:
      "Yes. You can choose to publish a post anonymously or under your public identity. Your choice can be different for each post.",
  },
  {
    question: "Can I change an anonymous post to a public post?",
    answer:
      "Post identity management will depend on the editing options available for that post. Check the post controls when this feature is available.",
  },
  {
    question: "How do I report inappropriate content?",
    answer:
      "Use the report option on the relevant content or visit the Report a problem page to tell us what happened.",
  },
  {
    question: "How can I change my account details?",
    answer:
      "Visit Settings from your account menu to manage your profile, password, privacy preferences and other account details.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <Link
          href="/home"
          className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          <span>←</span> Back to Tenderr
        </Link>

        <div className="rounded-3xl border border-[#2b2038] bg-gradient-to-br from-[#21152f] to-[#15101e] px-6 py-10 text-center sm:px-10 sm:py-14">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15 text-3xl">
            💬
          </div>

          <h1 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
            How can we help?
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-400">
            Find answers, understand how Tenderr works, and get help whenever
            you need it.
          </p>
        </div>
      </div>

      <section>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white">Help resources</h2>
          <p className="mt-1 text-sm text-gray-400">
            Everything you need to know about using Tenderr.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {helpSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 transition hover:border-purple-500/40 hover:bg-[#1d1629]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-xl">
                {section.icon}
              </div>

              <h3 className="mt-4 text-sm font-semibold text-white transition group-hover:text-purple-300">
                {section.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                {section.description}
              </p>

              <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-purple-400">
                Learn more <span>→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white">
            Frequently asked questions
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Quick answers to common questions.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-[#2b2038] bg-[#15101e] p-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-white">
                {faq.question}

                <span className="text-lg text-purple-400 transition group-open:rotate-45">
                  +
                </span>
              </summary>

              <p className="mt-4 border-t border-[#2b2038] pt-4 text-sm leading-6 text-gray-400">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-6 text-center sm:p-8">
        <h2 className="text-lg font-bold text-white">
          Still need help?
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
          If you cannot find the answer you're looking for, tell us about the
          problem.
        </p>

        <Link
          href="/help/report-problem"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          Report a problem
        </Link>
      </section>
    </div>
  );
}
