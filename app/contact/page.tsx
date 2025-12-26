'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // TODO: Replace with your actual API endpoint
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <main className="min-h-screen bg-(--color-background)">
      {/* Header Section - White Background */}
      <section className="bg-(--color-background) pt-24 pb-12 md:pt-28 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <div className="w-16 h-1 bg-(--color-links) mr-4 rounded-xl"></div>
            <h1 className="text-3xl sm:text-4xl font-bold text-(--color-foreground)">
              Contact Us
            </h1>
          </div>
          <p className="text-lg text-(--color-inactive) max-w-3xl">
            We're here to help you plan your perfect journey. Reach out to us through any of the channels below, and our team will be happy to assist you.
          </p>
        </div>
      </section>

      {/* Contact Cards (Left) and Form (Right) Section - Tinted Background */}
      <section className="bg-(--color-peace) py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Contact Cards (2x2 Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Phone */}
            <a
              href="tel:+919876816688"
              className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-(--color-links) rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-(--color-foreground) mb-2">Call Us</h3>
              <p className="text-sm text-(--color-inactive) mb-2">Mobile</p>
              <p className="text-base font-semibold text-(--color-links)">+91-9876816688</p>
              <p className="text-sm text-(--color-inactive) mt-2">Office</p>
              <p className="text-base font-semibold text-(--color-links)">0181-4673955</p>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/919876816688"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-(--color-success) rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-(--color-peace)" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-(--color-foreground) mb-2">WhatsApp</h3>
              <p className="text-sm text-(--color-inactive) mb-2">Quick replies</p>
              <p className="text-base font-semibold text-(--color-success)">Chat with us</p>
              <p className="text-xs text-(--color-inactive) mt-2">Available 24/7</p>
            </a>

            {/* Email */}
            <a
              href="mailto:soulparadise21@gmail.com"
              className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-(--color-warn) rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-(--color-foreground) mb-2">Email Us</h3>
              <p className="text-sm text-(--color-inactive) mb-2">Send us a message</p>
              <p className="text-sm font-semibold text-(--color-warn) break-all">soulparadise21@gmail.com</p>
              <p className="text-xs text-(--color-inactive) mt-2">We reply within 24 hours</p>
            </a>

            {/* Visit Us */}
            <div className="bg-(--color-background) p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group cursor-pointer">
              <div className="w-12 h-12 bg-(--color-primary-button) rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-(--color-peace)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-(--color-foreground) mb-2">Visit Our Office</h3>
              <p className="text-sm text-(--color-inactive) mb-2">Walk-in anytime</p>
              <p className="text-sm font-semibold text-(--color-foreground)">
                Shop No. 21, 1st Floor<br />
                PPR Plaza, Jalandhar<br />
                Punjab 144001
              </p>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className="bg-(--color-background) rounded-lg shadow-xl p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-(--color-foreground) mb-3">
                Send Us a Message
              </h2>
              <p className="text-(--color-inactive)">
                Fill out the form below and we'll get back to you within 24 hours
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name and Email - Same Line */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-(--color-foreground) mb-2">
                    Full Name <span className="text-(--color-danger)">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-(--color-tertiary-button) focus:border-(--color-links) focus:ring-2 focus:ring-(--color-links) focus:ring-opacity-20 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-(--color-foreground) mb-2">
                    Email Address <span className="text-(--color-danger)">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-(--color-tertiary-button) focus:border-(--color-links) focus:ring-2 focus:ring-(--color-links) focus:ring-opacity-20 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Phone and Subject - Same Line */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-(--color-foreground) mb-2">
                    Phone Number <span className="text-(--color-danger)">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-(--color-tertiary-button) focus:border-(--color-links) focus:ring-2 focus:ring-(--color-links) focus:ring-opacity-20 outline-none transition-all"
                    placeholder="+91-9876543210"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-(--color-foreground) mb-2">
                    Subject <span className="text-(--color-danger)">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-(--color-tertiary-button) focus:border-(--color-links) focus:ring-2 focus:ring-(--color-links) focus:ring-opacity-20 outline-none transition-all"
                  >
                    <option value="">Select a subject</option>
                    <option value="flight-booking">Flight Booking</option>
                    <option value="tour-package">Tour Package</option>
                    <option value="visa-assistance">Visa Assistance</option>
                    <option value="hotel-booking">Hotel Booking</option>
                    <option value="travel-insurance">Travel Insurance</option>
                    <option value="general-inquiry">General Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-(--color-foreground) mb-2">
                  Your Message <span className="text-(--color-danger)">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-(--color-tertiary-button) focus:border-(--color-links) focus:ring-2 focus:ring-(--color-links) focus:ring-opacity-20 outline-none transition-all resize-none"
                  placeholder="Tell us about your travel plans or any questions you have..."
                ></textarea>
              </div>

              {/* Submit Status Messages */}
              {submitStatus === 'success' && (
                <div className="p-4 bg-(--color-success) bg-opacity-10 border border-(--color-success) rounded-lg">
                  <p className="text-(--color-success) font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Message sent successfully! We'll get back to you soon.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-(--color-danger) bg-opacity-10 border border-(--color-danger) rounded-lg">
                  <p className="text-(--color-danger) font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Something went wrong. Please try again or contact us directly.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-(--color-primary-button) text-(--color-peace) rounded-lg font-semibold hover:bg-(--color-secondary-button) transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      </section>

      {/* Office Hours & Map Section - White Background */}
      <section className="bg-(--color-background) py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Office Hours */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-(--color-foreground) mb-6">
                Office Hours
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-(--color-tertiary-button)">
                  <span className="font-semibold text-(--color-foreground)">Monday - Friday</span>
                  <span className="text-(--color-inactive)">9:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-(--color-tertiary-button)">
                  <span className="font-semibold text-(--color-foreground)">Saturday</span>
                  <span className="text-(--color-inactive)">10:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-(--color-tertiary-button)">
                  <span className="font-semibold text-(--color-foreground)">Sunday</span>
                  <span className="text-(--color-inactive)">Closed</span>
                </div>
              </div>

              <div className="mt-8 p-6 bg-(--color-peace) rounded-lg shadow-xs">
                <h3 className="text-lg font-bold text-(--color-foreground) mb-3">Need Urgent Assistance?</h3>
                <p className="text-(--color-inactive) mb-4">
                  For urgent travel queries outside office hours, please contact us via WhatsApp or call our mobile number.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://wa.me/919876816688"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-(--color-primary-button) text-(--color-peace) rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    WhatsApp Now
                  </a>
                  <a
                    href="tel:+919876816688"
                    className="px-6 py-3 border border-(--color-tertiary-button) text-(--color-primary-button) rounded-lg font-semibold hover:border-(--color-secondary-button)" 
                  >
                    Call Now
                  </a>
                </div>
              </div>
            </div>

            {/* Google Maps */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-(--color-foreground) mb-6">
                Find Us on Map
              </h2>
              <div className="rounded-lg overflow-hidden shadow-lg h-[400px] md:h-[500px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3408.9076254567234!2d75.56862831511744!3d31.325020981460564!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391a5a5a5a5a5a5a%3A0x5a5a5a5a5a5a5a5a!2sPPR%20Plaza!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Soul Paradise Office Location"
                ></iframe>
              </div>
              <div className="mt-4 p-4 bg-(--color-peace) rounded-lg">
                <p className="text-sm text-(--color-inactive)">
                  <span className="font-semibold text-(--color-foreground)">Directions:</span> Located in the heart of Jalandhar, easily accessible from major areas. Free parking available nearby.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


    </main>
  );
}
