'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { api } from '@/lib/api';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Logo from '@/components/Logo';
import BackgroundVideo from '@/components/BackgroundVideo';
import FormInput from '@/components/FormInput';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuth();

  const registered = searchParams.get('registered') === 'true';
  const emailParam = searchParams.get('email');

  const [userEmail, setUserEmail] = useState<string>(emailParam || '');
  const [showVerificationMessage, setShowVerificationMessage] = useState(registered);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Clear errors when component unmounts or user starts typing
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!userEmail) return;

    setResendingEmail(true);
    setResendSuccess(false);
    setResendError('');

    try {
      await api.resendVerification(userEmail);
      setResendSuccess(true);
      setResendError('');
    } catch (err: any) {
      setResendError(err.message || 'Failed to resend verification email');
      setResendSuccess(false);
    } finally {
      setResendingEmail(false);
    }
  };

  // Form submission handler
  const onSubmit = async (data: LoginFormData) => {
    try {
      setUserEmail(data.email);
      await login(data);
      // Navigation is handled by AuthContext
    } catch (err: any) {
      // Check if error is about unverified email
      if (err?.message?.includes('verify your email')) {
        setShowVerificationMessage(true);
        setUserEmail(data.email);
      }
      // Error is handled by AuthContext and displayed in the UI
    }
  };

  return (
    <div className="h-screen max-h-screen flex bg-(--color-peace)">
      {/* Left side - Login Form */}
      <div className="flex-2 flex items-center justify-center px-4 py-6 lg:px-8 relative bg-(--color-background) overflow-y-auto">
        {/* Logo */}
        <Logo />

        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-6">
            <p className="text-3xl font-bold tracking-tight font-[sans-serif] text-(--color-foreground)">
              Welcome Back!
            </p>
            <p className="mt-2 text-sm text-(--color-foreground)">
              Let's get you signed in securely.
            </p>
          </div>

          {/* Form Container */}
          <div className="space-y-3.5">
            {/* Google Login Button */}
            <GoogleSignInButton disabled={isLoading || isSubmitting} />

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-(--color-tertiary-button)" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-(--color-background) text-(--color-foreground) font-medium">Or</span>
              </div>
            </div>

            {/* Registration Success & Verification Message */}
            {showVerificationMessage && userEmail && (
              <div className="bg-(--color-links) bg-opacity-10 border border-(--color-links) rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-(--color-links)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-semibold text-(--color-foreground)">
                      {registered ? 'Registration Successful!' : 'Email Verification Required'}
                    </h3>
                    <div className="mt-2 text-sm text-(--color-foreground)">
                      <p>
                        We've sent a verification email to <strong>{userEmail}</strong>.
                        Please check your inbox and click the verification link before logging in.
                      </p>
                    </div>

                    {/* Resend Success Message */}
                    {resendSuccess && (
                      <div className="mt-3 text-sm text-(--color-success) font-medium">
                        ✓ Verification email resent successfully!
                      </div>
                    )}

                    {/* Resend Error Message */}
                    {resendError && (
                      <div className="mt-3 text-sm text-(--color-danger)">
                        {resendError}
                      </div>
                    )}

                    {/* Resend Button */}
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendingEmail}
                        className="text-sm font-medium text-(--color-links) hover:opacity-80 underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resendingEmail ? 'Sending...' : 'Resend verification email'}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVerificationMessage(false)}
                    className="ml-3 flex-shrink-0 text-(--color-links) hover:opacity-80"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Global Error Message from API */}
            {error && !error.includes('verify your email') && (
              <div className="bg-(--color-danger) text-(--color-peace) px-4 py-3 rounded-lg text-sm border border-(--color-danger)">
                {error}
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              {/* Email Field */}
              <FormInput
                id="email"
                label="Email"
                type="email"
                placeholder="Enter Your Email Address"
                autoComplete="email"
                register={register('email')}
                error={errors.email?.message}
                disabled={isLoading || isSubmitting}
              />

              {/* Password Field */}
              <div>
                <FormInput
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="Your Password"
                  autoComplete="current-password"
                  register={register('password')}
                  error={errors.password?.message}
                  disabled={isLoading || isSubmitting}
                />
                <div className="mt-1.5 text-right">
                  <Link href="/forgot-password" className="text-xs text-(--color-links) hover:opacity-80 font-medium transition-colors duration-200">
                    Forgot Your Password?
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold mt-4 disabled:cursor-not-allowed bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button) disabled:bg-(--color-inactive)"
              >
                {isLoading || isSubmitting ? 'Signing in...' : 'Log in with Email'}
              </button>
            </form>

            {/* Register Link */}
            <div className="text-center pt-2">
              <p className="text-sm text-(--color-foreground)">
                Still don't have an account?{' '}
                <Link href="/register" className="text-(--color-links) hover:opacity-80 font-semibold transition-colors duration-200">
                  Register Now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Video Background */}
      <div className="hidden lg:flex lg:flex-3 relative overflow-hidden">
        <BackgroundVideo src="/login_video.mp4" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-(--color-background) text-(--color-foreground)">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
