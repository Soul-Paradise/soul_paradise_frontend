import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - Soul Paradise Travels',
  description:
    'Read the Privacy Policy for Soul Paradise Travels. Learn how we collect, use, and protect your personal information.',
};

const sections = [
  {
    number: 1,
    title: 'What Do We Do With Your Information?',
    content: [
      'When you purchase something from our store, as part of the buying and selling process, we collect the personal information you give us such as your name, address and email address.',
      "When you browse our store, we also automatically receive your computer's internet protocol (IP) address in order to provide us with information that helps us learn about your browser and operating system.",
      'Email marketing (if applicable): With your permission, we may send you emails about our store, new products and other updates.',
    ],
  },
  {
    number: 2,
    title: 'Consent',
    content: [
      'When you provide us with personal information to complete a transaction, verify your credit card, place an order, arrange for a delivery or return a purchase, we imply that you consent to our collecting it and using it for that specific reason only.',
      'If we ask for your personal information for a secondary reason, like marketing, we will either ask you directly for your expressed consent, or provide you with an opportunity to say no.',
    ],
    subsections: [
      {
        title: 'How Do I Withdraw My Consent?',
        content:
          'If after you opt-in, you change your mind, you may withdraw your consent for us to contact you, for the continued collection, use or disclosure of your information, at anytime, by contacting us at soulparadise21@gmail.com or mailing us at: Shop No. 21, 1st Floor, PPR Plaza, Jalandhar, Punjab – 144001.',
      },
    ],
  },
  {
    number: 3,
    title: 'Disclosure',
    content: [
      'We may disclose your personal information if we are required by law to do so or if you violate our Terms of Service.',
    ],
  },
  {
    number: 4,
    title: 'Payment',
    content: [
      'We use Razorpay for processing payments. We/Razorpay do not store your card data on their servers. The data is encrypted through the Payment Card Industry Data Security Standard (PCI-DSS) when processing payment. Your purchase transaction data is only used as long as is necessary to complete your purchase transaction. After that is complete, your purchase transaction information is not saved.',
      'Our payment gateway adheres to the standards set by PCI-DSS as managed by the PCI Security Standards Council, which is a joint effort of brands like Visa, MasterCard, American Express and Discover. PCI-DSS requirements help ensure the secure handling of credit card information by our store and its service providers.',
    ],
  },
  {
    number: 5,
    title: 'Third-Party Services',
    content: [
      'In general, the third-party providers used by us will only collect, use and disclose your information to the extent necessary to allow them to perform the services they provide to us. However, certain third-party service providers, such as payment gateways and other payment transaction processors, have their own privacy policies in respect to the information we are required to provide to them for your purchase-related transactions.',
      'For these providers, we recommend that you read their privacy policies so you can understand the manner in which your personal information will be handled by these providers.',
      'In particular, remember that certain providers may be located in or have facilities that are located in a different jurisdiction than either you or us. So if you elect to proceed with a transaction that involves the services of a third-party service provider, then your information may become subject to the laws of the jurisdiction(s) in which that service provider or its facilities are located.',
      "Once you leave our store's website or are redirected to a third-party website or application, you are no longer governed by this Privacy Policy or our website's Terms of Service.",
    ],
    subsections: [
      {
        title: 'Links',
        content:
          'When you click on links on our store, they may direct you away from our site. We are not responsible for the privacy practices of other sites and encourage you to read their privacy statements.',
      },
    ],
  },
  {
    number: 6,
    title: 'Security',
    content: [
      'To protect your personal information, we take reasonable precautions and follow industry best practices to make sure it is not inappropriately lost, misused, accessed, disclosed, altered or destroyed.',
    ],
  },
  {
    number: 7,
    title: 'Cookies',
    content: [
      'We use cookies to maintain the session of your user. It is not used to personally identify you on other websites.',
    ],
  },
  {
    number: 8,
    title: 'Age of Consent',
    content: [
      'By using this site, you represent that you are at least the age of majority in your state or province of residence, or that you are the age of majority in your state or province of residence and you have given us your consent to allow any of your minor dependents to use this site.',
    ],
  },
  {
    number: 9,
    title: 'Changes to This Privacy Policy',
    content: [
      'We reserve the right to modify this privacy policy at any time, so please review it frequently. Changes and clarifications will take effect immediately upon their posting on the website. If we make material changes to this policy, we will notify you here that it has been updated, so that you are aware of what information we collect, how we use it, and under what circumstances, if any, we use and/or disclose it.',
      'If our store is acquired or merged with another company, your information may be transferred to the new owners so that we may continue to sell products to you.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-(--color-background)">
      {/* Header Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 md:pt-28 md:pb-16">
        <div className="flex items-center mb-6">
          <div className="w-16 h-1 bg-(--color-links) mr-4 rounded-xl"></div>
          <h1 className="text-3xl sm:text-4xl font-bold text-(--color-foreground)">
            Privacy Policy
          </h1>
        </div>
        <p className="text-lg text-(--color-inactive) max-w-3xl">
          Your privacy is important to us. This policy outlines how Soul
          Paradise Travels collects, uses, and protects your personal
          information when you use our services.
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
                  {section.subsections?.map((sub, idx) => (
                    <div key={idx} className="mt-4">
                      <h3 className="text-lg font-semibold text-(--color-foreground) mb-2">
                        {sub.title}
                      </h3>
                      <p className="text-(--color-inactive) leading-relaxed">
                        {sub.content}
                      </p>
                    </div>
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
                Questions & Contact Information
              </h2>
            </div>
            <p className="text-(--color-inactive) leading-relaxed mb-4">
              If you would like to access, correct, amend or delete any personal
              information we have about you, register a complaint, or simply
              want more information, contact our Privacy Compliance Officer:
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
