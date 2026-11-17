import { z } from 'zod';

const forbiddenSensitiveFields = ['upiPin', 'otp', 'bankingPassword', 'pin'] as const;

function rejectSensitiveFields(data: Record<string, unknown>, ctx: z.RefinementCtx) {
  for (const field of forbiddenSensitiveFields) {
    if (field in data && data[field] !== undefined && data[field] !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `Sensitive banking field "${field}" must never be submitted or stored.`,
      });
    }
  }
}

export const mobileNumberSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/[\s-]/g, ''))
  .refine((val) => /^(\+91)?[6-9]\d{9}$/.test(val), {
    message: 'Enter a valid 10-digit Indian mobile number (e.g., 9820000101 or +919820000101).',
  })
  .transform((val) => (val.startsWith('+91') ? val : `+91${val}`));

const baseUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  mobileNumber: mobileNumberSchema
    .optional()
    .or(z.literal('').transform(() => undefined)),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .max(128),
});

export const customerRegisterSchema = baseUserSchema
  .passthrough()
  .superRefine((data, ctx) => {
    rejectSensitiveFields(data, ctx);
    if (!data.email && !data.mobileNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Provide at least an email address or a mobile number.',
      });
    }
  });

export const vendorProfileInputSchema = z.object({
  businessName: z.string().trim().min(2, 'Business name is required.').max(140),
  category: z.string().trim().min(2, 'Business category is required.').max(80),
  description: z.string().trim().min(10, 'Description must be at least 10 characters.').max(1500),
  address: z.string().trim().min(5, 'Address is required.').max(250),
  area: z.string().trim().min(2, 'Mira-Bhayandar area is required.').max(80),
  city: z.string().trim().min(2).max(80).default('Mira-Bhayandar'),
  openingTime: z.string().trim().min(2, 'Opening time is required.').max(40),
  closingTime: z.string().trim().min(2, 'Closing time is required.').max(40),
  contactNumber: mobileNumberSchema.optional(),
  upiId: z
    .string()
    .trim()
    .refine((val) => !val || val.includes('@'), {
      message: 'UPI ID must include "@" (for example: myshop.demo@upi).',
    })
    .optional()
    .or(z.literal('').transform(() => undefined)),
  profileImage: z.string().trim().optional(),
  coverImage: z.string().trim().optional(),
});

export const vendorRegisterSchema = baseUserSchema
  .extend({
    vendorProfile: vendorProfileInputSchema.optional(),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    rejectSensitiveFields(data, ctx);
    if (!data.email && !data.mobileNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mobileNumber'],
        message: 'Provide at least a mobile number or an email address.',
      });
    }
  });

export const adminRegisterSchema = baseUserSchema
  .extend({
    adminSecret: z.string().trim().optional(),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    rejectSensitiveFields(data, ctx);
    if (!data.email && !data.mobileNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Admin registration requires an email address or mobile number.',
      });
    }
  });

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(3, 'Email or mobile number is required.').optional(),
    email: z.string().trim().optional(),
    mobileNumber: z.string().trim().optional(),
    password: z.string().min(1, 'Password is required.'),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    rejectSensitiveFields(data, ctx);
    if (!data.identifier && !data.email && !data.mobileNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['identifier'],
        message: 'Provide an email address or mobile number to log in.',
      });
    }
  });

export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type VendorRegisterInput = z.infer<typeof vendorRegisterSchema>;
export type AdminRegisterInput = z.infer<typeof adminRegisterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
