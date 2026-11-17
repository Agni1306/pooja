import { z } from 'zod';

export const addFavoriteSchema = z.object({
  vendorId: z.string().trim().min(1, 'vendorId is required.'),
});

export const favoritesListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;
export type FavoritesListQueryInput = z.infer<typeof favoritesListQuerySchema>;
