/** Sales line used by the contact page and footer. */
export const SALES_PHONE = '+919876816688';

/** WhatsApp chat link, optionally with a prefilled message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${SALES_PHONE.replace('+', '')}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
