'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// ── Types ──────────────────────────────────────────────────────────────────

interface PlanQuestion {
  title: string;
  questionCode: string;
  selectionType: string;
  category: string;
}

interface PlanDetailsSummary {
  planId: string;
  providerName: string;
  planName: string;
  planType: string;
  policyType: string;
  premium: { total: number; tax: number; netTotal: number; currency: string };
  coverage: { amount: number; currency: string };
  providerSpecificFields: string[];
  coverageDetails: { questions: PlanQuestion[] };
}

interface SearchTraveller {
  id: number;
  birthdate: string;
  relation: string;
}

interface Nominee {
  firstName: string;
  middleName: string;
  lastName: string;
  relation: string;
  birthDate: string;
}

interface TravellerForm {
  title: string;
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  gender: string;
  relationship: string;
  passportNumber: string;
  visaType: string;
  maritalStatus: boolean;
  nominee: Nominee;
  answers: Record<string, string>; // questionCode → answer
}

interface CustomerForm {
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  nationality: string;
  mobile: string;
  email: string;
  passportNumber: string;
  pan: string;
  gstin: string;
  line1: string;
  line2: string;
  pinCode: string;
  city: string;
  state: string;
  countryCode: string;
  countryName: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr'];
const GENDERS = ['M', 'F'];

const toBackendPolicyType = (p: string): string => {
  // StartPay sample uses title case (e.g. "Individual"); our DTO stores uppercase
  // from the search. Backend BookInsuranceSchema now expects uppercase (see
  // POLICY_TYPES) — pass through.
  return (p || 'INDIVIDUAL').toUpperCase();
};

const emptyNominee = (): Nominee => ({
  firstName: '',
  middleName: '',
  lastName: '',
  relation: '',
  birthDate: '',
});

const makeTraveller = (t: SearchTraveller): TravellerForm => ({
  title: '',
  firstName: '',
  lastName: '',
  birthDate: t.birthdate,
  gender: '',
  relationship: t.relation || 'SELF',
  passportNumber: '',
  visaType: '',
  maritalStatus: false,
  nominee: emptyNominee(),
  answers: {},
});

const emptyCustomer = (countryCode: string, countryName: string): CustomerForm => ({
  title: '',
  firstName: '',
  middleName: '',
  lastName: '',
  birthDate: '',
  gender: '',
  nationality: 'indian',
  mobile: '',
  email: '',
  passportNumber: '',
  pan: '',
  gstin: '',
  line1: '',
  line2: '',
  pinCode: '',
  city: '',
  state: '',
  countryCode,
  countryName,
});

// ── Inner ──────────────────────────────────────────────────────────────────

function BookInsuranceInner() {
  const router = useRouter();
  const params = useParams<{ planId: string }>();
  const searchParams = useSearchParams();

  const planId = params.planId;
  const tui = searchParams.get('tui') || '';
  const policyType = searchParams.get('policyType') || 'INDIVIDUAL';
  const countryNames = (searchParams.get('countryNames') || '').split(',').filter(Boolean);
  const countryCodes = (searchParams.get('countryCodes') || '').split(',').filter(Boolean);
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const tenureInMonths = Number(searchParams.get('tenureInMonths') || '0');

  const searchTravellers: SearchTraveller[] = useMemo(() => {
    try {
      return JSON.parse(searchParams.get('travellers') || '[]');
    } catch {
      return [];
    }
  }, [searchParams]);

  const [plan, setPlan] = useState<PlanDetailsSummary | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState('');

  const [customer, setCustomer] = useState<CustomerForm>(() =>
    emptyCustomer(countryCodes[0] || 'IN', countryNames[0] || 'India'),
  );
  const [travellers, setTravellers] = useState<TravellerForm[]>(
    searchTravellers.map(makeTraveller),
  );
  const [copyProposerAddress, setCopyProposerAddress] = useState(true);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycMsg, setKycMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch plan details (need amount + plan type + questions + provider fields)
  useEffect(() => {
    if (!tui) {
      setPlanError('Search session expired. Please run the search again.');
      setPlanLoading(false);
      return;
    }
    const fetchPlan = async () => {
      setPlanLoading(true);
      setPlanError('');
      try {
        const res = await fetch(`${API_URL}/insurance/plan-details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId,
            policyType,
            countryNames,
            startDate,
            endDate,
            isPED: false,
            tenureInMonths,
            travellers: searchTravellers,
            tui,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as PlanDetailsSummary;
        setPlan(json);
      } catch (err: unknown) {
        setPlanError(err instanceof Error ? err.message : 'Failed to load plan.');
      } finally {
        setPlanLoading(false);
      }
    };
    fetchPlan();
  }, [planId, policyType, tui]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateTraveller = (i: number, patch: Partial<TravellerForm>) => {
    setTravellers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  };

  const updateNominee = (i: number, patch: Partial<Nominee>) => {
    setTravellers((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, nominee: { ...t.nominee, ...patch } } : t)),
    );
  };

  const updateAnswer = (i: number, code: string, value: string) => {
    setTravellers((prev) =>
      prev.map((t, idx) =>
        idx === i ? { ...t, answers: { ...t.answers, [code]: value } } : t,
      ),
    );
  };

  const needsGSTIN = plan?.providerSpecificFields?.some((f) => f.toLowerCase() === 'gstin');
  const questions = plan?.coverageDetails.questions ?? [];

  // ── KYC ──
  const handleValidateKyc = async () => {
    if (!customer.pan || !customer.firstName || !customer.birthDate || !customer.gender) {
      setKycMsg('Please fill PAN, name, DOB and gender before validating.');
      return;
    }
    if (!plan) return;
    setKycLoading(true);
    setKycMsg('');
    try {
      const res = await fetch(`${API_URL}/insurance/validate-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pan: customer.pan,
          name: `${customer.firstName} ${customer.lastName}`.trim(),
          gender: customer.gender,
          dob: customer.birthDate,
          providerName: plan.providerName,
          tui,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status !== 'Success') {
        setKycMsg(`KYC check returned: ${json.status || 'Failed'}`);
        return;
      }
      setCustomer((c) => ({
        ...c,
        title: json.prefix || c.title,
        firstName: json.fname || c.firstName,
        lastName: json.lname || c.lastName,
        line1: json.correS_LINE1 || c.line1,
        line2: json.correS_LINE2 || c.line2,
        city: json.correS_CITY || c.city,
        state: json.correS_STATE || c.state,
        pinCode: json.correS_PIN || c.pinCode,
      }));
      setKycMsg('KYC verified. Address and name prefilled.');
    } catch (err: unknown) {
      setKycMsg(err instanceof Error ? err.message : 'KYC validation failed.');
    } finally {
      setKycLoading(false);
    }
  };

  // ── Submit ──
  const validate = (): string | null => {
    if (!plan) return 'Plan not loaded yet.';
    if (!customer.title || !customer.firstName || !customer.lastName) return 'Proposer name is required.';
    if (!customer.birthDate) return 'Proposer DOB is required.';
    if (!customer.mobile || customer.mobile.length < 8) return 'Valid mobile number is required.';
    if (!customer.email || !customer.email.includes('@')) return 'Valid email is required.';
    if (!customer.line1 || !customer.pinCode || !customer.city || !customer.state) return 'Proposer address is incomplete.';
    for (let i = 0; i < travellers.length; i++) {
      const t = travellers[i];
      if (!t.title || !t.firstName || !t.lastName) return `Traveller ${i + 1}: name is required.`;
      if (!t.birthDate) return `Traveller ${i + 1}: DOB is required.`;
      if (!t.nominee.firstName || !t.nominee.lastName || !t.nominee.relation) return `Traveller ${i + 1}: nominee details are required.`;
      for (const q of questions) {
        if (!t.answers[q.questionCode]) return `Traveller ${i + 1}: please answer "${q.title}"`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setSubmitError(err);
      return;
    }
    if (!plan) return;
    setSubmitting(true);
    setSubmitError('');

    const proposerAddress = {
      addressType: 'PERMANENT',
      line1: customer.line1,
      line2: customer.line2,
      pinCode: customer.pinCode,
      areaCode: '0',
      city: { name: customer.city },
      state: { name: customer.state },
      country: { code: customer.countryCode, name: customer.countryName },
    };

    const proposerContact = {
      number: Number(customer.mobile),
      code: '+91',
      contactType: 'MOBILE',
      emailAddress: customer.email,
      emailAddressType: 'PERSONAL',
    };

    try {
      const res = await fetch(`${API_URL}/insurance/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ckyc: '',
          panNo: customer.pan,
          isDocumentUpload: false,
          isForm60: false,
          passportFileNo: '',
          countryCodes,
          countryNames,
          startDate,
          endDate,
          isTravelingFromIndia: true,
          tenureInMonths,
          policyType: toBackendPolicyType(policyType),
          customer: {
            nationality: customer.nationality,
            title: customer.title,
            firstName: customer.firstName,
            middleName: customer.middleName,
            lastName: customer.lastName,
            birthDate: customer.birthDate,
            contactInfo: proposerContact,
            addresses: [proposerAddress],
            gstin: customer.gstin,
            passportNumber: customer.passportNumber || null,
            gender: customer.gender || null,
          },
          plans: [
            {
              id: plan.planId,
              type: plan.planType,
              travellers: travellers.map((t, i) => ({
                id: i + 1,
                title: t.title,
                firstName: t.firstName,
                lastName: t.lastName,
                birthDate: t.birthDate,
                passportNumber: t.passportNumber || null,
                visaType: t.visaType || null,
                maritalStatus: t.maritalStatus,
                gender: t.gender || null,
                relationship: t.relationship,
                isProposer: i === 0,
                nominee: {
                  firstName: t.nominee.firstName,
                  middleName: t.nominee.middleName || null,
                  lastName: t.nominee.lastName,
                  relation: t.nominee.relation,
                  birthDate: t.nominee.birthDate || null,
                },
                questionsAnswers: questions.length
                  ? questions.map((q) => ({
                      questionCode: q.questionCode,
                      answer: t.answers[q.questionCode] ?? '',
                    }))
                  : null,
                addresses: [copyProposerAddress ? proposerAddress : proposerAddress],
                contactInfo: proposerContact,
              })),
            },
          ],
          tripType: 'Single',
          amount: plan.premium.total,
          tui,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body}`);
      }
      const json = await res.json();
      const transactionId = json.TransactionID ?? json.transactionID;
      if (transactionId) {
        router.push(`/booking/insurance/confirmation/${transactionId}`);
      } else {
        setSubmitError('Booking succeeded but no transaction ID returned.');
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Booking failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (planLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
        <div className="w-14 h-14 border-4 border-green-200 border-t-[var(--color-success)] rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading plan...</p>
      </div>
    );
  }

  if (planError || !plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center max-w-sm">
          <p className="text-gray-600 mb-4">{planError || 'Plan not found.'}</p>
          <button onClick={() => router.back()} className="text-[var(--color-success)] hover:underline text-sm">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const priceToPay = plan.premium.netTotal > 0 && plan.premium.netTotal < plan.premium.total
    ? plan.premium.netTotal
    : plan.premium.total;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="font-semibold text-gray-800 text-sm">Passenger & Booking Details</h1>
            <p className="text-xs text-gray-500">{plan.planName} · {plan.providerName}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Proposer Section */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Proposer Details</h2>
            <span className="text-xs text-gray-400">Person who owns the policy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Title *">
              <select className={selectCls} value={customer.title} onChange={(e) => setCustomer({ ...customer, title: e.target.value })}>
                <option value="">Select</option>
                {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="First Name *">
              <input className={inputCls} value={customer.firstName} onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })} />
            </Field>
            <Field label="Last Name *">
              <input className={inputCls} value={customer.lastName} onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })} />
            </Field>

            <Field label="Date of Birth *">
              <input type="date" className={inputCls} value={customer.birthDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => setCustomer({ ...customer, birthDate: e.target.value })} />
            </Field>
            <Field label="Gender">
              <select className={selectCls} value={customer.gender} onChange={(e) => setCustomer({ ...customer, gender: e.target.value })}>
                <option value="">Select</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g === 'M' ? 'Male' : 'Female'}</option>)}
              </select>
            </Field>
            <Field label="Nationality *">
              <input className={inputCls} value={customer.nationality} onChange={(e) => setCustomer({ ...customer, nationality: e.target.value })} />
            </Field>

            <Field label="Mobile *">
              <input type="tel" className={inputCls} value={customer.mobile} onChange={(e) => setCustomer({ ...customer, mobile: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Field label="Email *" span={2}>
              <input type="email" className={inputCls} value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
            </Field>

            <Field label="Passport Number">
              <input className={inputCls} value={customer.passportNumber} onChange={(e) => setCustomer({ ...customer, passportNumber: e.target.value.toUpperCase() })} />
            </Field>

            {needsGSTIN && (
              <Field label="GSTIN">
                <input className={inputCls} value={customer.gstin} onChange={(e) => setCustomer({ ...customer, gstin: e.target.value.toUpperCase() })} placeholder="Optional" />
              </Field>
            )}
          </div>

          {/* KYC */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">KYC (PAN)</h3>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="PAN">
                <input className={inputCls} value={customer.pan} onChange={(e) => setCustomer({ ...customer, pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" />
              </Field>
              <button
                type="button"
                onClick={handleValidateKyc}
                disabled={kycLoading}
                className="px-4 py-2 bg-blue-50 text-[#1F7AC4] text-sm font-semibold rounded-lg hover:bg-blue-100 disabled:opacity-50"
              >
                {kycLoading ? 'Verifying…' : 'Verify & Autofill'}
              </button>
              {kycMsg && <p className="text-xs text-gray-600">{kycMsg}</p>}
            </div>
          </div>

          {/* Address */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Address Line 1 *" span={3}>
                <input className={inputCls} value={customer.line1} onChange={(e) => setCustomer({ ...customer, line1: e.target.value })} />
              </Field>
              <Field label="Address Line 2" span={3}>
                <input className={inputCls} value={customer.line2} onChange={(e) => setCustomer({ ...customer, line2: e.target.value })} />
              </Field>
              <Field label="Pin Code *">
                <input className={inputCls} value={customer.pinCode} onChange={(e) => setCustomer({ ...customer, pinCode: e.target.value.replace(/\D/g, '') })} />
              </Field>
              <Field label="City *">
                <input className={inputCls} value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} />
              </Field>
              <Field label="State *">
                <input className={inputCls} value={customer.state} onChange={(e) => setCustomer({ ...customer, state: e.target.value })} />
              </Field>
            </div>
          </div>
        </section>

        {/* Travellers */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Travellers ({travellers.length})</h2>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={copyProposerAddress} onChange={(e) => setCopyProposerAddress(e.target.checked)} />
              Use proposer's address for all travellers
            </label>
          </div>

          {travellers.map((t, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1F7AC4] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <h3 className="text-sm font-semibold text-gray-700">Traveller {i + 1}</h3>
                <span className="ml-auto text-xs text-gray-400">{t.relationship}{i === 0 ? ' · Proposer' : ''}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Title *">
                  <select className={selectCls} value={t.title} onChange={(e) => updateTraveller(i, { title: e.target.value })}>
                    <option value="">Select</option>
                    {TITLES.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </Field>
                <Field label="First Name *">
                  <input className={inputCls} value={t.firstName} onChange={(e) => updateTraveller(i, { firstName: e.target.value })} />
                </Field>
                <Field label="Last Name *">
                  <input className={inputCls} value={t.lastName} onChange={(e) => updateTraveller(i, { lastName: e.target.value })} />
                </Field>

                <Field label="Date of Birth *">
                  <input type="date" className={inputCls} value={t.birthDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => updateTraveller(i, { birthDate: e.target.value })} />
                </Field>
                <Field label="Gender">
                  <select className={selectCls} value={t.gender} onChange={(e) => updateTraveller(i, { gender: e.target.value })}>
                    <option value="">Select</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g === 'M' ? 'Male' : 'Female'}</option>)}
                  </select>
                </Field>
                <Field label="Passport Number">
                  <input className={inputCls} value={t.passportNumber} onChange={(e) => updateTraveller(i, { passportNumber: e.target.value.toUpperCase() })} />
                </Field>
              </div>

              {/* Nominee */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Nominee</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="First Name *">
                    <input className={inputCls} value={t.nominee.firstName} onChange={(e) => updateNominee(i, { firstName: e.target.value })} />
                  </Field>
                  <Field label="Last Name *">
                    <input className={inputCls} value={t.nominee.lastName} onChange={(e) => updateNominee(i, { lastName: e.target.value })} />
                  </Field>
                  <Field label="Relation *">
                    <input className={inputCls} value={t.nominee.relation} onChange={(e) => updateNominee(i, { relation: e.target.value })} placeholder="e.g. Spouse" />
                  </Field>
                </div>
              </div>

              {/* Health Questions */}
              {questions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Health Questions</h4>
                  <div className="space-y-2">
                    {questions.map((q) => (
                      <div key={q.questionCode} className="flex items-center justify-between gap-3 p-2.5 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 flex-1">{q.title}</p>
                        <div className="flex gap-2">
                          {['Yes', 'No'].map((opt) => (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => updateAnswer(i, q.questionCode, opt)}
                              className={`px-3 py-1 rounded-md text-xs font-medium border ${t.answers[q.questionCode] === opt ? 'bg-[var(--color-success)] text-white border-[var(--color-success)]' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
            {submitError}
          </div>
        )}
      </form>

      {/* Sticky Pay Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400">Amount to Pay</p>
            <p className="text-xl font-bold text-gray-800">₹{Math.round(priceToPay).toLocaleString()}</p>
          </div>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            disabled={submitting}
            className="px-6 py-2.5 bg-[var(--color-success)] text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Processing…' : 'Confirm & Pay →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small field wrapper ────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--color-success)]';
const selectCls = inputCls + ' bg-white';

function Field({ label, span = 1, children }: { label: string; span?: 1 | 2 | 3; children: React.ReactNode }) {
  const spanCls = span === 3 ? 'sm:col-span-3' : span === 2 ? 'sm:col-span-2' : '';
  return (
    <label className={`block ${spanCls}`}>
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

// ── Page Export ────────────────────────────────────────────────────────────

export default function BookInsurancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-200 border-t-[var(--color-success)] rounded-full animate-spin" />
      </div>
    }>
      <BookInsuranceInner />
    </Suspense>
  );
}
