import { z } from 'zod';

/**
 * Verhoeff checksum — the same algorithm UIDAI uses for the last Aadhaar digit.
 * Mirrored from the backend so a typo is caught before the user uploads several
 * megabytes of document scans, rather than after.
 *
 * The backend re-validates all of this. Client-side validation is UX, never a
 * security control.
 */
const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function isValidAadhaar(value: string): boolean {
  const digits = value.replace(/[\s-]/g, '');

  if (!/^\d{12}$/.test(digits)) return false;
  if (digits[0] === '0' || digits[0] === '1') return false;

  let c = 0;
  const reversed = digits.split('').reverse().map(Number);

  for (let i = 0; i < reversed.length; i++) {
    c = D[c][P[i % 8][reversed[i]]];
  }

  return c === 0;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const documentFile = z
  .instanceof(File, { message: 'Please upload a file' })
  .refine((f) => f.size > 0, 'Please upload a file')
  .refine((f) => f.size <= MAX_FILE_BYTES, 'File must be 5MB or smaller')
  .refine(
    (f) => ACCEPTED_TYPES.includes(f.type),
    'Upload a JPEG, PNG, or PDF',
  );

export const agentAccountSchema = z
  .object({
    name: z.string().min(2, 'Enter your full name').max(100),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128)
      .regex(
        /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        'Must include uppercase, lowercase, and a number or special character',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const agentAgencySchema = z.object({
  agencyName: z.string().min(2, 'Enter your agency name').max(200),
  contactPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  addressLine1: z.string().min(3, 'Enter your address').max(255),
  addressLine2: z.string().max(255).optional().or(z.literal('')),
  city: z.string().min(2, 'Enter your city').max(100),
  state: z.string().min(2, 'Enter your state').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  gstNumber: z
    .string()
    .regex(
      /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/,
      'Enter a valid 15-character GSTIN',
    )
    .optional()
    .or(z.literal('')),
});

export const agentKycSchema = z.object({
  panNumber: z
    .string()
    .transform((v) => v.trim().toUpperCase())
    .refine(
      (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v),
      'Enter a valid PAN (e.g. ABCDE1234F)',
    ),
  aadhaarNumber: z
    .string()
    .refine(isValidAadhaar, 'Enter a valid 12-digit Aadhaar number'),
  panCard: documentFile,
  aadhaarFront: documentFile,
  aadhaarBack: documentFile,
  gstCertificate: documentFile.optional(),
});

export type AgentAccountData = z.infer<typeof agentAccountSchema>;
export type AgentAgencyData = z.infer<typeof agentAgencySchema>;
export type AgentKycData = z.infer<typeof agentKycSchema>;

export type AgentRegistrationData = AgentAccountData &
  AgentAgencyData &
  AgentKycData;
