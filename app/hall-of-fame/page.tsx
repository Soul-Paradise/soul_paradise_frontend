import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hall of Fame - Customer Reviews & Testimonials | Soul Paradise Travels',
  description: 'Read what our happy customers say about Soul Paradise Travels. Genuine reviews and testimonials from travelers who experienced our exceptional service.',
};

const testimonials = [
  {
    id: 1,
    name: 'Amandeep Singh',
    review: 'The services SOUL PARADISE provide are really amazing. Coordination between the team members everything is just perfect. They provide great customer service with a great experience.',
    rating: 5,
    service: 'Complete Travel Package',
  },
  {
    id: 2,
    name: 'Nisha Dutta',
    review: 'After a long time, I planned to go on a long trip with my wife. Soul Paradise provides genuine Tour & Travel services to help customers feel at ease.',
    rating: 5,
    service: 'Tour Package',
  },
  {
    id: 3,
    name: 'Navneet Kaur',
    review: 'I enjoyed the traveling service very much with my friends. Soul Paradise helps to book hotels as well as complete tour packages at a reasonable price.',
    rating: 5,
    service: 'Hotel & Tour Package',
  },
  {
    id: 4,
    name: 'Rajesh Kumar',
    review: 'Excellent service for visa processing. The team was very professional and helped me get my tourist visa approved without any hassle. Highly recommended!',
    rating: 5,
    service: 'Visa Assistance',
  },
  {
    id: 5,
    name: 'Priya Sharma',
    review: 'Booked an international flight through Soul Paradise and got the best price compared to other agencies. Very transparent and helpful throughout the process.',
    rating: 5,
    service: 'International Flight Booking',
  },
  {
    id: 6,
    name: 'Gurpreet Singh',
    review: 'Amazing experience! They arranged our entire Dubai trip including flights, hotels, and sightseeing. Everything was perfectly organized and within our budget.',
    rating: 5,
    service: 'Dubai Holiday Package',
  },
];

export default function HallOfFamePage() {
  return (
    <main className="min-h-screen bg-(--color-background)">
      {/* Header Section */}
      <section className="bg-(--color-background) pt-24 pb-12 md:pt-28 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <div className="w-16 h-1 bg-(--color-links) mr-4 rounded-xl"></div>
            <h1 className="text-3xl sm:text-4xl font-bold text-(--color-foreground)">
              Hall of Fame
            </h1>
          </div>
          <p className="text-lg text-(--color-inactive) max-w-3xl">
            Celebrating our valued customers and their unforgettable travel experiences. Read genuine reviews from travelers who trusted Soul Paradise for their journeys.
          </p>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-(--color-peace) py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-(--color-background) p-6 rounded-lg text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl sm:text-5xl font-bold text-(--color-links) mb-2">
                1000+
              </div>
              <p className="text-sm sm:text-base text-(--color-inactive)">
                Happy Customers
              </p>
            </div>
            <div className="bg-(--color-background) p-6 rounded-lg text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl sm:text-5xl font-bold text-(--color-success) mb-2">
                50+
              </div>
              <p className="text-sm sm:text-base text-(--color-inactive)">
                Destinations Covered
              </p>
            </div>
            <div className="bg-(--color-background) p-6 rounded-lg text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl sm:text-5xl font-bold text-(--color-warn) mb-2">
                95%
              </div>
              <p className="text-sm sm:text-base text-(--color-inactive)">
                Success Rate
              </p>
            </div>
            <div className="bg-(--color-background) p-6 rounded-lg text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl sm:text-5xl font-bold text-(--color-primary-button) mb-2">
                24/7
              </div>
              <p className="text-sm sm:text-base text-(--color-inactive)">
                Customer Support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-(--color-foreground) mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-(--color-inactive) max-w-3xl mx-auto">
            Don't just take our word for it. Here's what our satisfied customers have to say about their travel experiences with Soul Paradise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-(--color-peace) p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, index) => (
                  <svg
                    key={index}
                    className="w-5 h-5 text-(--color-warn)"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Review Text */}
              <p className="text-(--color-inactive) mb-6 leading-relaxed">
                "{testimonial.review}"
              </p>

              {/* Customer Info */}
              <div className="border-t border-(--color-tertiary-button) pt-4">
                <div className="flex items-center gap-3">
                  {/* Avatar with Initials */}
                  <div className="w-12 h-12 bg-(--color-links) rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-lg">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-(--color-foreground)">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-(--color-inactive)">
                      {testimonial.service}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
