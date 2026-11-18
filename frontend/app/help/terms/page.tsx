
import Link from "next/link";

const sections = [
  {
    title: "1. Acceptance of these terms",
    paragraphs: [
      "By accessing or using Tenderr, you agree to these Terms of Service and our applicable policies.",
      "If you do not agree with these terms, you should not use the platform.",
    ],
  },
  {
    title: "2. Eligibility and accounts",
    paragraphs: [
      "You must meet the minimum age requirements under applicable law to create and use a Tenderr account.",
      "You are responsible for providing accurate account information, keeping your login credentials secure and maintaining control of your account.",
      "You must not impersonate another person or create accounts for deceptive or abusive purposes.",
    ],
  },
  {
    title: "3. User-generated content",
    paragraphs: [
      "You retain ownership of the content you create and publish on Tenderr.",
      "By publishing content, you grant Tenderr a limited, non-exclusive licence to host, store, display and distribute that content as necessary to operate the platform and provide its features.",
      "You are responsible for ensuring that your content does not violate another person's rights or applicable laws.",
    ],
  },
  {
    title: "4. Anonymous posting",
    paragraphs: [
      "Tenderr may allow you to publish posts and comments without displaying your public account identity.",
      "Anonymous posting does not make activity completely untraceable. Tenderr may process relevant account and technical information for security, moderation, abuse prevention and legal compliance.",
      "You must not use anonymous features to harass, threaten, impersonate or harm other people.",
    ],
  },
  {
    title: "5. Acceptable use",
    paragraphs: [
      "You agree not to use Tenderr to distribute unlawful content, threaten others, engage in harassment, expose private information, spread malicious software or interfere with platform operations.",
      "You must follow the Tenderr Community Guidelines and respect the rights and safety of other users.",
      "You must not attempt to access accounts, systems or information without authorisation.",
    ],
  },
  {
    title: "6. Content moderation",
    paragraphs: [
      "Tenderr may review content and user activity to enforce these terms and its Community Guidelines.",
      "Where appropriate, we may remove content, restrict features, issue warnings or suspend or terminate accounts that violate our rules.",
      "We aim to apply moderation measures responsibly, but we cannot guarantee that every harmful post or interaction will be identified immediately.",
    ],
  },
  {
    title: "7. Account suspension and termination",
    paragraphs: [
      "You may stop using Tenderr at any time and may request account deletion through the available account support process.",
      "We may restrict or terminate access when necessary to enforce these terms, protect users, maintain platform security or comply with legal obligations.",
      "Some information may be retained after account closure where required or permitted by applicable law and our Privacy Policy.",
    ],
  },
  {
    title: "8. Platform availability",
    paragraphs: [
      "We work to keep Tenderr available and reliable, but uninterrupted access is not guaranteed.",
      "Features may change, be temporarily unavailable or be discontinued as the platform develops.",
    ],
  },
  {
    title: "9. Disclaimers and limitation of liability",
    paragraphs: [
      "Tenderr is provided on an as-available basis to the extent permitted by applicable law.",
      "To the extent permitted by law, Tenderr is not responsible for user-generated content or interactions between users. Nothing in these terms excludes liability that cannot legally be excluded.",
    ],
  },
  {
    title: "10. Changes to these terms",
    paragraphs: [
      "We may update these terms as Tenderr develops or as legal requirements change.",
      "Where appropriate, we will notify users of significant changes. Continued use after updated terms take effect may constitute acceptance where permitted by law.",
    ],
  },
];

export default function TermsPage() {
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
            📄
          </div>

          <h1 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
            Terms of Service
          </h1>

          <p className="mt-3 text-sm leading-7 text-gray-400">
            These terms explain the responsibilities and conditions that
            apply when you use Tenderr.
          </p>

          <p className="mt-4 text-xs text-gray-500">
            Last updated: November 18, 2026
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
        <p className="text-sm leading-6 text-amber-200">
          <strong>Important:</strong> This is starter legal content, not legal
          advice. Have it reviewed for the jurisdictions where Tenderr will
          operate before publishing it.
        </p>
      </div>

      <section className="space-y-5">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-7"
          >
            <h2 className="text-base font-bold text-white">
              {section.title}
            </h2>

            <div className="mt-4 space-y-3">
              {section.paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-sm leading-7 text-gray-400"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-7">
        <h2 className="text-base font-bold text-white">
          Questions about these terms?
        </h2>

        <p className="mt-3 text-sm leading-7 text-gray-400">
          If you have questions about using Tenderr or these terms, you can
          contact the support team through our help page.
        </p>

        <Link
          href="/help/report-problem"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          Contact support
        </Link>
      </section>

      <p className="pb-4 text-center text-xs text-gray-500">
        Tenderr — A space where your voice matters.
      </p>
    </div>
  );
}
