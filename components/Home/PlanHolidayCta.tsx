import { MessageCircle, Phone } from 'lucide-react';
import { SALES_PHONE, whatsappLink } from './constants';

/** Closing call-to-action for things the booking tabs don't cover. */
export function PlanHolidayCta() {
  return (
    <section className="pb-12 pt-2">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            backgroundImage: 'url(/hero_bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 70%',
          }}
        >
          <div className="absolute inset-0 bg-(--color-primary-button)/85" />
          <div className="relative flex flex-col gap-6 px-6 py-10 sm:px-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl text-white">
              <h2 className="text-2xl font-bold sm:text-3xl">Planning something bigger?</h2>
              <p className="mt-2 text-sm leading-relaxed opacity-90 sm:text-base">
                Holiday packages, tourist visas and group tours. Tell us where you
                want to go and we&apos;ll plan the rest.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappLink('Hi Soul Paradise, I would like help planning a trip.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-(--color-peace) px-5 py-3 text-sm font-semibold text-(--color-primary-button) shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
              <a
                href={`tel:${SALES_PHONE}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/60 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Phone className="h-4 w-4" />
                Call us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
