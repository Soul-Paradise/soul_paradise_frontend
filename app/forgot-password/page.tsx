'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import AuthLayout, { AuthFooterLink } from '@/components/AuthLayout';
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
    <AuthLayout
      video="/login_video.mp4"
      title="Forgot Password?"
      subtitle="No worries, we'll send you reset instructions."
      footer={<AuthFooterLink question="Remembered your password?" href="/login" action="Back to Login" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold transition-all duration-200 mt-4 disabled:cursor-not-allowed bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button) disabled:bg-(--color-inactive)"
        >
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </AuthLayout>
  );
}
