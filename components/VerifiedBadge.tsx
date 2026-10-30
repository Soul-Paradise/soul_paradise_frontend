import Image from 'next/image';

/**
 * The verified rosette (public/verified.svg), for real verified states only:
 * a verified email, a passed KYC check. Decorative when it sits next to text
 * that already says "Verified"; pass `label` when the icon stands alone.
 */
export default function VerifiedBadge({
  size = 20,
  label,
  className = '',
}: {
  size?: number;
  /** Accessible name when the badge is the only signal (e.g. after a name). */
  label?: string;
  className?: string;
}) {
  return (
    <Image
      src="/verified.svg"
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      unoptimized
      className={`inline-block shrink-0 ${className}`}
    />
  );
}
