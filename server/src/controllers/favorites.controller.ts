import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import * as favoritesService from '../services/favorites.service.ts';
import {
  addFavoriteSchema,
  favoritesListQuerySchema,
} from '../validators/favorites.validator.ts';

export async function listMyFavoritesController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = favoritesListQuerySchema.parse(req.query);
    const result = await favoritesService.listMyFavorites(req.user!.userId, query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function addVendorFavoriteByBodyController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { vendorId } = addFavoriteSchema.parse(req.body);
    const result = await favoritesService.addVendorFavorite(
      req.user!.userId,
      vendorId
    );
    res.status(result.alreadyFavorited ? 200 : 201).json({
      success: true,
      message: result.alreadyFavorited
        ? 'Vendor is already in your favorites.'
        : 'Vendor added to favorites.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function addVendorFavoriteController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vendorId = String(req.params.vendorId || '');
    const result = await favoritesService.addVendorFavorite(
      req.user!.userId,
      vendorId
    );
    res.status(result.alreadyFavorited ? 200 : 201).json({
      success: true,
      message: result.alreadyFavorited
        ? 'Vendor is already in your favorites.'
        : 'Vendor added to favorites.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeVendorFavoriteController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vendorId = String(req.params.vendorId || '');
    const result = await favoritesService.removeVendorFavorite(
      req.user!.userId,
      vendorId
    );
    res.status(200).json({
      success: true,
      message: 'Vendor removed from favorites.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleVendorFavoriteController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vendorId = String(req.params.vendorId || '');
    const result = await favoritesService.toggleVendorFavorite(
      req.user!.userId,
      vendorId
    );
    res.status(200).json({
      success: true,
      message: result.isFavorited
        ? 'Vendor added to favorites.'
        : 'Vendor removed from favorites.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVendorFavoriteStatusController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vendorId = String(req.params.vendorId || '');
    const result = await favoritesService.getVendorFavoriteStatus(
      req.user!.userId,
      vendorId
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
