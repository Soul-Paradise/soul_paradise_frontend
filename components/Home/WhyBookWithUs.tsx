import { BadgeCheck, Headphones, ReceiptIndianRupee, ShieldCheck } from 'lucide-react';

const REASONS = [
  {
    icon: BadgeCheck,
    title: 'IATA certified',
    body: 'A registered travel agency in Jalandhar, booking on all major airlines.',
  },
  {
    icon: ReceiptIndianRupee,
    title: 'Transparent fares',
    body: 'Clear fare breakdowns and fare rules before you pay.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure payments',
    body: 'Pay safely through ICICI Bank’s payment gateway.',
  },
  {
    icon: Headphones,
    title: '24/7 support',
    body: 'Real people on call and WhatsApp before, during and after your trip.',
  },
];

export function WhyBookWithUs() {
  return (
    <section className="bg-(--color-peace) py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="mb-6 text-2xl font-bold text-(--color-foreground)">
          Why book with Soul Paradise
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              // Icon beside the text on phones (compact), above it from sm up
              className="flex gap-4 rounded-xl border border-(--color-tertiary-button) bg-(--color-background) p-4 transition-all hover:-translate-y-0.5 hover:shadow-md sm:block sm:p-5"
            >
              <span className="inline-flex h-fit shrink-0 rounded-lg bg-(--color-links)/10 p-2.5 text-(--color-links)">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-(--color-foreground) sm:mt-3">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-(--color-inactive)">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
