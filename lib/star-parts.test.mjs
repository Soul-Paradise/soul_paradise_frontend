// Unit tests for lib/star-parts.ts. Plain node (type stripping):
//   yarn test   (node --test lib/*.test.mjs)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starParts } from './star-parts.ts';

// Client rule (2026-11-23): whole point = full star, any .1-.9 = half star.
const cases = [
  [4.3, { full: 4, half: true, empty: 0 }],
  [4.9, { full: 4, half: true, empty: 0 }],
  [4.0, { full: 4, half: false, empty: 1 }],
  [3.5, { full: 3, half: true, empty: 1 }],
  [3.1, { full: 3, half: true, empty: 1 }],
  [5, { full: 5, half: false, empty: 0 }],
  [0.4, { full: 0, half: true, empty: 4 }],
  [0, { full: 0, half: false, empty: 5 }],
  [4.04, { full: 4, half: false, empty: 1 }], // rounds to 4.0, like the score badge
  [7, { full: 5, half: false, empty: 0 }], // clamped
  [null, { full: 0, half: false, empty: 5 }],
];

for (const [rating, parts] of cases) {
  test(`starParts(${rating})`, () => {
    assert.deepEqual(starParts(rating), parts);
  });
}
