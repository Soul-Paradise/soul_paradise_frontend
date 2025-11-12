import type { Metadata } from 'next';
import { BottomNavbar, NAV_ITEMS } from '@/components/BottomNavbar';

export const metadata: Metadata = {
  title: 'Hall of Fame - Soul Paradise Travels',
  description: 'Our honored guests and memorable journeys',
};

export default function HallOfFamePage() {
  return (
    <>
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Hall of Fame</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Coming soon - Our honored guests and memorable journeys
          </p>
        </div>
      </main>

      <BottomNavbar items={NAV_ITEMS} />
    </>
  );
}
