import { z } from 'zod';

const availabilityFieldSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
  }
  return val;
}, z.boolean());

export const createProductSchema = z.object({
  productName: z
    .string()
    .trim()
    .min(2, 'Product name must be at least 2 characters.')
    .max(140),
  description: z
    .string()
    .trim()
    .min(4, 'Product description must be at least 4 characters.')
    .max(1500),
  category: z
    .string()
    .trim()
    .min(2, 'Product category is required.')
    .max(80),
  price: z.coerce
    .number()
    .finite('Price must be a valid number.')
    .positive('Price must be greater than ₹0.')
    .max(1000000, 'Price exceeds maximum allowed limit.'),
  unit: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .default('per piece'),
  image: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  availability: availabilityFieldSchema.optional().default(true),
});

export const updateProductSchema = z
  .object({
    productName: z.string().trim().min(2).max(140).optional(),
    description: z.string().trim().min(4).max(1500).optional(),
    category: z.string().trim().min(2).max(80).optional(),
    price: z.coerce
      .number()
      .finite()
      .positive('Price must be greater than ₹0.')
      .max(1000000)
      .optional(),
    unit: z.string().trim().min(1).max(40).optional(),
    image: z.string().trim().max(500).nullable().optional(),
    availability: availabilityFieldSchema.optional(),
  })
  .strict();

export const updateProductAvailabilitySchema = z.object({
  availability: availabilityFieldSchema,
});

export const productListQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  vendorId: z.string().trim().optional(),
  area: z.string().trim().optional(),
  availability: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  sort: z
    .enum(['newest', 'price-asc', 'price-desc', 'name-asc'])
    .default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQueryInput = z.infer<typeof productListQuerySchema>;
