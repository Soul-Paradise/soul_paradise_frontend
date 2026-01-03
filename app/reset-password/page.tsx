'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import Logo from '@/components/Logo';
import BackgroundVideo from '@/components/BackgroundVideo';
import FormInput from '@/components/FormInput';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isSubmitting, setIsSubmitting] = useState(false);

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
      showToast({
        title: 'Invalid Reset Link',
        body: 'The password reset link is invalid or has expired.',
        type: 'error'
      });
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      showToast({
        title: 'Invalid Reset Link',
        body: 'The password reset link is invalid or has expired.',
        type: 'error'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await api.resetPassword(token, data.password);

      showToast({
        title: 'Password Reset Successfully!',
        body: 'Your password has been reset. Redirecting to login...',
        type: 'success'
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      showToast({
        title: 'Reset Failed',
        body: err.message || 'Failed to reset password. Please try again.',
        type: 'error'
      });
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
            {token && (
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
