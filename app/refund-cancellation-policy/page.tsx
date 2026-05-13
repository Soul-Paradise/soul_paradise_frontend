import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy - Soul Paradise Travels',
  description:
    'Refund and Cancellation Policy for Soul Paradise Travels. Refunds and cancellations are processed in accordance with the airline policy, DGCA guidelines and applicable approvals.',
};

const sections = [
  {
    number: 1,
    title: 'Airline Policy',
    content: [
      'Refund and cancellation policy as per airline policy and procedure.',
    ],
  },
  {
    number: 2,
    title: 'Natural Calamity or Unavoidable Circumstances',
    content: [
      'If any natural calamity or unavoidable circumstances arises then refund and cancellation as per DGCA and airline policy.',
    ],
  },
  {
    number: 3,
    title: 'Subject to Approval',
    content: [
      'All refund and cancellation policy as per airline subject to approval.',
    ],
  },
];

export default function RefundCancellationPolicyPage() {
  return (
    <main className="min-h-screen bg-(--color-background)">
      {/* Header Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 md:pt-28 md:pb-16">
        <div className="flex items-center mb-6">
          <div className="w-16 h-1 bg-(--color-links) mr-4 rounded-xl"></div>
          <h1 className="text-3xl sm:text-4xl font-bold text-(--color-foreground)">
            Refund &amp; Cancellation Policy
          </h1>
        </div>
        <p className="text-lg text-(--color-inactive) max-w-3xl">
          All refunds and cancellations at Soul Paradise Travels are processed
          in accordance with the operating airline&apos;s policy, DGCA
          guidelines, and applicable approvals. Please review the policy below
          before making a booking.
        </p>
      </section>

      {/* Policy Sections */}
      <section className="bg-(--color-peace) py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.number}>
                <div className="flex items-start gap-4 mb-4">
                  <span className="shrink-0 w-9 h-9 bg-(--color-links) text-(--color-peace) rounded-full flex items-center justify-center text-sm font-bold">
                    {section.number}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-(--color-foreground) pt-0.5">
                    {section.title}
                  </h2>
                </div>
                <div className="ml-13 space-y-3">
                  {section.content.map((paragraph, idx) => (
                    <p
                      key={idx}
                      className="text-(--color-inactive) leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-(--color-peace) p-6 sm:p-8 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-(--color-links) rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-(--color-peace)"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-(--color-foreground)">
                Need Help with a Refund or Cancellation?
              </h2>
            </div>
            <p className="text-(--color-inactive) leading-relaxed mb-4">
              To request a refund or cancellation, or for any questions about
              this policy, please reach out to our team:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-(--color-links) shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href="mailto:soulparadise21@gmail.com"
                  className="text-(--color-links) hover:underline font-medium"
                >
                  soulparadise21@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-(--color-links) shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-(--color-inactive)">
                  Shop No. 21, 1st Floor, PPR Plaza
                  <br />
                  Jalandhar, Punjab – 144001
                </span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-(--color-tertiary-button)">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-(--color-links) hover:underline font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
                Visit our Contact page for more ways to reach us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
