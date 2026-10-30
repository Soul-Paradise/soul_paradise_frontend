'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Mail, Send } from 'lucide-react';
import { api, ApiError } from '@/lib/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = { kind: 'idle' } | { kind: 'success' | 'error'; message: string };

/**
 * Footer newsletter band: copy on the left, email form on the right; both
 * stack on small screens and the form's button drops under the field on phones.
 */
export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus({ kind: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setSubmitting(true);
    setStatus({ kind: 'idle' });
    try {
      const res = await api.subscribeNewsletter(value);
      setStatus({ kind: 'success', message: res.message });
      setEmail('');
    } catch (error) {
      setStatus({
        kind: 'error',
        message:
          error instanceof ApiError && error.statusCode === 429
            ? error.message
            : 'We could not sign you up just now. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-12 flex flex-col gap-6 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-(--color-links) to-(--color-accent-light) text-white shadow-lg shadow-blue-500/20">
          <Mail className="h-6 w-6" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-white sm:text-xl">Subscribe to our newsletter</h3>
          <p className="mt-1 text-sm leading-relaxed text-white/70">
            Travel deals, exclusive offers and destination ideas, straight to your inbox.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="w-full lg:max-w-md">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status.kind === 'error') setStatus({ kind: 'idle' });
            }}
            disabled={submitting}
            aria-invalid={status.kind === 'error'}
            aria-describedby="newsletter-status"
            className="h-12 w-full min-w-0 flex-1 rounded-full bg-white/10 px-5 text-base text-white placeholder:text-white/50 ring-1 ring-white/15 transition outline-none focus:bg-white/15 focus:ring-2 focus:ring-(--color-links) disabled:opacity-60 aria-invalid:ring-red-400"
          />
          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-(--color-links) px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:translate-y-0 disabled:opacity-70"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Subscribe
          </button>
        </div>
        <p
          id="newsletter-status"
          aria-live="polite"
          className={`mt-2 min-h-5 px-2 text-sm ${status.kind === 'error' ? 'text-red-300' : 'text-emerald-300'}`}
        >
          {status.kind !== 'idle' && (
            <span className="inline-flex items-center gap-1.5">
              {status.kind === 'success' && <CheckCircle2 className="h-4 w-4" />}
              {status.message}
            </span>
          )}
        </p>
      </form>
    </div>
  );
}
