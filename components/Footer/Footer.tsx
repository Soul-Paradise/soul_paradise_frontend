import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone } from 'lucide-react';
import { fillTemplate, hasImage, type ContactContent, type FooterContent } from '@/lib/site-content-shared';
import { BrandLogo } from '@/components/SiteImages';
import { NewsletterSignup } from './NewsletterSignup';

/** Column heading with a short brand-gradient underline. */
function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-5 text-base font-bold text-white">
      {children}
      <span className="mt-2 block h-0.5 w-8 rounded-full bg-gradient-to-r from-(--color-links) to-(--color-accent-light)" />
    </h3>
  );
}

/** Footer link: dims at rest, brightens and nudges right on hover. */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-block text-sm text-white/70 transition-all duration-200 hover:translate-x-1 hover:text-white"
    >
      {children}
    </Link>
  );
}

const socialClass =
  'flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-(--color-links) hover:ring-(--color-links) hover:shadow-lg hover:shadow-blue-500/30';

const contactIcon =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sky-300 transition-colors group-hover:bg-(--color-links) group-hover:text-white';

const FACEBOOK_PATH =
  'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z';
const INSTAGRAM_PATH =
  'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z';
const YOUTUBE_PATH =
  'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z';
const X_PATH =
  'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';

const SOCIALS: { key: keyof ContactContent['social']; label: string; path: string }[] = [
  { key: 'facebook', label: 'Facebook', path: FACEBOOK_PATH },
  { key: 'instagram', label: 'Instagram', path: INSTAGRAM_PATH },
  { key: 'youtube', label: 'YouTube', path: YOUTUBE_PATH },
  { key: 'x', label: 'X', path: X_PATH },
];

/**
 * Site footer. Copy and links come from GLOBAL.footer, contact details from
 * GLOBAL.contact (admin panel → Site Content → Site-wide).
 */
export const Footer = ({ footer, contact }: { footer?: FooterContent; contact?: ContactContent }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-(--color-ink-soft) to-(--color-ink) text-white">
      {/* Brand stripe */}
      <div className="h-1 bg-gradient-to-r from-(--color-links) via-sky-400 to-(--color-accent-light)" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-4 pb-6 pt-14 sm:px-6 lg:px-8">
        <NewsletterSignup />

        <div className="grid grid-cols-1 gap-10 pb-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Company Info */}
          <div>
            <BrandLogo tone="dark" className="h-20 w-auto" />
            {footer && <p className="mb-5 mt-3 text-sm leading-relaxed text-white/70">{footer.blurb}</p>}
            {contact && (
              <div className="flex gap-3">
                {SOCIALS.filter((s) => contact.social[s.key]).map((s) => (
                  <a
                    key={s.key}
                    href={contact.social[s.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={socialClass}
                    aria-label={s.label}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>

          {footer && (
            <>
              {/* Quick Links */}
              <div>
                <ColumnTitle>{footer.quickLinksTitle}</ColumnTitle>
                <ul className="space-y-2.5">
                  {footer.quickLinks.map((l) => (
                    <li key={l.href}>
                      <FooterLink href={l.href}>{l.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Our Services */}
              <div>
                <ColumnTitle>{footer.servicesTitle}</ColumnTitle>
                <ul className="space-y-2.5">
                  {footer.serviceLinks.map((l) => (
                    <li key={l.href}>
                      <FooterLink href={l.href}>{l.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Contact Details */}
          {contact && (
            <div>
              <ColumnTitle>{footer?.contactTitle ?? 'Contact Details'}</ColumnTitle>
              <ul className="space-y-3">
                {contact.phones.map((p) => (
                  <li key={p.tel}>
                    <a href={`tel:${p.tel}`} className="group flex items-center gap-3 text-sm text-white/75 transition-colors hover:text-white">
                      <span className={contactIcon}>
                        <Phone className="h-4 w-4" />
                      </span>
                      {p.display}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="group flex items-center gap-3 break-all text-sm text-white/75 transition-colors hover:text-white"
                  >
                    <span className={contactIcon}>
                      <Mail className="h-4 w-4" />
                    </span>
                    {contact.email}
                  </a>
                </li>
                <li className="group flex items-start gap-3 text-sm text-white/75">
                  <span className={contactIcon}>
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span className="pt-1">
                    {contact.addressLines.map((line, i) => (
                      <span key={i}>
                        {i > 0 && <br />}
                        {line}
                      </span>
                    ))}
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        {footer && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
            <p className="text-center text-sm text-white/60 md:text-left">{fillTemplate(footer.copyright, { year: currentYear })}</p>
            <div className={`flex items-center gap-3 rounded-full bg-white/5 py-1.5 pl-4 ring-1 ring-white/10 ${hasImage(footer.iataLogo) ? 'pr-2' : 'pr-4'}`}>
              <span className="text-sm text-white/70">{footer.iataLabel}</span>
              {hasImage(footer.iataLogo) && (
                <span className="flex h-8 items-center rounded-full bg-white px-2">
                  <Image src={footer.iataLogo} alt="IATA" width={60} height={60} className="h-6 w-auto" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};
