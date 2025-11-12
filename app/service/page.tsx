import type { Metadata } from 'next';
import { BottomNavbar, NAV_ITEMS } from '@/components/BottomNavbar';

export const metadata: Metadata = {
  title: 'Our Services - Soul Paradise Travels',
  description: 'Explore our travel services including flights, tours, hotels, visa & insurance',
};

export default function ServicePage() {
  return (
    <>
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Coming soon - Flight bookings, holiday packages, visa services & more
          </p>
        </div>
      </main>

      <BottomNavbar items={NAV_ITEMS} />
    </>
  );
}
