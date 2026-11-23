// Unit tests for lib/safe-redirect.ts. Plain node (type stripping, Node 22.18+):
//   yarn test   (node --test lib/*.test.mjs)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedPaymentRedirect, safeNextPath } from './safe-redirect.ts';

const ORIGIN = 'https://pariksha.soulparadisetravels.com';
const STAGING_API = 'soul-paradise-backend-staging-tqbuvrrhfa-el.a.run.app';
const STAGING_API_ALT = 'soul-paradise-backend-staging-248893735000.asia-south1.run.app';

function withExtraHosts(value, fn) {
  const prev = process.env.NEXT_PUBLIC_PAYMENT_REDIRECT_HOSTS;
  if (value === undefined) delete process.env.NEXT_PUBLIC_PAYMENT_REDIRECT_HOSTS;
  else process.env.NEXT_PUBLIC_PAYMENT_REDIRECT_HOSTS = value;
  try {
    fn();
  } finally {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_PAYMENT_REDIRECT_HOSTS;
    else process.env.NEXT_PUBLIC_PAYMENT_REDIRECT_HOSTS = prev;
  }
}

test('ICICI gateway hosts are always allowed; unknown hosts are not', () => {
  withExtraHosts(undefined, () => {
    assert.equal(isAllowedPaymentRedirect('https://pgpay.icicibank.com/pay?x=1', ORIGIN), true);
    assert.equal(isAllowedPaymentRedirect('https://pgpayuat.icicibank.com/pay', ORIGIN), true);
    assert.equal(isAllowedPaymentRedirect('https://evil.example/pay', ORIGIN), false);
    assert.equal(isAllowedPaymentRedirect('http://pgpay.icicibank.com/pay', ORIGIN), false);
    assert.equal(isAllowedPaymentRedirect('https://user:pw@pgpay.icicibank.com/pay', ORIGIN), false);
  });
});

test('staging mock payment page on the staging backend is blocked unless allowlisted', () => {
  const mock = `https://${STAGING_API}/api/v1/payments/mock/0f6c2b1e-7d1a-4c55-9a43-2b8f0e1d9c77?amount=1250.00&ref=SP-123`;
  withExtraHosts(undefined, () => {
    assert.equal(isAllowedPaymentRedirect(mock, ORIGIN), false);
  });
  withExtraHosts(` ${STAGING_API.toUpperCase()} , ${STAGING_API_ALT} `, () => {
    // Host-only allowlist: any path on the staging backend, incl. /api/v1/payments/mock/...
    assert.equal(isAllowedPaymentRedirect(mock, ORIGIN), true);
    assert.equal(
      isAllowedPaymentRedirect(`https://${STAGING_API_ALT}/api/v1/payments/mock/abc/checkout`, ORIGIN),
      true,
    );
    // Still https-only, and look-alike hosts don't match.
    assert.equal(isAllowedPaymentRedirect(mock.replace('https:', 'http:'), ORIGIN), false);
    assert.equal(isAllowedPaymentRedirect(`https://${STAGING_API}.evil.example/api/v1/payments/mock/x`, ORIGIN), false);
    // The prod backend is not implicitly allowed by the staging setting.
    assert.equal(
      isAllowedPaymentRedirect('https://soul-paradise-backend-tqbuvrrhfa-el.a.run.app/api/v1/payments/mock/x', ORIGIN),
      false,
    );
  });
});

test('same-origin payment result pages are allowed', () => {
  withExtraHosts(undefined, () => {
    assert.equal(isAllowedPaymentRedirect(`${ORIGIN}/booking/insurance/payment-result?id=1`, ORIGIN), true);
  });
});

test('safeNextPath keeps relative paths and rejects open redirects', () => {
  assert.equal(safeNextPath('/booking/flights?x=1', ORIGIN), '/booking/flights?x=1');
  assert.equal(safeNextPath('//evil.example', ORIGIN), null);
  assert.equal(safeNextPath('/%2F%2Fevil.example', ORIGIN), null);
  assert.equal(safeNextPath('https://evil.example', ORIGIN), null);
});
