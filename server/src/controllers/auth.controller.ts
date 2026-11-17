import type { NextFunction, Request, Response } from 'express';
import {
  adminRegisterSchema,
  customerRegisterSchema,
  loginSchema,
  vendorRegisterSchema,
} from '../validators/auth.validator.ts';
import * as authService from '../services/auth.service.ts';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import { env } from '../config/env.ts';

function setAuthCookie(res: Response, token: string): void {
  res.cookie('digithela_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function registerCustomerController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = customerRegisterSchema.parse(req.body);
    const result = await authService.registerCustomer(validated);
    setAuthCookie(res, result.token);
    res.status(201).json({
      success: true,
      message: 'Customer account registered successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function registerVendorController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = vendorRegisterSchema.parse(req.body);
    const result = await authService.registerVendor(validated);
    setAuthCookie(res, result.token);
    res.status(201).json({
      success: true,
      message: 'Vendor account registered successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function registerAdminController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = adminRegisterSchema.parse(req.body);
    const result = await authService.registerAdmin(validated);
    setAuthCookie(res, result.token);
    res.status(201).json({
      success: true,
      message: 'Admin account registered successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await authService.loginUser(validated);
    setAuthCookie(res, result.token);
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(
  _req: Request,
  res: Response
): Promise<void> {
  res.clearCookie('digithela_token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

export async function getMeController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const user = await authService.getUserProfileById(userId);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
