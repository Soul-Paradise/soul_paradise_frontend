'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';
import BackgroundVideo from '@/components/BackgroundVideo';
import FormInput from '@/components/FormInput';

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess(false);

      await api.forgotPassword(data.email);

      setSuccess(true);
      setSubmittedEmail(data.email);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
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
                      Check Your Email
                    </h3>
                    <div className="mt-2 text-sm text-(--color-foreground)">
                      <p>
                        If an account exists for <strong>{submittedEmail}</strong>, you will receive password reset instructions shortly.
                      </p>
                      <p className="mt-2">
                        Please check your inbox and spam folder.
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
              </div>
            )}

            {!success && (
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
