import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Services - Soul Paradise Travels',
  description: 'Explore our travel services including international & domestic flights, holiday packages, hotels, visa & insurance',
};

export default function ServicePage() {
  return (
    <main className="min-h-screen bg-(--color-background)">
      {/* Header Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 md:pt-28 md:pb-16">
        <div className="flex items-center mb-6">
          <div className="w-16 h-1 bg-(--color-links) mr-4 rounded-xl"></div>
          <h1 className="text-3xl sm:text-4xl font-bold text-(--color-foreground)">
            Our Services
          </h1>
        </div>
        <p className="text-lg text-(--color-inactive) max-w-3xl">
          Discover our comprehensive range of travel services designed to make your journey seamless, affordable, and memorable. From flight bookings to visa assistance, we've got you covered.
        </p>
      </section>

      {/* Services Grid */}
      <section className="bg-(--color-peace) py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Service 1 - International Air Tickets */}
            <div className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-(--color-links) rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-3">
                International Air Tickets
              </h3>
              <p className="text-(--color-inactive)">
                Competitive fares on international flights to destinations worldwide. We compare routes across multiple airlines to find you the best deals for your global travel.
              </p>
            </div>

            {/* Service 2 - Domestic Air Tickets */}
            <div className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-(--color-success) rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-3">
                Domestic Air Tickets
              </h3>
              <p className="text-(--color-inactive)">
                Affordable domestic flight bookings across India. Get instant confirmations and the most competitive prices for all major Indian airlines.
              </p>
            </div>

            {/* Service 3 - Holiday Packages */}
            <div className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-(--color-warn) rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-3">
                Holiday Packages
              </h3>
              <p className="text-(--color-inactive)">
                Carefully curated holiday packages designed to suit every budget and preference, from adventure trips to relaxing getaways and family vacations.
              </p>
            </div>

            {/* Service 4 - Hotel Booking */}
            <div className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-(--color-secondary-button) rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-3">
                Hotel Booking
              </h3>
              <p className="text-(--color-inactive)">
                Access to a wide range of accommodations worldwide, from budget-friendly options to luxury stays, tailored to your needs and preferences.
              </p>
            </div>

            {/* Service 5 - Tourist Visa */}
            <div className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-(--color-primary-button) rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-3">
                Tourist Visa
              </h3>
              <p className="text-(--color-inactive)">
                Expert guidance for various tourist visas, handled by our highly experienced and skilled staff dedicated exclusively to visa processing.
              </p>
            </div>

            {/* Service 6 - Travel Insurance */}
            <div className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-(--color-danger) rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-3">
                Travel Insurance
              </h3>
              <p className="text-(--color-inactive)">
                Comprehensive travel insurance solutions to ensure peace of mind throughout your journey, covering unforeseen circumstances and emergencies.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
