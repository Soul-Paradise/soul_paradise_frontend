import { z } from 'zod';

// Zod's JIT probes `Function("")` on first parse; our CSP forbids eval, so the
// probe would be reported as a CSP violation. Run in jitless mode instead
// (same results, no eval).
z.config({ jitless: true });

export { z };
