import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import * as productService from '../services/product.service.ts';
import {
  createProductSchema,
  productListQuerySchema,
  updateProductAvailabilitySchema,
  updateProductSchema,
} from '../validators/product.validator.ts';
import { AppError } from '../utils/appError.ts';

export async function createProductController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const uploadedImagePath = req.file ? `/uploads/${req.file.filename}` : undefined;
    const validated = createProductSchema.parse({
      ...req.body,
      ...(uploadedImagePath ? { image: uploadedImagePath } : {}),
    });

    const product = await productService.createProduct(
      req.user!.userId,
      validated
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

export async function listProductsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = productListQuerySchema.parse(req.query);
    const result = await productService.listProducts(query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductByIdController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = String(req.params.id || '');
    const product = await productService.getProductById(productId);
    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

export async function listVendorProductsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vendorId = String(req.params.vendorId || '');
    const query = productListQuerySchema.parse(req.query);
    const result = await productService.listProductsByVendor(vendorId, query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProductController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = String(req.params.id || '');
    const uploadedImagePath = req.file ? `/uploads/${req.file.filename}` : undefined;
    const payload = {
      ...req.body,
      ...(uploadedImagePath ? { image: uploadedImagePath } : {}),
    };

    const validated = updateProductSchema.parse(payload);
    if (Object.keys(validated).length === 0) {
      throw new AppError(
        'Provide at least one product field or image to update.',
        400,
        'VALIDATION_ERROR'
      );
    }

    const product = await productService.updateProduct(
      req.user!.userId,
      productId,
      validated
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProductAvailabilityController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = String(req.params.id || '');
    const { availability } = updateProductAvailabilitySchema.parse(req.body);

    const product = await productService.updateProductAvailability(
      req.user!.userId,
      productId,
      availability
    );

    res.status(200).json({
      success: true,
      message: `Product marked as ${availability ? 'available' : 'unavailable'}.`,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProductController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const productId = String(req.params.id || '');
    const result = await productService.deleteProduct(
      req.user!.userId,
      productId
    );

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
