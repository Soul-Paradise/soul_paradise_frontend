import type { Metadata } from 'next';
import { BottomNavbar, NAV_ITEMS } from '@/components/BottomNavbar';

export const metadata: Metadata = {
  title: 'About Us - Soul Paradise Travels',
  description: 'Learn about Soul Paradise Travels - Your trusted travel partner in Jalandhar, Punjab',
};

export default function AboutPage() {
  return (
    <>
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">About Us</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Coming soon - Learn about Soul Paradise Travels
          </p>
        </div>
      </main>

      <BottomNavbar items={NAV_ITEMS} />
    </>
  );
}
