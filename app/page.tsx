'use client';

import { useAuth } from '@/contexts/AuthContext';

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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <main className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Soul Paradise Travels
        </h1>

        {user ? (
          // Authenticated user view
          <>
            <p className="text-xl text-gray-700 mb-8">
              Welcome, {user.name}!
            </p>
            <div className="space-y-4">
              <div className="bg-white  p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-2">User Information</h2>
                <div className="text-left space-y-2">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Provider:</strong> {user.provider}</p>
                  <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          // Unauthenticated user view
          <>
            <p className="text-xl text-gray-700  mb-8">
              Your journey begins here
            </p>
            <div className="space-x-4">
              <a
                href="/login"
                className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors"
              >
                Login
              </a>
              <a
                href="/register"
                className="inline-block bg-white text-black border-2 border-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Register
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
