'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { showToast } from '@/lib/toast';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Logo from '@/components/Logo';
import BackgroundVideo from '@/components/BackgroundVideo';
import FormInput from '@/components/FormInput';

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
    <div className="h-screen max-h-screen flex bg-(--color-peace)">
      {/* Left side - Video Background */}
      <div className="hidden lg:flex lg:flex-3 relative overflow-hidden">
        {/* Logo */}
        <Logo />
        <BackgroundVideo src="/register_video.mp4" />
      </div>

      {/* Right side - Register Form */}
      <div className="flex-2 flex items-center justify-center px-4 py-6 lg:px-8 relative overflow-y-auto bg-(--color-background)">
        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-6">
            <p className="text-3xl font-bold tracking-tight font-[sans-serif] text-(--color-foreground)">
              Create Account
            </p>
            <p className="mt-2 text-sm text-(--color-foreground)">
              Join Soul Paradise Travels today!
            </p>
          </div>

          {/* Form Container */}
          <div className="space-y-3.5">
            {/* Google Register Button */}
            <GoogleSignInButton disabled={isLoading || isSubmitting} />

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-(--color-tertiary-button)" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 font-medium bg-(--color-background) text-(--color-foreground)">Or</span>
              </div>
            </div>

            {/* Register Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              {/* Full Name Field */}
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
              <FormInput
                id="password"
                label="Password"
                type="password"
                placeholder="Create Your Password"
                autoComplete="new-password"
                register={register('password')}
                error={errors.password?.message}
                disabled={isLoading || isSubmitting}
                helperText="Min 8 chars, uppercase, lowercase, number/special character"
              />

              {/* Confirm Password Field */}
              <FormInput
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Confirm Your Password"
                autoComplete="new-password"
                register={register('confirmPassword')}
                error={errors.confirmPassword?.message}
                disabled={isLoading || isSubmitting}
              />

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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold transition-all duration-200 mt-4 disabled:cursor-not-allowed bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button) disabled:bg-(--color-inactive)"
              >
                {isLoading || isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-2">
              <p className="text-sm text-(--color-foreground)">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold transition-colors duration-200 text-(--color-links) hover:opacity-80"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
