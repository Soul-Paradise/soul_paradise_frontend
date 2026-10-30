'use client';
import { videoUrl } from '@/lib/assets';

import { useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { forgetLastLogin, useLastLogin } from '@/lib/last-login';
import { showToast } from '@/lib/toast';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import AuthLayout, { AuthDivider, AuthFooterLink } from '@/components/AuthLayout';
import FormInput from '@/components/FormInput';

/** "Last used" tag pinned to the top-right corner of a sign-in option. */
function LastUsedBadge() {
  return (
    <span className="pointer-events-none absolute -top-2.5 right-3 z-10 rounded-full border border-(--color-links)/20 bg-(--color-primary-tint) px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-(--color-links) shadow-sm">
      Last used
    </span>
  );
}

function LoginForm() {
  const { login, isLoading, clearError } = useAuth();
  const lastLogin = useLastLogin();
  const prefilled = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Pre-fill once from the last email sign-in; later typing is the user's.
  useEffect(() => {
    if (prefilled.current || lastLogin?.method !== 'email' || !lastLogin.email) return;
    prefilled.current = true;
    setValue('email', lastLogin.email);
    setFocus('password');
  }, [lastLogin, setValue, setFocus]);

  // Clear errors when component unmounts or user starts typing
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const notYou = () => {
    forgetLastLogin();
    setValue('email', '');
    setFocus('email');
  };

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
    } catch (err) {
      showToast({
        title: 'Login Failed',
        body: (err instanceof Error && err.message) || 'Invalid credentials. Please try again.',
        type: 'error'
      });
    }
  };

  const lastEmail = lastLogin?.method === 'email' ? lastLogin.email : undefined;

  return (
    <AuthLayout
      video={videoUrl('login_video.mp4')}
      title="Welcome Back!"
      subtitle="Let's get you signed in securely."
      footer={<AuthFooterLink question="Still don't have an account?" href="/register" action="Register Now" />}
    >
      <div className="space-y-3.5">
        {/* Google Login Button */}
        <div className="relative">
          {lastLogin?.method === 'google' && <LastUsedBadge />}
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
        </div>

        <AuthDivider />

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
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
            {lastEmail && (
              <p className="mt-1.5 text-xs text-(--color-inactive)">
                Signing in as <span className="font-semibold text-(--color-foreground)">{lastEmail}</span>.{' '}
                {/* preventDefault on mousedown keeps focus in the password box:
                    blurring it would validate, show an error, re-centre the
                    card and move this link out from under the pointer. */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={notYou}
                  className="font-medium text-(--color-links) hover:opacity-80"
                >
                  Not you?
                </button>
              </p>
            )}
          </div>

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

          <div className="relative mt-4">
            {lastLogin?.method === 'email' && <LastUsedBadge />}
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold disabled:cursor-not-allowed bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button) disabled:bg-(--color-inactive)"
            >
              {isLoading || isSubmitting ? 'Signing in...' : 'Log in with Email'}
            </button>
          </div>
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
