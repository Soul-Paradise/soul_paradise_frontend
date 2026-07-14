'use client';

import Link from 'next/link';

interface AccountTypeLinkProps {
  /** Which registration page this is rendered on. Determines where the link points. */
  current: 'customer' | 'agent';
}

const COPY = {
  customer: {
    question: 'Are you a travel agent?',
    action: 'Register as a booking partner',
    href: '/register/agent',
  },
  agent: {
    question: 'Booking for yourself?',
    action: 'Register as a customer',
    href: '/register',
  },
} as const;

/**
 * Cross-link between the customer and agent registration pages.
 *
 * A link, not a form control: the two paths are separate pages collecting
 * different information (an agent submits KYC documents), so this navigates —
 * it does not toggle state within a single form.
 */
export default function AccountTypeLink({ current }: AccountTypeLinkProps) {
  const { question, action, href } = COPY[current];

  return (
    <p className="text-sm text-(--color-foreground)">
      {question}{' '}
      <Link
        href={href}
        className="font-semibold transition-colors duration-200 text-(--color-links) hover:opacity-80"
      >
        {action}
      </Link>
    </p>
  );
}
