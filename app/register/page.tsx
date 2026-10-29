'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { showToast } from '@/lib/toast';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import AuthLayout, { AuthDivider, AuthFooterLink } from '@/components/AuthLayout';
import FormInput from '@/components/FormInput';
import AccountTypeLink from '@/components/AccountTypeLink';

export default function SignupPage() {
  const { register: registerUser, isLoading, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Clear errors when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Form submission handler
  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Extract only the fields needed for API (exclude confirmPassword)
      const { name, email, password } = data;
      await registerUser({ name, email, password });
      showToast({
        title: 'Registration Successful!',
        body: 'Please check your email to verify your account.',
        type: 'success'
      });
      // Navigation is handled by AuthContext
    } catch (err: any) {
      showToast({
        title: 'Registration Failed',
        body: err.message || 'Unable to create account. Please try again.',
        type: 'error'
      });
    }
  };

  return (
    <AuthLayout
      video="/register_video.mp4"
      title="Create Account"
      subtitle="Join Soul Paradise Travels today!"
      footer={
        <>
          <AuthFooterLink question="Already have an account?" href="/login" action="Sign in" />
          {/* B2B cross-link. Agents register on a separate page because they
              submit KYC documents. */}
          <AccountTypeLink current="customer" />
        </>
      }
    >
      <div className="space-y-3.5">
        <GoogleSignInButton disabled={isLoading || isSubmitting} />

        <AuthDivider />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <FormInput
            id="name"
            label="Full Name"
            type="text"
            placeholder="Enter Your Full Name"
            autoComplete="name"
            register={register('name')}
            error={errors.name?.message}
            disabled={isLoading || isSubmitting}
          />

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

          {/* Side by side so the form fits short laptop screens without scrolling */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                id="password"
                label="Password"
                type="password"
                placeholder="Create password"
                autoComplete="new-password"
                register={register('password')}
                error={errors.password?.message}
                disabled={isLoading || isSubmitting}
              />
              <FormInput
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Re-enter"
                autoComplete="new-password"
                register={register('confirmPassword')}
                error={errors.confirmPassword?.message}
                disabled={isLoading || isSubmitting}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Min 8 chars, uppercase, lowercase, number/special character</p>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              required
              disabled={isLoading || isSubmitting}
              className="h-3.5 w-3.5 mt-0.5 border border-(--color-tertiary-button) rounded disabled:cursor-not-allowed accent-(--color-primary-button)"
            />
            <label htmlFor="terms" className="ml-2 block text-xs text-(--color-foreground)">
              I agree to the{' '}
              <Link
                href="/terms"
                className="font-medium transition-colors duration-200 text-(--color-links) hover:opacity-80"
              >
                Terms and Conditions
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold transition-all duration-200 mt-4 disabled:cursor-not-allowed bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button) disabled:bg-(--color-inactive)"
          >
            {isLoading || isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
