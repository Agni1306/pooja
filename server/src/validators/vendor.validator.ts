import { z } from 'zod';
import { mobileNumberSchema } from './auth.validator.ts';

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

export const registerVendorEndpointSchema = z
  .object({
    // Optional account fields (required when registering unauthenticated)
    name: z.string().trim().min(2, 'Owner name must be at least 2 characters.').max(100).optional(),
    ownerName: z.string().trim().min(2, 'Owner name must be at least 2 characters.').max(100).optional(),
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
      .max(128)
      .optional(),

    // Required VendorProfile fields
    businessName: z.string().trim().min(2, 'Business name is required.').max(140),
    category: z.string().trim().min(2, 'Business category is required.').max(80),
    description: z
      .string()
      .trim()
      .min(10, 'Business description must be at least 10 characters.')
      .max(1500),
    address: z.string().trim().min(5, 'Business address is required.').max(250),
    area: z.string().trim().min(2, 'Area is required.').max(80),
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
    profileImage: z.string().trim().max(500).optional(),
    coverImage: z.string().trim().max(500).optional(),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    rejectSensitiveFields(data, ctx);
  });

export const updateMyVendorProfileSchema = z
  .object({
    businessName: z.string().trim().min(2, 'Business name must be at least 2 characters.').max(140).optional(),
    category: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().min(10, 'Description must be at least 10 characters.').max(1500).optional(),
    address: z.string().trim().min(5, 'Address must be at least 5 characters.').max(250).optional(),
    area: z.string().trim().min(2).max(80).optional(),
    city: z.string().trim().min(2).max(80).optional(),
    openingTime: z.string().trim().min(2).max(40).optional(),
    closingTime: z.string().trim().min(2).max(40).optional(),
    contactNumber: mobileNumberSchema.optional(),
    upiId: z
      .string()
      .trim()
      .refine((val) => !val || val.includes('@'), {
        message: 'UPI ID must include "@" (for example: myshop.demo@upi).',
      })
      .nullable()
      .optional()
      .or(z.literal('').transform(() => null)),
    profileImage: z.string().trim().max(500).nullable().optional(),
    coverImage: z.string().trim().max(500).nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    rejectSensitiveFields(data as Record<string, unknown>, ctx);
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one profile field to update.',
      });
    }
  });

export const vendorListQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  area: z.string().trim().optional(),
  city: z.string().trim().optional(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  sort: z
    .enum(['name-asc', 'name-desc', 'category', 'newest'])
    .default('name-asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type RegisterVendorEndpointInput = z.infer<typeof registerVendorEndpointSchema>;
export type UpdateMyVendorProfileInput = z.infer<typeof updateMyVendorProfileSchema>;
export type VendorListQueryInput = z.infer<typeof vendorListQuerySchema>;
