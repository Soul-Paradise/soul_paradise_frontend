/**
 * Types and pure helpers for the site-content CMS (admin panel → Site
 * Content). Safe to import from client components: no data or fetches here.
 * The shapes mirror the zod schemas in the backend's
 * src/site-content/registry.ts.
 */
import type { Accent } from '@/components/Page/palette';

export type SitePage = 'home' | 'about' | 'services' | 'contact' | 'hall_of_fame' | 'global';
export type { Accent };

/**
 * Every image comes from the admin panel's media library; the code bundles
 * none. A field is null when no image is set or its file was deleted from
 * the bucket - render the no-photo design then.
 */
export type ImageUrl = string | null | undefined;

/** True when there's an image to render. */
export const hasImage = (url: ImageUrl): url is string => typeof url === 'string' && url.trim().length > 0;

/** GLOBAL.images: logo and heroes of pages outside the CMS. */
export interface SiteImages {
  logo?: ImageUrl;
  pageHeroes?: { policies?: ImageUrl; profile?: ImageUrl; orders?: ImageUrl };
}

export interface LinkRef {
  label: string;
  href: string;
}

export interface HeroContent {
  crumb: string;
  title: string;
  description: string;
  image: ImageUrl;
  imagePosition?: string;
  metaTitle: string;
  metaDescription: string;
}

export interface HeadingContent {
  eyebrow: string;
  title: string;
  subtitle?: string;
}

export interface HeadingWithLink extends HeadingContent {
  link?: LinkRef;
}

export interface StatItem {
  icon?: string;
  value: string;
  label: string;
  accent: Accent;
}

export type Weekday = { closed: true } | { closed: false; open: string; close: string };

export interface ContactContent {
  companyName: string;
  phones: { label: string; display: string; tel: string }[];
  whatsappNumber: string;
  salesPhone: string;
  email: string;
  addressLines: string[];
  directionsUrl: string;
  mapEmbedUrl: string;
  weeklyHours: Weekday[];
  hoursRows: { label: string; time: string; days: number[] }[];
  social: { facebook?: string; instagram?: string; youtube?: string; x?: string };
}

export interface FooterContent {
  blurb: string;
  quickLinksTitle: string;
  quickLinks: LinkRef[];
  servicesTitle: string;
  serviceLinks: LinkRef[];
  contactTitle: string;
  copyright: string;
  iataLabel: string;
  iataLogo: ImageUrl;
}

export interface CtaContent {
  title: string;
  text: string;
  image: ImageUrl;
  imagePosition?: string;
  whatsappLabel: string;
  whatsappMessage: string;
  callLabel: string;
}

export interface GlobalContent {
  contact?: ContactContent;
  footer?: FooterContent;
  plan_holiday_cta?: CtaContent;
  images?: SiteImages;
}

// ------------------------------------------------------------------- pages

export interface HomeSections {
  hero?: { title: string; subtitle: string; image: ImageUrl; imagePosition?: string };
  offers?: HeadingContent & { emptyText: string };
  long_weekends?: HeadingContent;
  popular_trips?: HeadingWithLink & {
    ctaLabel: string;
    enquiryTemplate: string;
    trips: { name: string; tagline: string; image: ImageUrl }[];
  };
  reviews?: HeadingWithLink;
  plan_holiday_cta?: Record<string, never>;
}

export interface AboutSections {
  hero?: HeroContent;
  story?: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    founderRole: string;
    founders: { name: string; initials: string; accent: Accent }[];
  };
  iata?: {
    title: string;
    subtitle: string;
    logo: ImageUrl;
    facts: { label: string; value: string }[];
    galleryLabel: string;
    galleryLinkLabel: string;
    galleryHref: string;
    collage: ImageUrl[];
  };
  services?: HeadingContent & {
    items: { icon: string; accent: Accent; title: string; body: string }[];
    linkLabel: string;
    linkHref: string;
  };
  reasons?: { eyebrow: string; title: string; items: { icon: string; title: string; body: string }[] };
  commitment?: { icon: string; title: string; text: string; stats: StatItem[] };
  plan_holiday_cta?: Record<string, never>;
}

export interface ServicesSections {
  hero?: HeroContent;
  services?: {
    bookLabel: string;
    enquiryLabel: string;
    items: {
      icon: string;
      accent: Accent;
      title: string;
      body: string;
      tab?: 'flights' | 'hotel' | 'insurance';
      enquiry?: string;
    }[];
  };
  steps?: { eyebrow: string; title: string; items: { icon: string; title: string; body: string }[] };
  plan_holiday_cta?: Record<string, never>;
}

export type ChannelKind = 'phone' | 'whatsapp' | 'email' | 'office';

export interface ContactSections {
  hero?: HeroContent;
  channels?: {
    items: { kind: ChannelKind; accent: Accent; title: string; caption: string; action: string; lines?: string[] }[];
  };
  form?: HeadingContent & { subjects: string[]; submitLabel: string; successTitle?: string };
  hours?: { title: string; openLabel: string; closedLabel: string; todayLabel: string; timezoneNote: string };
  urgent?: { title: string; text: string; whatsappLabel: string; callLabel: string };
  map?: { eyebrow: string; directionsNote: string; buttonLabel: string; mapTitle: string };
}

export interface HallOfFameSections {
  hero?: HeroContent;
  stats?: { items: StatItem[] };
  gallery?: HeadingContent & { allLabel: string; emptyText: string };
  testimonials?: HeadingContent & { emptyText: string };
  plan_holiday_cta?: Record<string, never>;
}

export interface GalleryImage {
  id: string;
  url: string;
  title: string;
  caption: string | null;
  category: string | null;
  width: number | null;
  height: number | null;
}

export interface SectionsByPage {
  home: HomeSections;
  about: AboutSections;
  services: ServicesSections;
  contact: ContactSections;
  hall_of_fame: HallOfFameSections;
  global: Record<string, never>;
}

export interface SiteContent<P extends SitePage = SitePage> {
  page: P;
  /** Visible sections only; a hidden section is absent. */
  sections: SectionsByPage[P];
  /** Visible section keys in the order the admin chose. */
  order: string[];
  global: GlobalContent;
  gallery?: GalleryImage[];
}

// ------------------------------------------------------------------ helpers

/** wa.me link for a number (digits, optional +), with an optional prefilled message. */
export function waLink(number: string, message?: string): string {
  const base = `https://wa.me/${number.replace(/[^\d]/g, '')}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Fills `{year}` / `{name}` style placeholders. */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}

/** "HH:MM" -> fractional hour. */
export const hourOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h + (m || 0) / 60;
};

/**
 * Keys in render order: the admin's `order` filtered to the keys a page knows
 * how to render (unknown or hidden keys are skipped).
 */
export function orderedKeys<K extends string>(order: string[], known: readonly K[]): K[] {
  return order.filter((k): k is K => (known as readonly string[]).includes(k));
}
