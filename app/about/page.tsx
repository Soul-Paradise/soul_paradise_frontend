import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us - Soul Paradise Travels',
  description: 'Learn about Soul Paradise Travels - Your trusted IATA-accredited travel partner founded by Mr. Sanjay Srivastava and Mrs. Shafali Srivastava in Jalandhar, Punjab',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-(--color-background)">
      {/* Our Story Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 md:pt-28 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-1 bg-(--color-links) mr-4 rounded-xl"></div>
                <h2 className="text-3xl sm:text-4xl font-bold text-(--color-foreground)">
                  Our Story
                </h2>
              </div>
            <div className="space-y-4 text-(--color-inactive) leading-relaxed text-base">
              <p>
                Soul Paradise is a proud initiative founded by <span className="font-semibold text-(--color-foreground)">Mr. Sanjay Srivastava</span> and <span className="font-semibold text-(--color-foreground)">Mrs. Shafali Srivastava</span>, driven by a passion for making travel accessible, affordable, and memorable for everyone.
              </p>
              <p>
                What started as a vision to provide exceptional travel services has grown into a trusted name in the industry. We believe that every journey should be more than just a destination—it should be an experience that enriches your life.
              </p>
              <p>
                Based in <span className="font-semibold text-(--color-foreground)">Jalandhar, Punjab</span>, we've built our reputation on three pillars: competitive pricing, personalized service, and unwavering commitment to quality.
              </p>
            </div>
          </div>
          <div className="bg-(--color-peace) p-6 sm:p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/iata_logo.png"
                alt="IATA Accredited"
                width={150}
                height={150}
                className="object-contain"
              />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-(--color-foreground) mb-2">
                IATA Accredited
              </h3>
              <p className="text-(--color-inactive) mb-4">
                Certified by the International Air Transport Association
              </p>
              <div className="bg-(--color-background) p-4 rounded-lg">
                <p className="text-sm text-(--color-inactive)">
                  <span className="font-semibold text-(--color-foreground)">IATA Code:</span> 14009881
                </p>
                <p className="text-sm text-(--color-inactive)">
                  <span className="font-semibold text-(--color-foreground)">Accreditation Type:</span> GoLite
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="bg-(--color-peace) py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-(--color-foreground) text-center mb-8 md:mb-12">
            What We Do
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Service 1 */}
            <div className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-(--color-links) rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-3">
                Flight Ticketing
              </h3>
              <p className="text-(--color-inactive)">
                We search and compare routes across multiple airlines to find you the most competitive fares for both international and domestic travel.
              </p>
            </div>

            {/* Service 2 */}
            <div className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-(--color-success) rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-3">
                Tour Packages
              </h3>
              <p className="text-(--color-inactive)">
                Curated holiday packages designed to suit every budget and preference, from adventure trips to relaxing getaways.
              </p>
            </div>

            {/* Service 3 */}
            <div className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-(--color-warn) rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-3">
                Visa Assistance
              </h3>
              <p className="text-(--color-inactive)">
                Expert guidance for various tourist visas, handled by our highly experienced and skilled staff dedicated exclusively to visa processing.
              </p>
            </div>

            {/* Service 4 */}
            <div className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-(--color-secondary-button) rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-3">
                Travel Insurance
              </h3>
              <p className="text-(--color-inactive)">
                Comprehensive travel insurance solutions to ensure peace of mind throughout your journey, covering unforeseen circumstances.
              </p>
            </div>

            {/* Service 5 */}
            <div className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-(--color-primary-button) rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-3">
                Hotel Bookings
              </h3>
              <p className="text-(--color-inactive)">
                Access to a wide range of accommodations worldwide, from budget-friendly options to luxury stays, tailored to your needs.
              </p>
            </div>

            {/* Service 6 */}
            <div className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-(--color-danger) rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-3">
                24/7 Support
              </h3>
              <p className="text-(--color-inactive)">
                Round-the-clock customer support to assist you at every stage of your journey, ensuring a smooth travel experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-(--color-foreground) text-center mb-8 md:mb-12">
          Why Choose Soul Paradise?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="flex gap-4">
            <div className="shrink-0">
              <div className="w-10 h-10 bg-(--color-success) rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-(--color-peace)" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-2">
                Best Price Guarantee
              </h3>
              <p className="text-(--color-inactive)">
                We compare multiple airlines and routes to ensure you always get the most competitive rates for your journey.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0">
              <div className="w-10 h-10 bg-(--color-success) rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-(--color-peace)" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-2">
                IATA Certified
              </h3>
              <p className="text-(--color-inactive)">
                Our IATA accreditation ensures you're working with a globally recognized and trusted travel service provider.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0">
              <div className="w-10 h-10 bg-(--color-success) rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-(--color-peace)" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-2">
                Expert Team
              </h3>
              <p className="text-(--color-inactive)">
                Our highly experienced staff, especially in visa processing, brings years of expertise to help you with every detail.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0">
              <div className="w-10 h-10 bg-(--color-success) rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-(--color-peace)" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-(--color-foreground) mb-2">
                Personalized Service
              </h3>
              <p className="text-(--color-inactive)">
                Every client's budget and preferences matter to us. We tailor our services to create your perfect travel experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Commitment Section */}
      <section className="bg-(--color-peace) py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Our Commitment to You
          </h2>
          <p className="text-lg sm:text-xl leading-relaxed mb-8">
            At Soul Paradise, we don't just book tickets—we create experiences. Our commitment to service, quality, and operational excellence sets the benchmark for travel services in India. We continually innovate to bring you the best in tourism and hospitality, ensuring every journey with us is prompt, efficient, and memorable.
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-8">
            <div className="bg-(--color-background) px-6 py-4 rounded-lg min-w-[140px] shadow hover:shadow-md transition-shadow">
              <p className="text-2xl sm:text-3xl font-bold mb-1">100%</p>
              <p className="text-xs sm:text-sm">Customer Satisfaction</p>
            </div>
            <div className="bg-(--color-background) px-6 py-4 rounded-lg min-w-[140px] shadow hover:shadow-md transition-shadow">
              <p className="text-2xl sm:text-3xl font-bold mb-1">24/7</p>
              <p className="text-xs sm:text-sm">Support Available</p>
            </div>
            <div className="bg-(--color-background) px-6 py-4 rounded-lg min-w-[140px] shadow hover:shadow-md transition-shadow">
              <p className="text-2xl sm:text-3xl font-bold mb-1">IATA</p>
              <p className="text-xs sm:text-sm">Certified Agency</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
