'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import Logo from '@/components/Logo';
import BackgroundVideo from '@/components/BackgroundVideo';
import FormInput from '@/components/FormInput';

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);

      await api.forgotPassword(data.email);

      showToast({
        title: 'Check Your Email',
        body: `If an account exists for ${data.email}, you will receive password reset instructions shortly.`,
        type: 'success'
      });

      reset();
    } catch (err: any) {
      showToast({
        title: 'Failed to Send Email',
        body: err.message || 'Could not send reset email. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen max-h-screen flex bg-(--color-peace)">
      {/* Left side - Forgot Password Form */}
      <div className="flex-2 flex items-center justify-center px-4 py-6 lg:px-8 relative bg-(--color-background) overflow-y-auto">
        {/* Logo */}
        <Logo />

        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-6">
            <p className="text-3xl font-bold text-(--color-foreground) tracking-tight">
              Forgot Password?
            </p>
            <p className="text-(--color-foreground) mt-2 text-sm">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          {/* Form Container */}
          <div className="space-y-3.5">
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
                  disabled={isSubmitting}
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold transition-all duration-200 mt-4 disabled:cursor-not-allowed bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button) disabled:bg-(--color-inactive)"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

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
