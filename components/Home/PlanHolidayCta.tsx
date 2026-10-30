import { MessageCircle, Phone } from 'lucide-react';
import { waLink, type ContactContent, type CtaContent } from '@/lib/site-content-shared';

/**
 * Closing call-to-action for things the booking tabs don't cover. Copy and
 * photo come from GLOBAL.plan_holiday_cta; numbers from GLOBAL.contact.
 */
export function PlanHolidayCta({ content, contact }: { content?: CtaContent; contact?: ContactContent }) {
  if (!content || !contact) return null;
  return (
    <section className="pb-12 pt-2">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          className="relative overflow-hidden rounded-2xl bg-(--color-ink)"
          style={
            content.image
              ? {
                  backgroundImage: `url(${content.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: content.imagePosition || 'center',
                }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-(--color-ink)/85" />
          <div className="relative flex flex-col gap-6 px-6 py-10 sm:px-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl text-white">
              <h2 className="text-2xl font-bold sm:text-3xl">{content.title}</h2>
              <p className="mt-2 text-sm leading-relaxed opacity-90 sm:text-base">{content.text}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={waLink(contact.whatsappNumber, content.whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-(--color-peace) px-5 py-3 text-sm font-semibold text-(--color-primary-button) shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <MessageCircle className="h-4 w-4" />
                {content.whatsappLabel}
              </a>
              <a
                href={`tel:${contact.salesPhone}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/60 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Phone className="h-4 w-4" />
                {content.callLabel}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
