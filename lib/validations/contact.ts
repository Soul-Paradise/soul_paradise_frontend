import { z } from 'zod';

export const contactFormSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must not exceed 255 characters')
    .trim()
    .toLowerCase(),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
      'Please enter a valid phone number'
    )
    .trim(),
  subject: z
    .string()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must not exceed 200 characters')
    .trim(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must not exceed 5000 characters')
    .trim(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
