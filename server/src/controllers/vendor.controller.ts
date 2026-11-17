import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import * as vendorService from '../services/vendor.service.ts';
import {
  registerVendorEndpointSchema,
  updateMyVendorProfileSchema,
  vendorListQuerySchema,
} from '../validators/vendor.validator.ts';
import { env } from '../config/env.ts';

export async function registerVendorProfileController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = registerVendorEndpointSchema.parse(req.body);
    const result = await vendorService.registerVendorWithProfile(
      validated,
      req.user
    );

    if ('token' in result && result.token) {
      res.cookie('digithela_token', result.token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.isProduction,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Vendor profile registered successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function listVendorsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = vendorListQuerySchema.parse(req.query);
    const result = await vendorService.listPublicVendors(query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVendorByIdController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vendorId = String(req.params.id || '');
    const vendor = await vendorService.getPublicVendorById(vendorId);
    res.status(200).json({
      success: true,
      data: { vendor },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyProfileController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vendor = await vendorService.getMyVendorProfile(req.user!.userId);
    res.status(200).json({
      success: true,
      data: { vendor },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfileController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = updateMyVendorProfileSchema.parse(req.body);
    const vendor = await vendorService.updateMyVendorProfile(
      req.user!.userId,
      validated
    );
    res.status(200).json({
      success: true,
      message: 'Vendor business profile updated successfully.',
      data: { vendor },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMyProfileController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await vendorService.deleteMyVendorProfile(req.user!.userId);
    res.status(200).json({
      success: true,
      message: 'Vendor business profile deleted successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
