import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
