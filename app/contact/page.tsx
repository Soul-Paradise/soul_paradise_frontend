'use client';

import { useState, useSyncExternalStore } from 'react';
import { ZodError } from 'zod';
import {
  ArrowRight,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Send,
  Store,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { contactFormSchema } from '@/lib/validations/contact';
import { showToast } from '@/lib/toast';
import { PageHero, IconTile, WhatsAppIcon, type Accent } from '@/components/Page';

const DIRECTIONS_URL = 'https://www.google.com/maps/search/?api=1&query=SOUL+PARADISE+JALANDHAR+INDIA';

/** Office hours in IST. `null` = closed that day. Index = getDay() (0 = Sunday). */
const HOURS: ({ open: number; close: number } | null)[] = [
  null,
  { open: 9, close: 19 },
  { open: 9, close: 19 },
  { open: 9, close: 19 },
  { open: 9, close: 19 },
  { open: 9, close: 19 },
  { open: 10, close: 18 },
];

const HOURS_ROWS = [
  { days: 'Monday - Friday', time: '9:00 AM - 7:00 PM', dayIdx: [1, 2, 3, 4, 5] },
  { days: 'Saturday', time: '10:00 AM - 6:00 PM', dayIdx: [6] },
  { days: 'Sunday', time: 'Closed', dayIdx: [0] },
];

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

function officeStatus(): string {
  const { day, hour } = nowInIndia();
  const h = HOURS[day];
  return h && hour >= h.open && hour < h.close ? `open:${day}` : `closed:${day}`;
}

/** Live open/closed status; rendered only on the client (server snapshot is null). */
function useOfficeStatus() {
  return useSyncExternalStore(
    (onChange) => {
      const id = setInterval(onChange, 60_000);
      return () => clearInterval(id);
    },
    officeStatus,
    () => null
  );
}

const CHANNELS: {
  icon: LucideIcon | 'whatsapp';
  accent: Accent;
  title: string;
  caption: string;
  lines: string[];
  href?: string;
  action?: string;
  external?: boolean;
}[] = [
  {
    icon: Phone,
    accent: 'blue',
    title: 'Call Us',
    caption: 'Mobile & office',
    lines: ['+91-9876816688', '0181-4673955'],
    href: 'tel:+919876816688',
    action: 'Call now',
  },
  {
    icon: 'whatsapp',
    accent: 'green',
    title: 'WhatsApp',
    caption: 'Quick replies · Available 24/7',
    lines: ['Chat with us'],
    href: 'https://wa.me/919876816688',
    action: 'Start chat',
    external: true,
  },
  {
    icon: Mail,
    accent: 'orange',
    title: 'Email Us',
    caption: 'We reply within 24 hours',
    lines: ['soulparadise21@gmail.com'],
    href: 'mailto:soulparadise21@gmail.com',
    action: 'Send email',
  },
  {
    icon: Store,
    accent: 'purple',
    title: 'Visit Our Office',
    caption: 'Walk-in anytime',
    lines: ['Shop No. 21, 1st Floor', 'PPR Plaza, Jalandhar, Punjab 144001'],
    href: DIRECTIONS_URL,
    action: 'Get directions',
    external: true,
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const status = useOfficeStatus();
  const isOpen = status?.startsWith('open');
  const today = status ? Number(status.split(':')[1]) : -1;

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
        title: 'Message Sent Successfully!',
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
    <main className="min-h-screen bg-(--color-background)">
      <PageHero
        crumb="Contact Us"
        title="Let's plan your next journey"
        description="We're here to help you plan your perfect journey. Reach out to us through any of the channels below, and our team will be happy to assist you."
        image="/ne_3.jpg"
        imagePosition="center 60%"
      />

      {/* Contact channels, overlapping the hero */}
      <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map((c) => (
            <a
              key={c.title}
              href={c.href}
              {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="group flex flex-col rounded-2xl bg-(--color-peace) p-5 shadow-xl ring-1 ring-(--color-tertiary-button) transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              {c.icon === 'whatsapp' ? (
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <WhatsAppIcon className="h-6 w-6" />
                </span>
              ) : (
                <IconTile icon={c.icon} accent={c.accent} />
              )}
              <h3 className="mt-4 text-lg font-bold text-(--color-foreground)">{c.title}</h3>
              <p className="text-xs text-(--color-inactive)">{c.caption}</p>
              <div className="mb-4 mt-3 space-y-0.5">
                {c.lines.map((line) => (
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
          ))}
        </div>
      </section>

      {/* Form + hours */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-2xl bg-(--color-peace) p-6 shadow-lg ring-1 ring-(--color-tertiary-button) sm:p-8 lg:col-span-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--color-links)">Write to us</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-(--color-foreground) sm:text-3xl">
              Send Us a Message
            </h2>
            <p className="mt-2 text-sm text-(--color-inactive)">
              Fill out the form below and we&apos;ll get back to you within 24 hours
            </p>

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
                    <option value="Flight Booking">Flight Booking</option>
                    <option value="Tour Package">Tour Package</option>
                    <option value="Visa Assistance">Visa Assistance</option>
                    <option value="Hotel Booking">Hotel Booking</option>
                    <option value="Travel Insurance">Travel Insurance</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Other">Other</option>
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
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Office hours with live status */}
            <div className="rounded-2xl bg-(--color-peace) p-6 shadow-lg ring-1 ring-(--color-tertiary-button)">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xl font-bold text-(--color-foreground)">
                  <Clock className="h-5 w-5 text-(--color-links)" />
                  Office Hours
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
                    {isOpen ? 'Open now' : 'Closed now'}
                  </span>
                )}
              </div>
              <ul className="mt-4 space-y-1">
                {HOURS_ROWS.map((row) => {
                  const isToday = row.dayIdx.includes(today);
                  return (
                    <li
                      key={row.days}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${
                        isToday ? 'bg-(--color-links)/10 font-semibold' : ''
                      }`}
                    >
                      <span className="text-(--color-foreground)">
                        {row.days}
                        {isToday && <span className="ml-2 text-[11px] font-bold uppercase text-(--color-links)">Today</span>}
                      </span>
                      <span className={row.time === 'Closed' ? 'text-(--color-danger)' : 'text-(--color-inactive)'}>
                        {row.time}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-(--color-inactive)">All times are Indian Standard Time (IST).</p>
            </div>

            {/* Urgent help */}
            <div className="relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-br from-(--color-ink-soft) to-(--color-ink) p-6 text-white shadow-lg">
              <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
              <Zap className="relative h-7 w-7 text-amber-300" />
              <h3 className="relative mt-3 text-lg font-bold">Need Urgent Assistance?</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-white/80">
                For urgent travel queries outside office hours, please contact us via WhatsApp or call our mobile number.
              </p>
              <div className="relative mt-5 flex flex-wrap gap-3">
                <a
                  href="https://wa.me/919876816688"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-(--color-primary-button) transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <WhatsAppIcon className="h-4 w-4 text-emerald-600" />
                  WhatsApp Now
                </a>
                <a
                  href="tel:+919876816688"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" />
                  Call Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 md:pb-20 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-(--color-tertiary-button)">
          <div className="h-[380px] bg-(--color-tertiary-button) md:h-[460px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d27268.05989596027!2d75.599576!3d31.317355!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391a5b68da0a20fb%3A0x54bdb5d17a992f5d!2sSOUL%20PARADISE%20JALANDHAR%20INDIA!5e0!3m2!1sen!2sin!4v1767454904897!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Soul Paradise Office Location"
            />
          </div>
          <div className="border-t border-(--color-tertiary-button) bg-(--color-peace) p-5 md:absolute md:bottom-5 md:left-5 md:max-w-sm md:rounded-2xl md:border-0 md:shadow-2xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-(--color-links)">
              <MapPin className="h-4 w-4" />
              Find Us on Map
            </p>
            <p className="mt-2 font-bold text-(--color-foreground)">Shop No. 21, 1st Floor, PPR Plaza</p>
            <p className="text-sm text-(--color-inactive)">Jalandhar, Punjab 144001</p>
            <p className="mt-2 text-xs text-(--color-inactive)">
              <span className="font-semibold text-(--color-foreground)">Directions:</span> Located in the heart of Jalandhar, easily accessible from major areas. Free parking available nearby.
            </p>
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-(--color-primary-button) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--color-secondary-button)"
            >
              <Navigation className="h-4 w-4" />
              Get directions
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
