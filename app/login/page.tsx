'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { showToast } from '@/lib/toast';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import AuthLayout, { AuthDivider, AuthFooterLink } from '@/components/AuthLayout';
import FormInput from '@/components/FormInput';

function LoginForm() {
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
    <AuthLayout
      video="/login_video.mp4"
      title="Welcome Back!"
      subtitle="Let's get you signed in securely."
      footer={<AuthFooterLink question="Still don't have an account?" href="/register" action="Register Now" />}
    >
      <div className="space-y-3.5">
        {/* Google Login Button */}
        <GoogleSignInButton
          disabled={isLoading || isSubmitting}
          onError={(message) =>
            showToast({
              title: 'Login Failed',
              body: message || 'Could not sign in with Google. Please try again.',
              type: 'error',
            })
          }
        />

        <AuthDivider />

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
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

          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold mt-4 disabled:cursor-not-allowed bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button) disabled:bg-(--color-inactive)"
          >
            {isLoading || isSubmitting ? 'Signing in...' : 'Log in with Email'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-(--color-background) text-(--color-foreground)">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
