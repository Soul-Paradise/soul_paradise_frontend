/**
 * Redirect-target validation helpers (open-redirect protection).
 *
 * Pure functions with no React/Next imports so they can be unit-tested with
 * plain node.
 */

function looksLikeSafePath(p: string): boolean {
  return (
    p.startsWith('/') &&
    !p.startsWith('//') &&
    !p.startsWith('/\\') &&
    !p.includes('\\') &&
    // Control characters (tab/newline) are stripped by URL parsers and can
    // turn "/\t/evil.com" into "//evil.com".
    !/[\u0000-\u001f\u007f]/.test(p)
  );
}

/**
 * Returns `next` only when it is a same-origin relative path
 * (e.g. "/booking/flights?x=1"); otherwise null.
 */
export function safeNextPath(next: string | null | undefined, origin: string): string | null {
  if (!next) return null;
  if (!looksLikeSafePath(next)) return null;
  // Also check the once-more-decoded form so double-encoded tricks such as
  // "/%5Cevil.com" or "/%2F%2Fevil.com" are rejected.
  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return null;
  }
  if (!looksLikeSafePath(decoded)) return null;
  try {
    if (new URL(next, origin).origin !== origin) return null;
  } catch {
    return null;
  }
  return next;
}

/** ICICI payment-gateway hosts (prod + UAT), from the backend ICICI_PG_* config. */
const PAYMENT_HOSTS = ['pgpay.icicibank.com', 'pgpayuat.icicibank.com'];

function extraPaymentHosts(): string[] {
  const raw = process.env.NEXT_PUBLIC_PAYMENT_REDIRECT_HOSTS || '';
  return raw
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * True when `url` is an https URL on the payment gateway allowlist, or a URL
 * on our own origin (e.g. the insurance mock-payment result page).
 */
export function isAllowedPaymentRedirect(url: string | null | undefined, ownOrigin: string): boolean {
  if (!url || typeof url !== 'string') return false;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.username || u.password) return false;
  if (u.origin === ownOrigin) return true;
  if (u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  return [...PAYMENT_HOSTS, ...extraPaymentHosts()].includes(host);
}

/**
 * Validates the backend-supplied payment redirect and navigates to it.
 * Throws (without navigating) when the URL is not allowlisted.
 */
export function redirectToPayment(url: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  if (!isAllowedPaymentRedirect(url, window.location.origin)) {
    throw new Error('Payment could not be started. Please try again or contact support.');
  }
  window.location.href = url as string;
}
