# Soul Paradise — Customer Website

The public website of **Soul Paradise Travels** (soulparadisetravels.com): customers and registered travel
agents search and book **flights, hotels and travel insurance**, pay securely through ICICI Bank, and manage
their bookings. Built with **Next.js 16 (App Router) + React + TypeScript + Tailwind CSS**.

It is a pure frontend: every search, price, booking and payment goes through the
[`soul_paradise_backend`](https://github.com/Soul-Paradise/soul_paradise_backend) API, which talks to the
suppliers (Benzy) and the bank. Page text, images, offers and policies are managed by staff in the
[`soul_paradise_admin_panel`](https://github.com/Soul-Paradise/admin_panel).

| Repo | What it is | Local URL |
|---|---|---|
| `soul_paradise_frontend` (this) | Customer & agent website | http://localhost:3000 |
| `soul_paradise_backend` | REST API (`/api/v1`) | http://localhost:8080 |
| `soul_paradise_admin_panel` | Staff admin panel | http://localhost:5173 |

---

## Quick start (from scratch)

### 1. Prerequisites

- **Node.js 24** and **Yarn 4** (`corepack enable` activates the Yarn version pinned by the repo)
- The **backend running locally** on http://localhost:8080 — follow its README first. The site can render
  without it, but searches, login and bookings need it.

### 2. Install

```bash
git clone git@github.com:Soul-Paradise/soul_paradise_frontend.git
cd soul_paradise_frontend
corepack enable
yarn install
```

### 3. Configure

```bash
cp .env.example .env.local
```

The defaults already point at a local backend. Only two values matter for local development:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<Google OAuth client ID, optional - enables "Sign in with Google">
```

Every `NEXT_PUBLIC_*` value is compiled into the browser bundle, so **never put a secret in one**. Real env
files (`.env.local`, `.env.production`) are git-ignored; only `.env.example` (placeholders) is tracked.

### 4. Run

```bash
yarn dev           # http://localhost:3000 (Turbopack, hot reload)
```

To try the full booking flow locally, run the backend with `PAYMENT_MODE=mock`: "Pay" then opens a test
payment page (Pay / Fail / Cancel) instead of the bank, and bookings go to Benzy's **test** systems.

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | Backend base URL including `/api/v1`. Also feeds the Content-Security-Policy, so it must be set at **build** time. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | no | Google Sign-In client ID (the client secret is never used by the website). |
| `NEXT_PUBLIC_SITE_URL` | prod | Public origin for canonical / `og:url` links. |
| `NEXT_PUBLIC_APP_ENV` | staging | `staging` = no search-engine indexing + a visible "STAGING" banner. |
| `NEXT_PUBLIC_ASSET_BASE` | no | CDN / custom domain in front of the public media bucket. |
| `NEXT_PUBLIC_PAYMENT_REDIRECT_HOSTS` | no | Extra hosts the site may redirect to for payment (see `lib/safe-redirect.ts`). |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | no | Google Search Console code (production). |

---

## What's in the site

| Area | Routes |
|---|---|
| Home + booking widget (Flights / Hotels / Insurance / Custom payment tabs) | `/` |
| Flights: results, fare details, multi-city, confirmation | `/booking/flights`, `/booking/flights/details`, `/booking/flights/multicity`, `/booking/flights/details/multicity`, `/booking/flights/confirmation` |
| Hotels: results, rooms, guest details, payment result | `/booking/hotels`, `/booking/hotels/rooms`, `/booking/hotels/book`, `/booking/hotels/payment-result` |
| Insurance: plans, plan details, traveller details, payment result, policy | `/booking/insurance`, `/booking/insurance/[planId]`, `/booking/insurance/[planId]/book`, `/booking/insurance/payment-result`, `/booking/insurance/confirmation/[transactionId]` |
| Payment result (flights, custom payments) | `/booking/payment/result` |
| My Bookings (flights, hotels, insurance, custom payments) with PDF downloads and cancellations | `/orders` |
| Account | `/login`, `/register`, `/verify-email`, `/verification-pending`, `/forgot-password`, `/reset-password`, `/profile`, `/shortlist` |
| Travel agents (B2B partners): registration + KYC, resubmission | `/register/agent`, `/agent/resubmit` |
| Content pages (from the admin panel's Site Content) | `/about`, `/service`, `/hall-of-fame`, `/contact` |
| Policies (from the admin panel) | `/terms`, `/privacy-policy`, `/refund-cancellation-policy`, `/policies/[slug]` |

### How a booking works on the site

1. The booking widget sends the search to the backend. Results come back **page by page** with server-side
   filters and sorting (`lib/use-result-page.ts`, `lib/results-api.ts`); the full list stays on the server.
2. The customer picks a fare / room / plan. The backend re-prices it and returns **only the final price**
   (the site never sees supplier prices or our commission).
3. The details form collects travellers, contact, GST, add-ons (seats, meals, baggage), KYC where needed.
4. "Pay" asks the backend to start the payment and redirects to ICICI (or the mock page locally). Redirects
   are only allowed to known payment hosts (`lib/safe-redirect.ts`).
5. The bank returns to a payment-result page that **polls the backend** until the supplier confirms. Success
   is shown **only** for a confirmed booking; otherwise the page shows "being issued" or "couldn't book —
   refund on the way".
6. The customer gets an email with the PDF; **My Bookings** lets them download it again (e-ticket, hotel
   voucher, insurance policy) and cancel where allowed. International trips also show a "Cover this trip
   with travel insurance?" card that opens a pre-filled insurance search.

---

## Project structure

```
app/                  Next.js App Router pages (one folder per route, see the table above)
  layout.tsx          Root layout: fonts, navbar/footer, auth + preferences providers, metadata
  robots.ts           robots.txt (no indexing on staging)
components/
  BookingTabs/        Home booking widget: FlightBooking, HotelBooking, TravelInsurance, CustomPayment
  FlightResults/ HotelResults/ InsuranceResults/ Results/   Result lists, filters, sort tabs, pagination
  FlightBookingDetails/ HotelBooking/ Insurance/            Details forms, summaries, confirmations
  Home/ HallOfFame/ Contact/ SiteContent/ Page/             Content-driven page sections
  Navbar/ Footer/ ...                                       Layout pieces, shared UI
contexts/
  AuthContext.tsx     Logged-in user, access/refresh tokens, useRequireAuth()
  PreferencesContext.tsx  Remembered choices (results per page, hotel shortlist) synced to the backend
lib/
  api.ts              authFetch: adds the access token, refreshes it on 401
  flights-api.ts insurance-api.ts bookings-api.ts agents-api.ts legal-api.ts results-api.ts
                      Typed API clients (hotel search/rooms/price calls live in app/booking/hotels/*;
                      hotel bookings, vouchers and cancellations in bookings-api.ts)
  site-content*.ts    CMS content loader + bundled fallback (site-content-fallback.json)
  safe-redirect.ts    Payment redirect allowlist (+ tests)
  app-env.ts          Staging / site-URL flags
  validations/        Zod form schemas
public/               Static files (favicon, logo, …); most images come from the CMS media bucket
next.config.ts        Security headers incl. Content-Security-Policy (built from NEXT_PUBLIC_API_URL)
```

### Conventions

- **Prices**: display what the backend returns; never compute commission or show supplier figures.
- **Supplier codes** (fare basis, booking classes, raw status codes, insurer codes) are never shown to
  customers; the backend sends readable labels.
- **Accordions** keep only one panel open at a time (`lib/accordion.ts`).
- Results pages for flights, hotels and insurance share the same layout and paging components.

---

## Scripts

| Command | What it does |
|---|---|
| `yarn dev` | Development server on port 3000 |
| `yarn build` | Production build (type-checks and prerenders static pages) |
| `yarn start` | Serve the production build |
| `yarn lint` | ESLint |
| `yarn test` | Node test runner for `lib/*.test.mjs` (redirect allowlist, star ratings) |

---

## Deployment

Hosted on **Vercel**, deployed by GitHub Actions with the Vercel CLI:

- **Production** — `.github/workflows/deploy-frontend.yml`, started by hand from `main` (a dry-run builds on
  any branch without deploying). It pulls the production Vercel project's environment and refuses to deploy
  a build that points at the staging API.
- **Staging** — `.github/workflows/deploy-frontend-staging.yml`, on every push to `staging`, into a separate
  Vercel project that must have `NEXT_PUBLIC_APP_ENV=staging`.

Environment values for deployed sites live in the Vercel projects, never in the repo.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Every API call fails / CORS error | Backend not running on `NEXT_PUBLIC_API_URL`, or its `CORS_ORIGINS` / `FRONTEND_URL` doesn't include http://localhost:3000. |
| "Sign in with Google" fails locally | The OAuth client must list `http://localhost:3000` as an authorized JavaScript origin. |
| Flight / hotel search errors | The backend can't reach Benzy (VPN off, or no Benzy credentials in the backend's `.env.local`). |
| Changed an env var but nothing changed | `NEXT_PUBLIC_*` values are baked in at build/start — restart `yarn dev`. |
