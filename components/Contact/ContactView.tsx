'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import { ZodError } from 'zod';
import { ArrowRight, Clock, Loader2, Mail, MapPin, Navigation, Phone, Send, Store, Zap, type LucideIcon } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { contactFormSchema } from '@/lib/validations/contact';
import { showToast } from '@/lib/toast';
import { PageHero, IconTile, WhatsAppIcon } from '@/components/Page';
import { HeroSpacer } from '@/components/SiteContent/HeroSpacer';
import {
  hourOf,
  orderedKeys,
  waLink,
  type ChannelKind,
  type ContactContent,
  type ContactSections,
  type SiteContent,
  type Weekday,
} from '@/lib/site-content-shared';

/** Current weekday and fractional hour in India, whatever the visitor's timezone. */
function nowInIndia() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, hour: Number(get('hour')) + Number(get('minute')) / 60 };
}

/** Live open/closed status from the weekly hours; rendered only on the client (server snapshot is null). */
function useOfficeStatus(weeklyHours: Weekday[]) {
  const snapshot = useCallback(() => {
    const { day, hour } = nowInIndia();
    const h = weeklyHours[day];
    return h && !h.closed && hour >= hourOf(h.open) && hour < hourOf(h.close) ? `open:${day}` : `closed:${day}`;
  }, [weeklyHours]);
  return useSyncExternalStore(
    (onChange) => {
      const id = setInterval(onChange, 60_000);
      return () => clearInterval(id);
    },
    snapshot,
    () => null,
  );
}

const CHANNEL_ICON: Record<Exclude<ChannelKind, 'whatsapp'>, LucideIcon> = { phone: Phone, email: Mail, office: Store };

/** Lines + link for a contact card, taken from the site-wide contact details. */
function channelTarget(kind: ChannelKind, contact: ContactContent): { lines: string[]; href: string; external: boolean } {
  switch (kind) {
    case 'phone':
      return { lines: contact.phones.map((p) => p.display), href: `tel:${contact.phones[0]?.tel ?? contact.salesPhone}`, external: false };
    case 'whatsapp':
      return { lines: [], href: waLink(contact.whatsappNumber), external: true };
    case 'email':
      return { lines: [contact.email], href: `mailto:${contact.email}`, external: false };
    case 'office':
      return { lines: contact.addressLines, href: contact.directionsUrl, external: true };
  }
}

/** Body sections in admin order; form, hours and urgent share one band. */
const BODY_KEYS = ['channels', 'form', 'hours', 'urgent', 'map'] as const;
const BAND_KEYS: readonly string[] = ['form', 'hours', 'urgent'];

export function ContactView({ content }: { content: SiteContent<'contact'> }) {
  const { sections, global } = content;
  const contact = global.contact;
  const keys = orderedKeys(content.order, BODY_KEYS);
  const bandAt = keys.findIndex((k) => BAND_KEYS.includes(k));

  return (
    <main className="min-h-screen bg-(--color-background)">
      {sections.hero ? (
        <PageHero
          crumb={sections.hero.crumb}
          title={sections.hero.title}
          description={sections.hero.description}
          image={sections.hero.image}
          imagePosition={sections.hero.imagePosition}
        />
      ) : (
        <HeroSpacer />
      )}

      {contact &&
        keys.map((key, i) => {
          if (key === 'channels' && sections.channels) {
            return <Channels key={key} content={sections.channels} contact={contact} overlap={!!sections.hero && i === 0} />;
          }
          if (BAND_KEYS.includes(key)) {
            return i === bandAt ? <FormBand key="band" sections={sections} contact={contact} /> : null;
          }
          if (key === 'map' && sections.map) return <MapBlock key={key} content={sections.map} contact={contact} />;
          return null;
        })}
    </main>
  );
}

function Channels({
  content,
  contact,
  overlap,
}: {
  content: NonNullable<ContactSections['channels']>;
  contact: ContactContent;
  overlap: boolean;
}) {
  return (
    <section className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${overlap ? '-mt-16' : 'pt-16'}`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {content.items.map((c) => {
          const target = channelTarget(c.kind, contact);
          const lines = c.lines?.length ? c.lines : target.lines;
          return (
            <a
              key={c.title}
              href={target.href}
              {...(target.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="group flex flex-col rounded-2xl bg-(--color-peace) p-5 shadow-xl ring-1 ring-(--color-tertiary-button) transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              {c.kind === 'whatsapp' ? (
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <WhatsAppIcon className="h-6 w-6" />
                </span>
              ) : (
                <IconTile icon={CHANNEL_ICON[c.kind]} accent={c.accent} />
              )}
              <h3 className="mt-4 text-lg font-bold text-(--color-foreground)">{c.title}</h3>
              <p className="text-xs text-(--color-inactive)">{c.caption}</p>
              <div className="mb-4 mt-3 space-y-0.5">
                {lines.map((line) => (
                  <p key={line} className="break-words text-sm font-semibold text-(--color-foreground)">
                    {line}
                  </p>
                ))}
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-(--color-links)">
                {c.action}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function FormBand({ sections, contact }: { sections: ContactSections; contact: ContactContent }) {
  const { form, hours, urgent } = sections;
  const side = hours || urgent;
  if (!form && !side) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {form && <ContactForm content={form} wide={!side} />}
        {side && (
          <div className={`flex flex-col gap-6 ${form ? 'lg:col-span-2' : 'lg:col-span-5 lg:flex-row'}`}>
            {hours && <OfficeHours content={hours} contact={contact} />}
            {urgent && <Urgent content={urgent} contact={contact} />}
          </div>
        )}
      </div>
    </section>
  );
}

function ContactForm({ content, wide }: { content: NonNullable<ContactSections['form']>; wide: boolean }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      // Validate form data
      const validatedData = contactFormSchema.parse({
        fullName: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
        subject: formData.subject,
        message: formData.message,
      });

      // Submit to backend
      await api.submitContactForm(validatedData);

      // Reset form on success
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });

      showToast({
        title: content.successTitle || 'Message Sent Successfully!',
        body: "Thank you for reaching out. We'll get back to you at the earliest.",
        type: 'success',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        // Handle validation errors
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            // Map field names back to form field names
            const fieldMap: Record<string, string> = {
              fullName: 'name',
              phoneNumber: 'phone',
            };
            const fieldName = fieldMap[err.path[0] as string] || (err.path[0] as string);
            errors[fieldName] = err.message;
          }
        });
        setFieldErrors(errors);
      } else {
        // Handle API errors
        const apiError = error as ApiError;
        showToast({
          title: 'Failed to Send Message',
          body: apiError.message || 'Something went wrong. Please try again later.',
          type: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-xl border bg-(--color-background) px-4 py-3 text-sm text-(--color-foreground) outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-4 ${
      fieldErrors[field]
        ? 'border-(--color-danger) focus:ring-(--color-danger)/15'
        : 'border-(--color-tertiary-button) focus:border-(--color-links) focus:ring-(--color-links)/15'
    }`;

  const label = (htmlFor: string, text: string) => (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-(--color-foreground)">
      {text} <span className="text-(--color-danger)">*</span>
    </label>
  );

  const error = (field: string) =>
    fieldErrors[field] && <p className="mt-1 text-sm text-(--color-danger)">{fieldErrors[field]}</p>;

  return (
    <div
      className={`rounded-2xl bg-(--color-peace) p-6 shadow-lg ring-1 ring-(--color-tertiary-button) sm:p-8 ${wide ? 'lg:col-span-5' : 'lg:col-span-3'}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--color-links)">{content.eyebrow}</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-(--color-foreground) sm:text-3xl">{content.title}</h2>
      {content.subtitle && <p className="mt-2 text-sm text-(--color-inactive)">{content.subtitle}</p>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            {label('name', 'Full Name')}
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputClass('name')} placeholder="John Doe" />
            {error('name')}
          </div>
          <div>
            {label('email', 'Email Address')}
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass('email')} placeholder="john@example.com" />
            {error('email')}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            {label('phone', 'Phone Number')}
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className={inputClass('phone')} placeholder="+91-9876543210" />
            {error('phone')}
          </div>
          <div>
            {label('subject', 'Subject')}
            <select id="subject" name="subject" value={formData.subject} onChange={handleChange} required className={inputClass('subject')}>
              <option value="">Select a subject</option>
              {content.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {error('subject')}
          </div>
        </div>

        <div>
          {label('message', 'Your Message')}
          <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={5} className={`${inputClass('message')} resize-none`} placeholder="Tell us about your travel plans or any questions you have..." />
          {error('message')}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-(--color-primary-button) px-6 py-3.5 font-semibold text-(--color-peace) shadow-lg transition hover:bg-(--color-secondary-button) disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              {content.submitLabel}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function OfficeHours({ content, contact }: { content: NonNullable<ContactSections['hours']>; contact: ContactContent }) {
  const status = useOfficeStatus(contact.weeklyHours);
  const isOpen = status?.startsWith('open');
  const today = status ? Number(status.split(':')[1]) : -1;
  return (
    <div className="flex-1 rounded-2xl bg-(--color-peace) p-6 shadow-lg ring-1 ring-(--color-tertiary-button)">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold text-(--color-foreground)">
          <Clock className="h-5 w-5 text-(--color-links)" />
          {content.title}
        </h2>
        {status && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isOpen ? 'bg-(--color-success)/15 text-(--color-success)' : 'bg-(--color-danger)/10 text-(--color-danger)'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isOpen && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-60" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${isOpen ? 'bg-(--color-success)' : 'bg-(--color-danger)'}`} />
            </span>
            {isOpen ? content.openLabel : content.closedLabel}
          </span>
        )}
      </div>
      <ul className="mt-4 space-y-1">
        {contact.hoursRows.map((row) => {
          const isToday = row.days.includes(today);
          const closed = row.days.every((d) => contact.weeklyHours[d]?.closed);
          return (
            <li
              key={row.label}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${isToday ? 'bg-(--color-links)/10 font-semibold' : ''}`}
            >
              <span className="text-(--color-foreground)">
                {row.label}
                {isToday && <span className="ml-2 text-[11px] font-bold uppercase text-(--color-links)">{content.todayLabel}</span>}
              </span>
              <span className={closed ? 'text-(--color-danger)' : 'text-(--color-inactive)'}>{row.time}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-(--color-inactive)">{content.timezoneNote}</p>
    </div>
  );
}

function Urgent({ content, contact }: { content: NonNullable<ContactSections['urgent']>; contact: ContactContent }) {
  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-br from-(--color-ink-soft) to-(--color-ink) p-6 text-white shadow-lg">
      <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
      <Zap className="relative h-7 w-7 text-amber-300" />
      <h3 className="relative mt-3 text-lg font-bold">{content.title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-white/80">{content.text}</p>
      <div className="relative mt-5 flex flex-wrap gap-3">
        <a
          href={waLink(contact.whatsappNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-(--color-primary-button) transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <WhatsAppIcon className="h-4 w-4 text-emerald-600" />
          {content.whatsappLabel}
        </a>
        <a
          href={`tel:${contact.salesPhone}`}
          className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Phone className="h-4 w-4" />
          {content.callLabel}
        </a>
      </div>
    </div>
  );
}

function MapBlock({ content, contact }: { content: NonNullable<ContactSections['map']>; contact: ContactContent }) {
  const [firstLine, ...restLines] = contact.addressLines;
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 md:pb-20 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-(--color-tertiary-button)">
        <div className="h-[380px] bg-(--color-tertiary-button) md:h-[460px]">
          <iframe
            src={contact.mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={content.mapTitle}
          />
        </div>
        <div className="border-t border-(--color-tertiary-button) bg-(--color-peace) p-5 md:absolute md:bottom-5 md:left-5 md:max-w-sm md:rounded-2xl md:border-0 md:shadow-2xl">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-(--color-links)">
            <MapPin className="h-4 w-4" />
            {content.eyebrow}
          </p>
          {firstLine && <p className="mt-2 font-bold text-(--color-foreground)">{firstLine}</p>}
          {restLines.map((line) => (
            <p key={line} className="text-sm text-(--color-inactive)">
              {line}
            </p>
          ))}
          <p className="mt-2 text-xs text-(--color-inactive)">
            <span className="font-semibold text-(--color-foreground)">Directions:</span> {content.directionsNote}
          </p>
          <a
            href={contact.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-(--color-primary-button) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--color-secondary-button)"
          >
            <Navigation className="h-4 w-4" />
            {content.buttonLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
