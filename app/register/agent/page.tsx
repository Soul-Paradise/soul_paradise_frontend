'use client';
import { videoUrl } from '@/lib/assets';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import AuthLayout, { AuthDivider, AuthFooterLink } from '@/components/AuthLayout';
import FormInput from '@/components/FormInput';
import FileUpload from '@/components/FileUpload';
import AccountTypeLink from '@/components/AccountTypeLink';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { showToast } from '@/lib/toast';
import { registerAgent, verifyAgentGoogle } from '@/lib/agents-api';
import {
  agentAccountSchema,
  agentAgencySchema,
  agentKycSchema,
  type AgentAccountData,
  type AgentAgencyData,
  type AgentKycData,
} from '@/lib/validations/agent';

type Step = 1 | 2 | 3;

/**
 * B2B registration.
 *
 * Split across three steps deliberately: this form asks for ~14 fields plus three
 * document scans, and presenting that as one wall would tank completion. Each
 * step validates on its own schema, so a mistake on step 1 surfaces immediately
 * rather than after the user has photographed their Aadhaar card.
 *
 * On success the agent's account is active immediately (a password signup must
 * confirm its email first), so the flow ends on a confirmation screen that points
 * them at sign-in rather than redirecting straight into a session they don't have.
 */
export default function AgentRegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Whether the applicant still has to click an email link before they can log in.
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

  const [account, setAccount] = useState<AgentAccountData | null>(null);
  const [agency, setAgency] = useState<AgentAgencyData | null>(null);

  /**
   * Set when the applicant used "Continue with Google" instead of the form.
   *
   * We hold the raw credential and resend it at submit, where the backend
   * re-verifies it - the email shown here is for display only and is never what
   * the account is created from.
   */
  const [google, setGoogle] = useState<{
    idToken: string;
    email: string;
    name: string;
  } | null>(null);

  const accountForm = useForm<AgentAccountData>({
    resolver: zodResolver(agentAccountSchema),
    mode: 'onBlur',
    defaultValues: account ?? undefined,
  });

  const agencyForm = useForm<AgentAgencyData>({
    resolver: zodResolver(agentAgencySchema),
    mode: 'onBlur',
    defaultValues: agency ?? undefined,
  });

  const kycForm = useForm<AgentKycData>({
    resolver: zodResolver(agentKycSchema),
    mode: 'onBlur',
  });

  const onSubmitKyc = async (kyc: AgentKycData) => {
    // Step 3 is only reachable once step 1 produced an identity - either the form
    // or Google - and step 2 validated. Narrow rather than assert.
    if ((!account && !google) || !agency) {
      setStep(1);
      return;
    }

    setSubmitting(true);

    try {
      const result = await registerAgent({
        // Exactly one of these two identity shapes goes up. With Google we send
        // only the credential: the backend derives email and name from the
        // verified token, so there is nothing here for a client to spoof.
        ...(google
          ? { googleIdToken: google.idToken }
          : {
              name: account!.name,
              email: account!.email,
              password: account!.password,
            }),

        agencyName: agency.agencyName,
        contactPhone: agency.contactPhone,
        addressLine1: agency.addressLine1,
        addressLine2: agency.addressLine2 || undefined,
        city: agency.city,
        state: agency.state,
        pincode: agency.pincode,
        gstNumber: agency.gstNumber || undefined,

        panNumber: kyc.panNumber,
        aadhaarNumber: kyc.aadhaarNumber.replace(/[\s-]/g, ''),
        panCard: kyc.panCard,
        aadhaarFront: kyc.aadhaarFront,
        aadhaarBack: kyc.aadhaarBack,
        gstCertificate: kyc.gstCertificate,
      });

      // Google signups are verified already; password signups get an email link.
      setNeedsEmailVerification(Boolean(result.emailVerificationRequired));
      setSubmitted(true);
    } catch (error: any) {
      // A Google credential is short-lived, and photographing documents takes
      // time. If it lapsed, send them back to step 1 to re-authenticate rather
      // than leaving them stuck on a submit button that cannot succeed.
      if (/google sign-in has expired/i.test(error.message ?? '')) {
        setGoogle(null);
        setStep(1);
      }

      showToast({
        title: 'Could not submit application',
        body: error.message || 'Please try again.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    try {
      const identity = await verifyAgentGoogle(credential);
      setGoogle({ idToken: credential, ...identity });
    } catch (error: any) {
      showToast({
        title: 'Google sign-in failed',
        body: error.message || 'Please try again.',
        type: 'error',
      });
    }
  };

  if (submitted) {
    return (
      <ApplicationSubmitted
        email={google?.email ?? account?.email ?? ''}
        needsEmailVerification={needsEmailVerification}
      />
    );
  }

  return (
    <AuthLayout
      video={videoUrl('agent_registration_video.mp4')}
      title="Become a Booking Partner"
      subtitle="Register your agency and book on behalf of your clients."
      footer={
        <>
          <AuthFooterLink question="Already have an account?" href="/login" action="Sign in" />
          {/* Only on step 1. Past that the applicant has entered data that
              navigating away would silently discard. */}
          {step === 1 && <AccountTypeLink current="agent" />}
        </>
      }
    >
      {/* Google identity, once proven. Note this does NOT log them in - an
          agent gets no session until an admin approves their KYC. */}
      {step === 1 && google && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-(--color-primary-button) bg-(--color-primary-button)/5">
            <span className="min-w-0">
              <span className="block text-xs text-(--color-foreground) opacity-70">
                Continuing as
              </span>
              <span className="block text-sm font-semibold truncate text-(--color-foreground)">
                {google.name}
              </span>
              <span className="block text-xs truncate text-(--color-foreground) opacity-70">
                {google.email}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setGoogle(null)}
              className="text-xs font-semibold shrink-0 px-2 py-1 rounded text-(--color-links) hover:opacity-80"
            >
              Change
            </button>
          </div>

          <p className="text-xs text-(--color-foreground) opacity-70">
            No password needed - you&apos;ll sign in with Google once your agency
            is approved.
          </p>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold transition-all duration-200 mt-2 bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button)"
          >
            Continue
          </button>
        </div>
      )}

      {step === 1 && !google && (
        <div className="space-y-3.5 mb-3.5">
          <GoogleSignInButton
            disabled={submitting}
            onCredential={handleGoogleCredential}
          />

          <AuthDivider />
        </div>
      )}

      {step === 1 && !google && (
        <form
          onSubmit={accountForm.handleSubmit((data) => {
            setAccount(data);
            setStep(2);
          })}
          className="space-y-3.5"
        >
          <FormInput
            id="name"
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            register={accountForm.register('name')}
            error={accountForm.formState.errors.name?.message}
          />
          <FormInput
            id="email"
            label="Work Email"
            type="email"
            placeholder="you@youragency.com"
            autoComplete="email"
            register={accountForm.register('email')}
            error={accountForm.formState.errors.email?.message}
          />
          {/* Side by side so the step fits short laptop screens without scrolling */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                id="password"
                label="Password"
                type="password"
                placeholder="Create password"
                autoComplete="new-password"
                register={accountForm.register('password')}
                error={accountForm.formState.errors.password?.message}
              />
              <FormInput
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Re-enter"
                autoComplete="new-password"
                register={accountForm.register('confirmPassword')}
                error={accountForm.formState.errors.confirmPassword?.message}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Min 8 chars, uppercase, lowercase, number/special character</p>
          </div>

          <PrimaryButton>Continue</PrimaryButton>
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={agencyForm.handleSubmit((data) => {
            setAgency(data);
            setStep(3);
          })}
          className="space-y-3.5"
        >
          <FormInput
            id="agencyName"
            label="Agency Name"
            type="text"
            placeholder="Registered name of your agency"
            register={agencyForm.register('agencyName')}
            error={agencyForm.formState.errors.agencyName?.message}
          />
          <FormInput
            id="contactPhone"
            label="Contact Number"
            type="tel"
            placeholder="10-digit mobile number"
            autoComplete="tel"
            register={agencyForm.register('contactPhone')}
            error={agencyForm.formState.errors.contactPhone?.message}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              id="addressLine1"
              label="Address"
              type="text"
              placeholder="Street address"
              register={agencyForm.register('addressLine1')}
              error={agencyForm.formState.errors.addressLine1?.message}
            />
            <FormInput
              id="addressLine2"
              label="Line 2 (optional)"
              type="text"
              placeholder="Area, landmark"
              register={agencyForm.register('addressLine2')}
              error={agencyForm.formState.errors.addressLine2?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              id="city"
              label="City"
              type="text"
              placeholder="City"
              register={agencyForm.register('city')}
              error={agencyForm.formState.errors.city?.message}
            />
            <FormInput
              id="state"
              label="State"
              type="text"
              placeholder="State"
              register={agencyForm.register('state')}
              error={agencyForm.formState.errors.state?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              id="pincode"
              label="Pincode"
              type="text"
              placeholder="6-digit pincode"
              register={agencyForm.register('pincode')}
              error={agencyForm.formState.errors.pincode?.message}
            />
            <FormInput
              id="gstNumber"
              label="GSTIN (optional)"
              type="text"
              placeholder="15-character GSTIN"
              register={agencyForm.register('gstNumber')}
              error={agencyForm.formState.errors.gstNumber?.message}
            />
          </div>

          <StepNav onBack={() => setStep(1)} nextLabel="Continue" />
        </form>
      )}

      {step === 3 && (
        // Two-column grid with compact drop zones, so the whole step fits on
        // a laptop screen without the form panel scrolling.
        <form
          onSubmit={kycForm.handleSubmit(onSubmitKyc)}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              id="panNumber"
              label="PAN Number"
              type="text"
              placeholder="ABCDE1234F"
              register={kycForm.register('panNumber')}
              error={kycForm.formState.errors.panNumber?.message}
            />
            <FormInput
              id="aadhaarNumber"
              label="Aadhaar Number"
              type="text"
              placeholder="12-digit number"
              register={kycForm.register('aadhaarNumber')}
              error={kycForm.formState.errors.aadhaarNumber?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FileUpload
              id="aadhaarFront"
              label="Aadhaar - Front"
              required
              compact
              value={kycForm.watch('aadhaarFront')}
              onChange={(file) =>
                kycForm.setValue('aadhaarFront', file as File, {
                  shouldValidate: true,
                })
              }
              error={kycForm.formState.errors.aadhaarFront?.message}
            />
            <FileUpload
              id="aadhaarBack"
              label="Aadhaar - Back"
              required
              compact
              value={kycForm.watch('aadhaarBack')}
              onChange={(file) =>
                kycForm.setValue('aadhaarBack', file as File, {
                  shouldValidate: true,
                })
              }
              error={kycForm.formState.errors.aadhaarBack?.message}
            />
            <FileUpload
              id="panCard"
              label="PAN Card"
              required
              compact
              value={kycForm.watch('panCard')}
              onChange={(file) =>
                kycForm.setValue('panCard', file as File, {
                  shouldValidate: true,
                })
              }
              error={kycForm.formState.errors.panCard?.message}
            />
            <FileUpload
              id="gstCertificate"
              label="GST Certificate (optional)"
              compact
              value={kycForm.watch('gstCertificate')}
              onChange={(file) =>
                kycForm.setValue('gstCertificate', file, {
                  shouldValidate: true,
                })
              }
              error={kycForm.formState.errors.gstCertificate?.message}
            />
          </div>

          <p className="text-xs leading-relaxed text-(--color-foreground) opacity-70">
            A GST certificate speeds up verification. Your documents are
            encrypted, used solely to verify your agency, and visible only to
            our verification team.
          </p>

          <StepNav
            onBack={() => setStep(2)}
            nextLabel={submitting ? 'Submitting…' : 'Submit Application'}
            disabled={submitting}
          />
        </form>
      )}
    </AuthLayout>
  );
}

function PrimaryButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold transition-all duration-200 mt-2 disabled:cursor-not-allowed bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button) disabled:bg-(--color-inactive)"
    >
      {children}
    </button>
  );
}

function StepNav({
  onBack,
  nextLabel,
  disabled,
}: {
  onBack: () => void;
  nextLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-3 mt-2">
      <button
        type="button"
        onClick={onBack}
        disabled={disabled}
        className="px-5 py-2.5 rounded-lg border text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed border-(--color-tertiary-button) text-(--color-foreground) hover:bg-(--color-tertiary-button)/20"
      >
        Back
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="flex-1 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button) disabled:bg-(--color-inactive)"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function ApplicationSubmitted({
  email,
  needsEmailVerification,
}: {
  email: string;
  needsEmailVerification: boolean;
}) {
  return (
    <AuthLayout
      video={videoUrl('agent_registration_video.mp4')}
      title="Application submitted"
      subtitle="Thank you for registering your agency with Soul Paradise."
    >
      <div className="text-center">
        <div className="mx-auto mb-6 flex items-center justify-center w-14 h-14 rounded-full bg-(--color-primary-button)/10">
          <svg
            className="w-7 h-7 text-(--color-primary-button)"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-(--color-foreground)">
          {needsEmailVerification
            ? 'Almost there - verify your email'
            : 'Your account is ready'}
        </h1>

        {needsEmailVerification ? (
          <p className="mt-3 text-sm leading-relaxed text-(--color-foreground)">
            Your booking-partner account has been created. We&apos;ve sent a
            verification link to {email ? <strong>{email}</strong> : 'your inbox'}.
            Click it to confirm your email, then sign in and start booking.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-(--color-foreground)">
            Your booking-partner account is ready. You can sign in and start booking
            on behalf of your customers right away.
          </p>
        )}

        <Link
          href="/login"
          className="inline-block mt-8 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button)"
        >
          Go to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
