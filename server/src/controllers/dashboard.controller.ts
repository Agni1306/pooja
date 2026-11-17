import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import * as dashboardService from '../services/dashboard.service.ts';
import { dashboardQuerySchema } from '../validators/dashboard.validator.ts';

export async function getVendorDashboardController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = dashboardQuerySchema.parse(req.query);
    const dashboard = await dashboardService.getVendorDashboardStats(
      req.user!.userId,
      query
    );
    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
}
