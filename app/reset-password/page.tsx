'use client';
import { videoUrl } from '@/lib/assets';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import AuthLayout, { AuthFooterLink } from '@/components/AuthLayout';
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
    <AuthLayout
      video={videoUrl('login_video.mp4')}
      title="Set New Password"
      subtitle="Your new password must be different from previously used passwords."
      footer={<AuthFooterLink question="Remembered your password?" href="/login" action="Back to Login" />}
    >
      {token ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <FormInput
            id="password"
            label="New Password"
            type="password"
            placeholder="Enter Your New Password"
            autoComplete="new-password"
            register={register('password')}
            error={errors.password?.message}
            disabled={isSubmitting}
            helperText="Min 8 chars, uppercase, lowercase, number/special character"
          />

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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold transition-all duration-200 mt-4 disabled:cursor-not-allowed bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button) disabled:bg-(--color-inactive)"
          >
            {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      ) : (
        // Without a token there is nothing to submit: explain and offer a fresh link.
        <div className="rounded-xl border border-(--color-danger)/30 bg-(--color-danger)/5 p-4">
          <p className="text-sm font-semibold text-(--color-danger)">This reset link is invalid or has expired.</p>
          <p className="mt-1 text-sm text-(--color-inactive)">
            Reset links work once and expire after an hour. Request a new one to continue.
          </p>
          <Link
            href="/forgot-password"
            className="mt-4 flex w-full justify-center rounded-lg bg-(--color-primary-button) px-4 py-2.5 text-sm font-semibold text-(--color-peace) shadow-sm transition-all duration-200 hover:bg-(--color-secondary-button)"
          >
            Request a new link
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-(--color-background) text-(--color-foreground)">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
