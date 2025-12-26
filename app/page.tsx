'use client';

import { useAuth } from '@/contexts/AuthContext';
import { BookingTabs } from '@/components/BookingTabs';

export default function Home() {
  const { user, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--color-background)">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-(--color-primary-button)"></div>
          <p className="mt-4 text-(--color-inactive)">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-(--color-background)">
      {/* Booking Tabs Section */}
      <section className="bg-(--color-background) pt-24 pb-12 md:pt-28 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BookingTabs />
        </div>
      </section>

      {/* User Dashboard Section (for authenticated users) */}
      {user && (
        <section className="bg-(--color-background) py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-(--color-peace) p-6 sm:p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-(--color-foreground) mb-6">
                Your Account
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-(--color-inactive) mb-1">Name</p>
                  <p className="text-lg font-semibold text-(--color-foreground)">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-(--color-inactive) mb-1">Email</p>
                  <p className="text-lg font-semibold text-(--color-foreground)">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-(--color-inactive) mb-1">Login Method</p>
                  <p className="text-lg font-semibold text-(--color-foreground) capitalize">{user.provider}</p>
                </div>
                <div>
                  <p className="text-sm text-(--color-inactive) mb-1">Email Status</p>
                  <p className="text-lg font-semibold">
                    {user.emailVerified ? (
                      <span className="text-(--color-success)">Verified</span>
                    ) : (
                      <span className="text-(--color-warn)">Not Verified</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-(--color-danger) text-(--color-peace) px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Logout
              </button>
            </div>
          </div>
        </section>
      )}

    </main>
  );
}
