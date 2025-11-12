'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';

function VerificationPendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push('/register');
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, router]);

  const handleResend = async () => {
    if (!email || !canResend) return;

    setIsResending(true);
    setResendSuccess(false);
    setResendError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend verification email');
      }

      setResendSuccess(true);
      setCanResend(false);
      setCountdown(60);

      // Restart countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      setResendError(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 lg:top-6 lg:left-6 z-20">
        <Logo />
      </div>

      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            {/* Email Icon */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100">
                <svg
                  className="w-12 h-12 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h1>

            <p className="text-gray-600 mb-6">
              We've sent a verification link to:
            </p>

            <p className="text-lg font-semibold text-gray-900 mb-6 break-all">
              {email}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                Please check your email and click the verification link to activate your account.
                The link will expire in 24 hours.
              </p>
            </div>

            {/* Success Message */}
            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                Verification email resent successfully! Please check your inbox.
              </div>
            )}

            {/* Error Message */}
            {resendError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {resendError}
              </div>
            )}

            {/* Resend Button */}
            <div className="mb-6">
              <button
                onClick={handleResend}
                disabled={!canResend || isResending}
                className="w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isResending ? 'Sending...' : canResend ? 'Resend Verification Email' : `Resend in ${countdown}s`}
              </button>
            </div>

            {/* Help Text */}
            <div className="text-sm text-gray-600 space-y-2">
              <p>Didn't receive the email?</p>
              <ul className="list-disc list-inside text-left">
                <li>Check your spam or junk folder</li>
                <li>Make sure {email} is correct</li>
                <li>Wait a few minutes and try resending</li>
              </ul>
            </div>

            {/* Back to Login */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerificationPendingPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <VerificationPendingContent />
    </Suspense>
  );
}
