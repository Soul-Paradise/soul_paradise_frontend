'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';
import BackgroundVideo from '@/components/BackgroundVideo';
import FormInput from '@/components/FormInput';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess(false);

      await api.resetPassword(token, data.password);

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen max-h-screen flex bg-(--color-peace)">
      {/* Left side - Reset Password Form */}
      <div className="flex-2 flex items-center justify-center px-4 py-6 lg:px-8 relative bg-(--color-background) overflow-y-auto">
        {/* Logo */}
        <Logo />

        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-6">
            <p className="text-3xl font-bold text-(--color-foreground) tracking-tight">
              Set New Password
            </p>
            <p className="text-(--color-foreground) mt-2 text-sm">
              Your new password must be different from previously used passwords.
            </p>
          </div>

          {/* Form Container */}
          <div className="space-y-3.5">
            {/* Success Message */}
            {success && (
              <div className="bg-(--color-success) bg-opacity-10 border border-(--color-success) rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-(--color-success)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-semibold text-(--color-foreground)">
                      Password Reset Successfully!
                    </h3>
                    <div className="mt-2 text-sm text-(--color-foreground)">
                      <p>
                        Your password has been reset. Redirecting you to login...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-(--color-danger) border border-(--color-danger) text-(--color-peace) px-4 py-3 rounded-lg text-sm">
                {error}
                {error.includes('token') && (
                  <div className="mt-2">
                    <Link href="/forgot-password" className="underline font-semibold">
                      Request a new reset link
                    </Link>
                  </div>
                )}
              </div>
            )}

            {!success && token && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                {/* Password Field */}
                <FormInput
                  id="password"
                  label="New Password"
                  type="password"
                  placeholder="Enter Your New Password"
                  autoComplete="new-password"
                  register={register('password')}
                  error={errors.password?.message}
                  disabled={isSubmitting}
                />

                {/* Confirm Password Field */}
                <FormInput
                  id="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm Your New Password"
                  autoComplete="new-password"
                  register={register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  disabled={isSubmitting}
                />

                {/* Password Requirements */}
                <div className="bg-(--color-links) bg-opacity-10 border border-(--color-links) rounded-lg p-3 text-xs text-(--color-foreground)">
                  <p className="font-semibold mb-1">Password must contain:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number or special character</li>
                  </ul>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold transition-all duration-200 mt-4 disabled:cursor-not-allowed bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button) disabled:bg-(--color-inactive)"
                >
                  {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>
            )}

            {/* Back to Login Link */}
            <div className="text-center pt-2">
              <Link href="/login" className="text-sm text-(--color-links) hover:opacity-80 font-semibold transition-colors duration-200 flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Login
              </Link>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-(--color-background) text-(--color-foreground)">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
