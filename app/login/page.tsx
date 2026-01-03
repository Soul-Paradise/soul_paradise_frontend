'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { showToast } from '@/lib/toast';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Logo from '@/components/Logo';
import BackgroundVideo from '@/components/BackgroundVideo';
import FormInput from '@/components/FormInput';

function LoginForm() {
  const router = useRouter();
  const { login, isLoading, clearError } = useAuth();

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

  // Form submission handler
  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      showToast({
        title: 'Login Successful!',
        body: 'Welcome back. Redirecting you now...',
        type: 'success'
      });
      // Navigation is handled by AuthContext
    } catch (err: any) {
      showToast({
        title: 'Login Failed',
        body: err.message || 'Invalid credentials. Please try again.',
        type: 'error'
      });
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
