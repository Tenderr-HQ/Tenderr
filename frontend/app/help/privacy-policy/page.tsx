
import Link from "next/link";

const sections = [
  {
    title: "1. Information we collect",
    content: [
      "When you create a Tenderr account, we may collect information such as your name, username, email address and account credentials.",
      "We may also collect information you voluntarily provide, including profile details, posts, comments, reports and other interactions.",
      "Technical information such as device details, browser information, IP addresses and security logs may be collected to operate and protect the platform.",
    ],
  },
  {
    title: "2. How we use your information",
    content: [
      "We use information to create and manage accounts, operate Tenderr, display content, provide platform features and respond to support requests.",
      "We may also use relevant information to detect spam, investigate abuse, enforce community guidelines and protect users.",
      "We do not use account information for purposes unrelated to operating and improving Tenderr without an appropriate basis.",
    ],
  },
  {
    title: "3. Public posts and profile information",
    content: [
      "Information you publish publicly may be visible to other Tenderr users and, depending on platform settings, people outside Tenderr.",
      "Think carefully before sharing personal information in posts, comments or your profile.",
      "Removing content from your profile does not necessarily remove copies that other users have already saved or shared.",
    ],
  },
  {
    title: "4. Anonymous posting",
    content: [
      "Tenderr allows users to publish content without displaying their public account identity.",
      "Anonymous posting does not mean that Tenderr is technically unable to associate activity with an account. Information may be processed for security, moderation, abuse prevention and legal obligations.",
      "We should not expose account identifiers through public anonymous-post interfaces. Access to internal records should be restricted and governed by appropriate safeguards.",
    ],
  },
  {
    title: "5. How we share information",
    content: [
      "We may share information with service providers that help us host, maintain, secure and operate Tenderr, subject to appropriate safeguards.",
      "Information may also be disclosed when required by applicable law or when necessary to protect the rights, safety and security of users and the platform.",
      "We do not sell users' personal information as a standard part of operating Tenderr.",
    ],
  },
  {
    title: "6. Data storage and security",
    content: [
      "We use appropriate technical and organisational measures intended to protect account information against unauthorised access, loss, misuse or alteration.",
      "No online platform can guarantee absolute security. Users should protect their passwords and avoid sharing login credentials.",
      "Information may be retained for as long as necessary for the purposes described in this policy, subject to applicable legal requirements.",
    ],
  },
  {
    title: "7. Your privacy choices",
    content: [
      "You can manage certain profile and privacy preferences through your account settings.",
      "Depending on the features available and applicable law, you may request access to, correction of or deletion of certain personal information.",
      "Some information may need to be retained for security, legal, dispute-resolution or legitimate operational reasons.",
    ],
  },
  {
    title: "8. Children's privacy",
    content: [
      "Tenderr is not intended for children below the minimum age permitted by applicable law.",
      "If we become aware that an account has been created in violation of applicable age requirements, we will take appropriate steps.",
    ],
  },
  {
    title: "9. Changes to this policy",
    content: [
      "We may update this Privacy Policy as Tenderr develops or as legal requirements change.",
      "Where appropriate, we will notify users of significant changes through the platform.",
    ],
  },
];

export default function PrivacyPolicyPage() {
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
            🔒
          </div>

          <h1 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
            Privacy Policy
          </h1>

          <p className="mt-3 text-sm leading-7 text-gray-400">
            Your privacy matters. This policy explains the information
            Tenderr may collect, how it may be used and the choices available
            to you.
          </p>

          <p className="mt-4 text-xs text-gray-500">
            Last updated: November 18, 2026
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
        <p className="text-sm leading-6 text-amber-200">
          <strong>Important:</strong> This is starter policy content, not
          legal advice. Update it to reflect your actual data collection,
          storage, processors, retention periods and user rights before
          publishing Tenderr.
        </p>
      </div>

      <section className="space-y-6">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl border border-[#2b2038] bg-[#15101e] p-5 sm:p-7"
          >
            <h2 className="text-base font-bold text-white">
              {section.title}
            </h2>

            <div className="mt-4 space-y-3">
              {section.content.map((paragraph, index) => (
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
          Contact and privacy requests
        </h2>

        <p className="mt-3 text-sm leading-7 text-gray-400">
          If you have questions about this policy or want to make a privacy
          request, use the Report a problem page. A dedicated privacy contact
          channel can be added when your support process is ready.
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
