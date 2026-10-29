import type { Metadata } from 'next';
import { RotateCcw } from 'lucide-react';
import { LegalPage, type LegalSection } from '@/components/Page';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy - Soul Paradise Travels',
  description:
    'Refund and Cancellation Policy for Soul Paradise Travels. Refunds and cancellations are processed in accordance with the airline policy, DGCA guidelines and applicable approvals.',
};

const sections: LegalSection[] = [
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
    <LegalPage
      path="/refund-cancellation-policy"
      title="Refund & Cancellation Policy"
      description="All refunds and cancellations at Soul Paradise Travels are processed in accordance with the operating airline's policy, DGCA guidelines, and applicable approvals. Please review the policy below before making a booking."
      sections={sections}
      icon={RotateCcw}
      help={{
        title: 'Need Help with a Refund or Cancellation?',
        text: 'To request a refund or cancellation, or for any questions about this policy, please reach out to our team:',
      }}
    />
  );
}
