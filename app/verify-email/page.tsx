'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Verification token is missing');
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Verification failed');
        }

        setStatus('success');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.message || 'An error occurred during verification');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="h-screen flex items-center justify-center bg-(--color-background)">
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 lg:top-6 lg:left-6 z-20">
        <Logo />
      </div>

      <div className="w-full max-w-md px-6">
        <div className="bg-(--color-peace) rounded-lg shadow-lg p-8">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-(--color-links)"></div>
              </div>
              <h1 className="text-2xl font-bold text-(--color-foreground) mb-2">
                Verifying Your Email
              </h1>
              <p className="text-(--color-foreground)">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-(--color-success) bg-opacity-20">
                  <svg
                    className="w-10 h-10 text-(--color-success)"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-(--color-foreground) mb-2">
                Email Verified Successfully!
              </h1>
              <p className="text-(--color-foreground) mb-6">
                Your email has been verified. You can now log in to your account.
              </p>
              <p className="text-sm text-(--color-foreground) opacity-70 mb-4">
                Redirecting to login page in 3 seconds...
              </p>
              <Link
                href="/login"
                className="inline-block bg-(--color-primary-button) text-(--color-peace) px-6 py-3 rounded-lg font-semibold hover:bg-(--color-secondary-button) transition-colors"
              >
                Go to Login Now
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-(--color-danger) bg-opacity-20">
                  <svg
                    className="w-10 h-10 text-(--color-danger)"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-(--color-foreground) mb-2">
                Verification Failed
              </h1>
              <p className="text-(--color-foreground) mb-6">
                {errorMessage || 'We couldn\'t verify your email address.'}
              </p>
              <div className="space-y-3">
                <Link
                  href="/verification-pending"
                  className="block bg-(--color-primary-button) text-(--color-peace) px-6 py-3 rounded-lg font-semibold hover:bg-(--color-secondary-button) transition-colors"
                >
                  Resend Verification Email
                </Link>
                <Link
                  href="/login"
                  className="block text-(--color-links) hover:opacity-80 transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-(--color-background) text-(--color-foreground)">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
