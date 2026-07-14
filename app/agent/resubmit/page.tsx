'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import FileUpload from '@/components/FileUpload';
import { showToast } from '@/lib/toast';
import {
  getResubmission,
  resubmitDocuments,
  type ResubmissionDetails,
} from '@/lib/agents-api';

/**
 * Where a rejected agent lands from the emailed link.
 *
 * They have no session — agents are hard-blocked from logging in until approved —
 * so the token in the URL is the only thing authenticating them. Without this
 * page, a rejection would be a dead end and every correction would arrive as a
 * support email with an attachment.
 */
function ResubmitForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [details, setDetails] = useState<ResubmissionDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [panCard, setPanCard] = useState<File>();
  const [aadhaarFront, setAadhaarFront] = useState<File>();
  const [aadhaarBack, setAadhaarBack] = useState<File>();
  const [gstCertificate, setGstCertificate] = useState<File>();

  useEffect(() => {
    if (!token) {
      setLoadError('This link is missing its token. Please use the link from your email.');
      setLoading(false);
      return;
    }

    getResubmission(token)
      .then(setDetails)
      .catch((error: Error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, [token]);

  const hasAnyFile = Boolean(
    panCard || aadhaarFront || aadhaarBack || gstCertificate,
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!hasAnyFile) {
      showToast({
        title: 'Nothing to upload',
        body: 'Attach at least one corrected document.',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);

    try {
      await resubmitDocuments(token, {
        panCard,
        aadhaarFront,
        aadhaarBack,
        gstCertificate,
      });
      setDone(true);
    } catch (error: any) {
      showToast({
        title: 'Could not resubmit',
        body: error.message || 'Please try again.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Centered>Loading your application…</Centered>;
  }

  if (loadError) {
    return (
      <Centered>
        <h1 className="text-2xl font-bold mb-3 text-(--color-foreground)">
          This link isn&apos;t valid
        </h1>
        <p className="text-sm text-(--color-foreground) opacity-80">{loadError}</p>
        <p className="text-sm mt-3 text-(--color-foreground) opacity-80">
          Resubmission links expire after 7 days. Contact support and we&apos;ll send
          you a new one.
        </p>
      </Centered>
    );
  }

  if (done) {
    return (
      <Centered>
        <h1 className="text-2xl font-bold mb-3 text-(--color-foreground)">
          Documents resubmitted
        </h1>
        <p className="text-sm text-(--color-foreground) opacity-80">
          Your application is back in review. We&apos;ll email you once it&apos;s been
          checked.
        </p>
        <Link
          href="/"
          className="inline-block mt-8 px-5 py-2.5 rounded-lg text-sm font-semibold bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button)"
        >
          Back to home
        </Link>
      </Centered>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-(--color-background)">
      <div className="w-full max-w-[460px]">
        <h1 className="text-2xl font-bold text-(--color-foreground)">
          Upload corrected documents
        </h1>
        <p className="mt-2 text-sm text-(--color-foreground) opacity-80">
          {details?.agencyName}
        </p>

        {details?.rejectionReason && (
          <div className="mt-5 rounded-lg border-l-4 border-red-500 bg-red-500/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-1">
              Why it was rejected
            </p>
            <p className="text-sm text-(--color-foreground)">
              {details.rejectionReason}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <p className="text-xs text-(--color-foreground) opacity-70">
            Only upload the documents you need to correct — anything you leave blank
            stays as it is.
          </p>

          <FileUpload
            id="panCard"
            label="PAN Card"
            value={panCard}
            onChange={setPanCard}
          />
          <FileUpload
            id="aadhaarFront"
            label="Aadhaar — Front"
            value={aadhaarFront}
            onChange={setAadhaarFront}
          />
          <FileUpload
            id="aadhaarBack"
            label="Aadhaar — Back"
            value={aadhaarBack}
            onChange={setAadhaarBack}
          />
          <FileUpload
            id="gstCertificate"
            label="GST Certificate (optional)"
            value={gstCertificate}
            onChange={setGstCertificate}
          />

          <button
            type="submit"
            disabled={submitting || !hasAnyFile}
            className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed bg-(--color-primary-button) text-(--color-peace) hover:bg-(--color-secondary-button) disabled:bg-(--color-inactive)"
          >
            {submitting ? 'Resubmitting…' : 'Resubmit for review'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-(--color-background)">
      <div className="w-full max-w-[460px] text-center">{children}</div>
    </div>
  );
}

export default function ResubmitPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<Centered>Loading…</Centered>}>
      <ResubmitForm />
    </Suspense>
  );
}
