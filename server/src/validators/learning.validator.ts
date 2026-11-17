import { z } from 'zod';

export const learningListQuerySchema = z.object({
  category: z.string().trim().optional(),
  difficultyLevel: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const updateLearningProgressSchema = z.object({
  isCompleted: z.boolean(),
});

export const createLearningMaterialSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, 'Slug must be at least 3 characters.')
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens.'),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(1500),
  content: z.string().trim().min(10),
  category: z.string().trim().min(2).max(80),
  difficultyLevel: z.string().trim().min(2).max(60),
  estimatedReadingTime: z.string().trim().min(2).max(40),
  image: z.string().trim().max(500).optional().nullable(),
});

export type LearningListQueryInput = z.infer<typeof learningListQuerySchema>;
export type UpdateLearningProgressInput = z.infer<typeof updateLearningProgressSchema>;
export type CreateLearningMaterialInput = z.infer<typeof createLearningMaterialSchema>;
