'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  ChevronRight,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Receipt,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { api, type AgentVerificationStatus, type UserProfile } from '@/lib/api';
import { useAuth, useRequireAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/toast';
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileFormData,
  type ChangePasswordFormData,
} from '@/lib/validations/auth';
import FormInput from '@/components/FormInput';
import { Avatar } from '@/components/Navbar/UserMenu';

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const ROLE_LABELS: Record<UserProfile['role'], string> = {
  USER: 'Customer',
  AGENT: 'Booking Partner',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};

const AGENT_STATUS: Record<AgentVerificationStatus, { label: string; cls: string }> = {
  APPROVED: { label: 'Approved', cls: 'bg-(--color-success)/15 text-(--color-success)' },
  PENDING: { label: 'Under review', cls: 'bg-(--color-warn)/15 text-(--color-warn)' },
  REJECTED: { label: 'Rejected', cls: 'bg-(--color-danger)/15 text-(--color-danger)' },
};

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button) disabled:bg-(--color-inactive)';

const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-(--color-tertiary-button) px-4 py-2.5 text-sm font-semibold text-(--color-foreground) transition hover:bg-(--color-background) disabled:cursor-not-allowed disabled:opacity-60';

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { checkAuth, logoutAll } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const fetchProfile = useCallback(
    () =>
      api.getProfile().then(
        (data) => ({ data, error: null }),
        (err) => ({
          data: null,
          error: err instanceof Error ? err.message : 'Could not load your profile.',
        })
      ),
    []
  );

  const loadProfile = useCallback(async () => {
    const { data, error } = await fetchProfile();
    if (data) setProfile(data);
    setLoadError(error);
  }, [fetchProfile]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetchProfile().then(({ data, error }) => {
      if (cancelled) return;
      if (data) setProfile(data);
      setLoadError(error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, fetchProfile]);

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    await logoutAll();
  };

  if (authLoading || !isAuthenticated || (!profile && !loadError)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-(--color-foreground)" />
      </div>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-(--color-background) px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md rounded-lg border border-(--color-tertiary-button) bg-(--color-peace) p-6 text-center shadow-sm">
          <p className="text-base font-semibold text-(--color-foreground)">
            We couldn&apos;t load your profile
          </p>
          <p className="mt-1 text-sm text-(--color-inactive)">{loadError}</p>
          <button
            onClick={() => {
              setLoadError(null);
              loadProfile();
            }}
            className={`${primaryButtonClass} mt-4`}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const isGoogle = profile.provider === 'GOOGLE';
  // An email/password user who later uses "Continue with Google" is switched to
  // provider=GOOGLE but keeps their password, which still works for email login.
  const signInMethods = isGoogle
    ? profile.hasPassword
      ? 'Google & password'
      : 'Google sign-in'
    : 'Email & password';

  return (
    <main className="min-h-screen bg-(--color-background) px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-(--color-foreground) sm:text-3xl">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-(--color-inactive)">
            Manage your account details and security settings.
          </p>
        </header>

        {/* Identity */}
        <section className="mb-6 rounded-lg border border-(--color-tertiary-button) bg-(--color-peace) p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar src={profile.profilePicture} name={profile.name} size="xl" />
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-1.5 text-xl font-bold text-(--color-foreground)">
                <span className="truncate">{profile.name}</span>
                {profile.emailVerified && (
                  <span title="Verified email" className="inline-flex shrink-0">
                    <BadgeCheck
                      className="h-5 w-5 fill-(--color-links) text-(--color-peace)"
                      aria-label="Verified email"
                      role="img"
                    />
                  </span>
                )}
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-(--color-inactive)">
                <Mail className="h-4 w-4 shrink-0" />
                {profile.email}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{ROLE_LABELS[profile.role] ?? profile.role}</Badge>
                <Badge>{signInMethods}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:text-right">
              <span className="text-(--color-inactive)">Member since</span>
              <span className="font-semibold text-(--color-foreground)">
                {formatDate(profile.createdAt)}
              </span>
              <span className="text-(--color-inactive)">Last sign-in</span>
              <span className="font-semibold text-(--color-foreground)">
                {formatDate(profile.lastLoginAt)}
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <PersonalDetailsCard
              profile={profile}
              onSaved={(updated) => {
                setProfile(updated);
                // Keep the navbar's name/initials in sync
                checkAuth();
              }}
            />

            {profile.agentProfile && <AgencyCard agency={profile.agentProfile} />}

            {profile.hasPassword ? (
              <ChangePasswordCard
                passwordChangedAt={profile.passwordChangedAt}
                linkedToGoogle={isGoogle}
                onChanged={loadProfile}
              />
            ) : (
              <Card
                icon={KeyRound}
                title="Password"
                subtitle="How you sign in"
              >
                <p className="text-sm text-(--color-inactive)">
                  You sign in with Google, so there is no Soul Paradise password on
                  this account. Manage your password and security from your Google
                  account.
                </p>
              </Card>
            )}
          </div>

          <aside className="space-y-6">
            <Card icon={Receipt} title="Quick links">
              <nav className="-mx-2 flex flex-col">
                <QuickLink href="/orders" label="My Orders" />
                <QuickLink href="/orders?tab=payments" label="Custom Payments" />
                <QuickLink href="/contact" label="Contact Support" />
              </nav>
            </Card>

            <Card icon={ShieldCheck} title="Sessions">
              <p className="text-sm text-(--color-inactive)">
                Signed in on a device you no longer use? Sign out everywhere,
                including this browser.
              </p>
              {confirmLogoutAll ? (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-(--color-foreground)">
                    Sign out of all devices?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleLogoutAll}
                      disabled={loggingOutAll}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-(--color-danger) px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {loggingOutAll && <Loader2 className="h-4 w-4 animate-spin" />}
                      Sign out
                    </button>
                    <button
                      onClick={() => setConfirmLogoutAll(false)}
                      disabled={loggingOutAll}
                      className={`${secondaryButtonClass} flex-1`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmLogoutAll(true)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-(--color-danger) px-4 py-2.5 text-sm font-semibold text-(--color-danger) transition hover:bg-(--color-danger) hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out of all devices
                </button>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

function PersonalDetailsCard({
  profile,
  onSaved,
}: {
  profile: UserProfile;
  onSaved: (profile: UserProfile) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: profile.name },
  });

  const cancel = () => {
    reset({ name: profile.name });
    setEditing(false);
  };

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      setSaving(true);
      const updated = await api.updateProfile({ name: data.name });
      reset({ name: updated.name });
      setEditing(false);
      onSaved(updated);
      showToast({ title: 'Profile updated', type: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not update profile',
        body: err instanceof Error ? err.message : 'Please try again.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      icon={UserIcon}
      title="Personal details"
      subtitle="Your name appears on bookings and emails"
      action={
        !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-(--color-links) hover:underline"
          >
            Edit
          </button>
        )
      }
    >
      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            id="name"
            label="Full name"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            register={register('name')}
            error={errors.name?.message}
            disabled={saving}
          />
          <ReadOnlyField
            label="Email address"
            value={profile.email}
            hint="Your email is your sign-in ID. Contact support to change it."
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={cancel} disabled={saving} className={secondaryButtonClass}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !isDirty} className={primaryButtonClass}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : (
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" value={profile.name} />
          <Field label="Email address" value={profile.email} />
        </dl>
      )}
    </Card>
  );
}

function ChangePasswordCard({
  passwordChangedAt,
  linkedToGoogle,
  onChanged,
}: {
  passwordChangedAt: string | null;
  linkedToGoogle: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur',
  });

  const close = () => {
    reset();
    setOpen(false);
  };

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setSaving(true);
      await api.changePassword(data.currentPassword, data.newPassword);
      close();
      onChanged();
      showToast({
        title: 'Password changed',
        body: 'Other devices have been signed out.',
        type: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      if (/current password/i.test(message)) {
        setError('currentPassword', { message });
      } else {
        showToast({ title: 'Could not change password', body: message, type: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      icon={KeyRound}
      title="Password"
      subtitle={
        passwordChangedAt
          ? `Last changed ${formatDateTime(passwordChangedAt)}`
          : 'Use a strong password you don’t use elsewhere'
      }
      action={
        !open && (
          <button
            onClick={() => setOpen(true)}
            className="text-sm font-semibold text-(--color-links) hover:underline"
          >
            Change
          </button>
        )
      }
    >
      {open ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            id="currentPassword"
            label="Current password"
            type="password"
            placeholder="Enter your current password"
            autoComplete="current-password"
            register={register('currentPassword')}
            error={errors.currentPassword?.message}
            disabled={saving}
          />
          <FormInput
            id="newPassword"
            label="New password"
            type="password"
            placeholder="Enter a new password"
            autoComplete="new-password"
            register={register('newPassword')}
            error={errors.newPassword?.message}
            disabled={saving}
            helperText="At least 8 characters, with upper and lower case letters and a number or symbol."
          />
          <FormInput
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            placeholder="Re-enter the new password"
            autoComplete="new-password"
            register={register('confirmPassword')}
            error={errors.confirmPassword?.message}
            disabled={saving}
          />
          <p className="text-xs text-(--color-inactive)">
            Changing your password signs you out on every other device.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} disabled={saving} className={secondaryButtonClass}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-(--color-inactive)">
          {linkedToGoogle
            ? 'Your account is linked to Google, but the password you registered with still signs you in with email. You’ll need it to set a new one.'
            : 'You’ll need your current password to set a new one.'}
        </p>
      )}
    </Card>
  );
}

function AgencyCard({ agency }: { agency: NonNullable<UserProfile['agentProfile']> }) {
  const status = AGENT_STATUS[agency.status];
  const address = [
    agency.addressLine1,
    agency.addressLine2,
    `${agency.city}, ${agency.state} ${agency.pincode}`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card
      icon={Briefcase}
      title="Agency details"
      subtitle="Verified during booking-partner onboarding"
      action={
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${status.cls}`}>
          {status.label}
        </span>
      }
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        <Field label="Agency name" value={agency.agencyName} />
        <Field label="Contact phone" value={agency.contactPhone} icon={Phone} />
        <Field label="GST number" value={agency.gstNumber || '-'} />
        <Field label="Approved on" value={formatDate(agency.reviewedAt)} icon={CalendarDays} />
        <div className="sm:col-span-2">
          <Field label="Business address" value={address} icon={MapPin} />
        </div>
      </dl>
      <p className="mt-4 text-xs text-(--color-inactive)">
        Need to update these details?{' '}
        <Link href="/contact" className="font-semibold text-(--color-links) hover:underline">
          Contact support
        </Link>
        .
      </p>
    </Card>
  );
}

function Card({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-(--color-tertiary-button) bg-(--color-peace) p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg bg-(--color-background) p-2 text-(--color-secondary-button)">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base font-bold text-(--color-foreground)">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-(--color-inactive)">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-(--color-inactive)">
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-1.5 break-words text-sm font-medium text-(--color-foreground)">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-(--color-inactive)" />}
        {value}
      </dd>
    </div>
  );
}

function ReadOnlyField({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <p className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</p>
      <p className="block w-full rounded-lg border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-sm text-gray-600">
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-(--color-tertiary-button) bg-(--color-background) px-3 py-1 text-xs font-semibold text-(--color-secondary-button)">
      {children}
    </span>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium text-(--color-foreground) transition hover:bg-(--color-background) hover:text-(--color-active)"
    >
      {label}
      <ChevronRight className="h-4 w-4 text-(--color-inactive)" />
    </Link>
  );
}
