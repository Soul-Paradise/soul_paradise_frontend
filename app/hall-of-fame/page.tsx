'use client';

import Image from 'next/image';
import { useState } from 'react';

const galleryImages = [
  { id: 1, src: '/dubai_1.jpg', alt: 'Dubai Travel Experience', category: 'Dubai' },
  { id: 2, src: '/dubai_2.jpg', alt: 'Dubai Adventure', category: 'Dubai' },
  { id: 3, src: '/dubai_3.jpg', alt: 'Dubai Memories', category: 'Dubai' },
  { id: 4, src: '/dubai_4.jpg', alt: 'Dubai Journey', category: 'Dubai' },
  { id: 5, src: '/kerala_1.jpg', alt: 'Kerala Backwaters', category: 'Kerala' },
  { id: 6, src: '/kerala_2.jpg', alt: 'Kerala Beauty', category: 'Kerala' },
  { id: 7, src: '/kerala_3.jpg', alt: 'Kerala Adventure', category: 'Kerala' },
  { id: 8, src: '/kerala_4.jpg', alt: 'Kerala Experience', category: 'Kerala' },
  { id: 9, src: '/kerala_5.jpg', alt: 'Kerala Memories', category: 'Kerala' },
  { id: 10, src: '/kerala_6.jpg', alt: 'Kerala Journey', category: 'Kerala' },
  { id: 11, src: '/rajasthan_1.jpg', alt: 'Rajasthan Heritage', category: 'Rajasthan' },
  { id: 12, src: '/rajasthan_2.jpg', alt: 'Rajasthan Culture', category: 'Rajasthan' },
  { id: 13, src: '/rajasthan_3.jpg', alt: 'Rajasthan Adventure', category: 'Rajasthan' },
  { id: 14, src: '/rajasthan_4.jpg', alt: 'Rajasthan Memories', category: 'Rajasthan' },
  { id: 15, src: '/rajasthan_5.jpg', alt: 'Rajasthan Journey', category: 'Rajasthan' },
  { id: 16, src: '/ne_1.jpg', alt: 'Northeast Beauty', category: 'Northeast' },
  { id: 17, src: '/ne_2.jpg', alt: 'Northeast Adventure', category: 'Northeast' },
  { id: 18, src: '/ne_3.jpg', alt: 'Northeast Experience', category: 'Northeast' },
  { id: 19, src: '/ne_4.jpg', alt: 'Northeast Memories', category: 'Northeast' },
  { id: 20, src: '/ne_5.jpg', alt: 'Northeast Journey', category: 'Northeast' },
  { id: 21, src: '/digha_1.jpg', alt: 'Digha Beach', category: 'Digha' },
  { id: 22, src: '/digha_2.jpg', alt: 'Digha Memories', category: 'Digha' },
];

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
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(galleryImages.map(img => img.category)))];
  const filteredImages = selectedCategory === 'All'
    ? galleryImages
    : galleryImages.filter(img => img.category === selectedCategory);

  const openLightbox = (id: number) => setSelectedImage(id);
  const closeLightbox = () => setSelectedImage(null);

  const goToPrevious = () => {
    if (selectedImage !== null) {
      const currentIndex = filteredImages.findIndex(img => img.id === selectedImage);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredImages.length - 1;
      setSelectedImage(filteredImages[prevIndex].id);
    }
  };

  const goToNext = () => {
    if (selectedImage !== null) {
      const currentIndex = filteredImages.findIndex(img => img.id === selectedImage);
      const nextIndex = currentIndex < filteredImages.length - 1 ? currentIndex + 1 : 0;
      setSelectedImage(filteredImages[nextIndex].id);
    }
  };

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
            Celebrating our valued customers and their unforgettable travel experiences. Browse through memories captured during amazing journeys with Soul Paradise.
          </p>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section className="bg-(--color-peace) py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-(--color-foreground) mb-4">
              Travel Gallery
            </h2>
            <p className="text-lg text-(--color-inactive) max-w-3xl mx-auto mb-8">
              Moments captured from our customers' amazing journeys across beautiful destinations
            </p>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 cursor-pointer ${
                    selectedCategory === category
                      ? 'bg-(--color-links) text-white shadow-lg'
                      : 'bg-(--color-background) text-(--color-inactive) hover:bg-(--color-tertiary-button)'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => openLightbox(image.id)}
              >
                <div className="relative w-full aspect-[4/3]">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    priority={image.id <= 4}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm font-medium">{image.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Previous"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Next"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="relative max-w-7xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {filteredImages.find(img => img.id === selectedImage) && (
              <div className="relative w-full h-full">
                <Image
                  src={filteredImages.find(img => img.id === selectedImage)!.src}
                  alt={filteredImages.find(img => img.id === selectedImage)!.alt}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics Section */}
      <section className="bg-(--color-background) py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-(--color-peace) p-6 rounded-lg text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl sm:text-5xl font-bold text-(--color-links) mb-2">
                1000+
              </div>
              <p className="text-sm sm:text-base text-(--color-inactive)">
                Happy Customers
              </p>
            </div>
            <div className="bg-(--color-peace) p-6 rounded-lg text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl sm:text-5xl font-bold text-(--color-success) mb-2">
                50+
              </div>
              <p className="text-sm sm:text-base text-(--color-inactive)">
                Destinations Covered
              </p>
            </div>
            <div className="bg-(--color-peace) p-6 rounded-lg text-center shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl sm:text-5xl font-bold text-(--color-warn) mb-2">
                95%
              </div>
              <p className="text-sm sm:text-base text-(--color-inactive)">
                Success Rate
              </p>
            </div>
            <div className="bg-(--color-peace) p-6 rounded-lg text-center shadow-md hover:shadow-lg transition-shadow">
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
