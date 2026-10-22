'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { AlertCircle, BadgeCheck, ExternalLink, Lock } from 'lucide-react';
import { useAuth, useRequireAuth } from '@/contexts/AuthContext';
import {
  PriceChangedError,
  formatCoverage,
  formatInr,
  getPlanDetails,
  searchFromParams,
  startInsuranceBooking,
  travellerLabel,
  verifyKyc,
  type BookingTraveller,
  type InsurancePlan,
  type InsuranceSearch,
  type PlanQuestion,
  type Title,
} from '@/lib/insurance-api';
import { ErrorCard, ProviderLogo, Spinner, TripSummaryBar, formatDay } from '@/components/Insurance/shared';

const TITLES: Title[] = ['Mr', 'Mrs', 'Ms', 'Master'];
const NOMINEE_RELATIONS = ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'];
const PED_MASTER = 'ISPED';

/** CheckBox, Radio and List questions are all answered Yes/No. */
const isYesNo = (q: PlanQuestion) => ['checkbox', 'radio', 'list'].includes(q.selectionType.toLowerCase());

/**
 * Key of a question in the answers map. List items share one code (every
 * disease is "PEDDetails"), so they are keyed by title too. Mirrors the backend.
 */
const answerKey = (q: PlanQuestion) =>
  q.selectionType.toLowerCase() === 'list' ? `${q.questionCode}:${q.title.trim()}` : q.questionCode;

type Address = { line1: string; line2: string; city: string; state: string; pinCode: string };

const inputCls =
  'w-full px-3 py-2.5 border border-gray-300 rounded-md text-base sm:text-sm bg-white outline-none focus:border-(--color-links) focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500';

function Field({ label, hint, className = '', children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function YesNo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-1.5 shrink-0">
      {[true, false].map((opt) => (
        <button
          key={String(opt)}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3.5 py-1.5 rounded-md text-xs font-semibold border ${
            value === opt
              ? 'bg-(--color-links) border-(--color-links) text-white'
              : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          {opt ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
}

/**
 * The plan's health questionnaire for one traveller. CheckBox, Radio and List
 * questions are Yes/No; TextBox questions take a short free-text answer. The PED detail
 * questions only appear once the traveller declares a pre-existing condition.
 */
function HealthDeclaration({
  questions,
  answers,
  onChange,
}: {
  questions: PlanQuestion[];
  answers: Record<string, string>;
  onChange: (code: string, value: string) => void;
}) {
  const hasPed = answers[PED_MASTER] === 'true';
  const isPedDetail = (q: PlanQuestion) => q.questionCode !== PED_MASTER && q.questionCode.startsWith('PED');
  const shown = questions.filter((q) => !isPedDetail(q) || hasPed);

  return (
    <div className="space-y-2">
      {shown.map((q) => (
        <div
          key={answerKey(q)}
          className={`rounded-lg px-3 py-2.5 ${isPedDetail(q) ? 'ml-4 border-l-2 border-blue-100 bg-white' : 'bg-gray-50'}`}
        >
          {isYesNo(q) ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-700">{q.title.trim()}</p>
              <YesNo
                value={answers[answerKey(q)] === 'true'}
                onChange={(v) => onChange(answerKey(q), String(v))}
              />
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-700 mb-1.5">{q.title.trim()}</p>
              <input
                className={inputCls}
                maxLength={200}
                value={answers[answerKey(q)] ?? ''}
                onChange={(e) => onChange(answerKey(q), e.target.value)}
                placeholder="Leave blank if none"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function emptyTraveller(t: InsuranceSearch['travellers'][number], questions: PlanQuestion[]): BookingTraveller {
  const answers: Record<string, string> = {};
  for (const q of questions) answers[answerKey(q)] = isYesNo(q) ? 'false' : '';
  return {
    title: 'Mr',
    firstName: '',
    lastName: '',
    birthDate: t.birthdate,
    relation: t.relation,
    passportNumber: '',
    nominee: { firstName: '', lastName: '', relation: '' },
    answers,
  };
}

function BookingForm({ search, plan, tui }: { search: InsuranceSearch; plan: InsurancePlan; tui: string }) {
  const { user } = useAuth();
  const [travellers, setTravellers] = useState<BookingTraveller[]>(() =>
    search.travellers.map((t) => emptyTraveller(t, plan.questions)),
  );
  const [email, setEmail] = useState(user?.email ?? '');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState<Address>({ line1: '', line2: '', city: '', state: '', pinCode: '' });
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [kyc, setKyc] = useState<'idle' | 'checking' | 'verified' | 'action' | 'failed'>('idle');
  const [kycMessage, setKycMessage] = useState('');
  const [kycUrl, setKycUrl] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [price, setPrice] = useState(plan.price);
  const [priceNotice, setPriceNotice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const proposerIndex = Math.max(0, travellers.findIndex((t) => t.relation === 'SELF'));
  const proposer = travellers[proposerIndex];

  const patch = (i: number, p: Partial<BookingTraveller>) =>
    setTravellers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...p } : t)));

  // A PAN verified for one name/DOB doesn't carry over if those change.
  useEffect(() => {
    if (kyc !== 'idle' && kyc !== 'checking') setKyc('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pan, proposer.title, proposer.firstName, proposer.lastName]);

  const runKyc = async () => {
    setKycMessage('');
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return setKycMessage('Enter a valid 10-character PAN.');
    if (!proposer.firstName || !proposer.lastName) return setKycMessage('Fill in your name above first.');
    setKyc('checking');
    try {
      const res = await verifyKyc({
        pan,
        title: proposer.title,
        firstName: proposer.firstName,
        lastName: proposer.lastName,
        birthDate: proposer.birthDate,
        providerName: plan.provider,
        tui,
      });
      if (res.status === 'VERIFIED') {
        setKyc('verified');
        // Fill only what the customer hasn't typed themselves.
        setAddress((a) => ({
          line1: a.line1 || res.address.line1,
          line2: a.line2 || res.address.line2,
          city: a.city || res.address.city,
          state: a.state || res.address.state,
          pinCode: a.pinCode || res.address.pinCode,
        }));
      } else if (res.status === 'ACTION_REQUIRED') {
        setKyc('action');
        setKycUrl(res.url);
      } else {
        setKyc('failed');
        setKycMessage(res.message);
      }
    } catch (e) {
      setKyc('failed');
      setKycMessage((e as Error).message);
    }
  };

  const validate = (): string | null => {
    const nameOk = (s: string) => /^[A-Za-z][A-Za-z .'-]*$/.test(s.trim());
    for (let i = 0; i < travellers.length; i++) {
      const t = travellers[i];
      const who = travellerLabel(travellers, i);
      if (!nameOk(t.firstName) || !nameOk(t.lastName)) return `${who}: enter first and last name as on the passport.`;
      if (!/^[A-Z0-9]{6,12}$/.test(t.passportNumber)) return `${who}: enter a valid passport number.`;
      if (!nameOk(t.nominee.firstName) || !nameOk(t.nominee.lastName) || !t.nominee.relation) {
        return `${who}: add a nominee (name and relation).`;
      }
      if (
        t.nominee.firstName.trim().toLowerCase() === t.firstName.trim().toLowerCase() &&
        t.nominee.lastName.trim().toLowerCase() === t.lastName.trim().toLowerCase()
      ) {
        return `${who}: the nominee must be someone other than the traveller.`;
      }
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Enter a valid email address.';
    if (!/^[6-9]\d{9}$/.test(mobile)) return 'Enter a valid 10-digit mobile number.';
    if (address.line1.trim().length < 3 || address.city.trim().length < 2 || address.state.trim().length < 2) {
      return 'Enter your full address.';
    }
    if (!/^\d{6}$/.test(address.pinCode)) return 'Enter a 6-digit PIN code.';
    if (plan.requiresKyc && kyc !== 'verified') return 'Verify your PAN for KYC before paying.';
    if (gstin && !/^[0-9A-Z]{15}$/.test(gstin)) return 'Enter a valid 15-character GSTIN, or leave it blank.';
    if (!agreed) return 'Please accept the policy terms to continue.';
    return null;
  };

  const pay = async () => {
    const problem = validate();
    setError(problem ?? '');
    if (problem) return;
    setSubmitting(true);
    try {
      const res = await startInsuranceBooking({
        policyType: search.policyType,
        countryCodes: search.countryCodes,
        countryNames: search.countryNames,
        startDate: search.startDate,
        endDate: search.endDate,
        tenureInMonths: search.tenureInMonths,
        planId: plan.planId,
        tui,
        expectedAmount: price,
        travellers: travellers.map((t) => ({
          ...t,
          firstName: t.firstName.trim(),
          lastName: t.lastName.trim(),
          nominee: {
            firstName: t.nominee.firstName.trim(),
            lastName: t.nominee.lastName.trim(),
            relation: t.nominee.relation,
          },
        })),
        contact: { email: email.trim(), mobile },
        address: {
          line1: address.line1.trim(),
          line2: address.line2.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          pinCode: address.pinCode,
        },
        ...(plan.requiresKyc ? { pan } : {}),
        ...(gstin ? { gstin } : {}),
      });
      window.location.href = res.redirectUrl;
    } catch (e) {
      if (e instanceof PriceChangedError) {
        setPrice(e.amount);
        setPriceNotice(e.message);
      } else {
        setError((e as Error).message);
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="space-y-5 min-w-0">
        {travellers.map((t, i) => (
          <Section
            key={i}
            title={travellerLabel(travellers, i)}
            aside={
              <span className="text-xs text-gray-500">
                Born {formatDay(t.birthDate)}
                {i === proposerIndex ? ' · Policy holder' : ''}
              </span>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr_1fr] gap-3">
              <Field label="Title">
                <select className={inputCls} value={t.title} onChange={(e) => patch(i, { title: e.target.value as Title })}>
                  {TITLES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="First name">
                <input className={inputCls} autoComplete={i === proposerIndex ? 'given-name' : 'off'} value={t.firstName} onChange={(e) => patch(i, { firstName: e.target.value })} />
              </Field>
              <Field label="Last name">
                <input className={inputCls} autoComplete={i === proposerIndex ? 'family-name' : 'off'} value={t.lastName} onChange={(e) => patch(i, { lastName: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <Field label="Passport number" hint="Names must match the passport exactly.">
                <input
                  className={inputCls}
                  value={t.passportNumber}
                  maxLength={12}
                  onChange={(e) => patch(i, { passportNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                />
              </Field>
              <Field label="Date of birth" hint="From your search. Change it there to re-price.">
                <input className={inputCls} value={formatDay(t.birthDate)} disabled />
              </Field>
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mt-5 mb-2">Nominee</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="First name">
                <input className={inputCls} value={t.nominee.firstName} onChange={(e) => patch(i, { nominee: { ...t.nominee, firstName: e.target.value } })} />
              </Field>
              <Field label="Last name">
                <input className={inputCls} value={t.nominee.lastName} onChange={(e) => patch(i, { nominee: { ...t.nominee, lastName: e.target.value } })} />
              </Field>
              <Field label="Relation to traveller">
                <select className={inputCls} value={t.nominee.relation} onChange={(e) => patch(i, { nominee: { ...t.nominee, relation: e.target.value } })}>
                  <option value="">Select</option>
                  {NOMINEE_RELATIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
            </div>

            {plan.questions.length > 0 && (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mt-5 mb-2">Health declaration</h3>
                <HealthDeclaration
                  questions={plan.questions}
                  answers={t.answers}
                  onChange={(code, value) => patch(i, { answers: { ...t.answers, [code]: value } })}
                />
              </>
            )}
          </Section>
        ))}

        <Section title="Contact & address" aside={<span className="text-xs text-gray-500">Your policy is sent here</span>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Email">
              <input type="email" autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Mobile number">
              <div className="flex">
                <span className="px-3 flex items-center border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-sm text-gray-500">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  className={`${inputCls} rounded-l-none`}
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </Field>
            <Field label="Address line 1" className="sm:col-span-2">
              <input autoComplete="address-line1" className={inputCls} value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
            </Field>
            <Field label="Address line 2 (optional)" className="sm:col-span-2">
              <input autoComplete="address-line2" className={inputCls} value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
            </Field>
            <Field label="City">
              <input autoComplete="address-level2" className={inputCls} value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="State">
                <input autoComplete="address-level1" className={inputCls} value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
              </Field>
              <Field label="PIN code">
                <input
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className={inputCls}
                  maxLength={6}
                  value={address.pinCode}
                  onChange={(e) => setAddress({ ...address, pinCode: e.target.value.replace(/\D/g, '') })}
                />
              </Field>
            </div>
            {plan.wantsGstin && (
              <Field label="GSTIN (optional)" hint="Only if you want a GST invoice." className="sm:col-span-2">
                <input className={inputCls} maxLength={15} value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))} />
              </Field>
            )}
          </div>
        </Section>

        {plan.requiresKyc && (
          <Section
            title="KYC verification"
            aside={
              kyc === 'verified' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-(--color-success)">
                  <BadgeCheck className="w-4 h-4" /> Verified
                </span>
              ) : null
            }
          >
            <p className="text-sm text-gray-600 mb-3">
              {plan.providerLabel} needs the policy holder&apos;s PAN to complete KYC. Your name and date of birth above
              must match your PAN.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <Field label="PAN" className="sm:w-56">
                <input
                  className={inputCls}
                  maxLength={10}
                  value={pan}
                  disabled={kyc === 'checking'}
                  onChange={(e) => setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="ABCDE1234F"
                />
              </Field>
              {kyc !== 'verified' && (
                <button
                  type="button"
                  onClick={runKyc}
                  disabled={kyc === 'checking'}
                  className="px-5 py-2.5 text-sm font-semibold rounded-md border border-(--color-links) text-(--color-links) hover:bg-blue-50 disabled:opacity-50"
                >
                  {kyc === 'checking' ? 'Verifying…' : kyc === 'action' ? 'Verify again' : 'Verify PAN'}
                </button>
              )}
            </div>
            {kyc === 'action' && (
              <div className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {plan.providerLabel} needs you to finish KYC on their website.{' '}
                <a href={kycUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline">
                  Complete KYC <ExternalLink className="w-3.5 h-3.5" />
                </a>
                , then come back and press &quot;Verify again&quot;.
              </div>
            )}
            {kycMessage && <p className="mt-3 text-sm text-(--color-danger)">{kycMessage}</p>}
          </Section>
        )}
      </div>

      {/* Summary + pay */}
      <aside className="lg:sticky lg:top-4 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-3">
            <ProviderLogo src={plan.providerLogo} label={plan.providerLabel} />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 leading-snug">{plan.planName}</p>
              <p className="text-xs text-gray-500">{plan.providerLabel}</p>
            </div>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Medical cover</dt>
              <dd className="font-medium text-gray-800 text-right">{formatCoverage(plan.coverage)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Covered</dt>
              <dd className="font-medium text-gray-800 text-right">
                {formatDay(search.startDate)} – {formatDay(search.endDate)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Travellers</dt>
              <dd className="font-medium text-gray-800">{travellers.length}</dd>
            </div>
          </dl>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-gray-800">Total</span>
            <span className="text-2xl font-bold text-gray-900">{formatInr(price)}</span>
          </div>

          {priceNotice && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {priceNotice}
            </div>
          )}

          <label className="mt-4 flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 accent-(--color-links)" />
            <span>
              I confirm these details are correct and the health declaration is true, and I accept the{' '}
              {plan.policyWordingURL ? (
                <a href={plan.policyWordingURL} target="_blank" rel="noopener noreferrer" className="text-(--color-links) underline">
                  policy wording
                </a>
              ) : (
                'policy wording'
              )}
              {plan.termsAndConditions[0] && (
                <>
                  {' '}and{' '}
                  <a href={plan.termsAndConditions[0]} target="_blank" rel="noopener noreferrer" className="text-(--color-links) underline">
                    terms
                  </a>
                </>
              )}
              .
            </span>
          </label>

          {error && <p className="mt-3 text-sm text-(--color-danger)">{error}</p>}

          <button
            type="button"
            onClick={pay}
            disabled={submitting}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 bg-(--color-links) text-white text-sm font-semibold rounded-md hover:opacity-90 disabled:opacity-60"
          >
            <Lock className="w-4 h-4" />
            {submitting ? 'Taking you to payment…' : `Pay ${formatInr(price)}`}
          </button>
          <p className="mt-2 text-[11px] text-center text-gray-400">Secure payment via ICICI Bank</p>
        </div>
      </aside>
    </div>
  );
}

function BookInsurance() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { planId } = useParams<{ planId: string }>();
  const params = useSearchParams();
  const search = useMemo(() => searchFromParams(params), [params]);
  const tui = params.get('tui') || '';
  const [plan, setPlan] = useState<InsurancePlan | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !isAuthenticated || !search || !tui) return;
    let cancelled = false;
    getPlanDetails(search, planId, tui)
      .then((p) => !cancelled && setPlan(p))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, search, planId, tui]);

  if (!search || !tui) return <ErrorCard message="Your search session has expired. Please search again." />;
  const planHref = `/booking/insurance/${encodeURIComponent(planId)}?${params.toString()}`;

  return (
    <main className="min-h-screen bg-gray-50">
      <TripSummaryBar search={search} title="Traveller details" backHref={planHref} backLabel="Back to plan" />
      {error ? (
        <ErrorCard message={error} actionHref={planHref} actionLabel="Back to plan" />
      ) : !plan ? (
        <Spinner label="Preparing your booking…" />
      ) : (
        <BookingForm search={search} plan={plan} tui={tui} />
      )}
      <p className="text-center text-xs text-gray-400 pb-8">
        Need to change dates or travellers?{' '}
        <Link href="/?tab=insurance" className="text-(--color-links) hover:underline">
          Start a new search
        </Link>
      </p>
    </main>
  );
}

export default function BookInsurancePage() {
  return (
    <Suspense fallback={<Spinner label="Loading…" />}>
      <BookInsurance />
    </Suspense>
  );
}
