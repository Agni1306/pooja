import type { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../utils/appError.ts';
import { type JwtPayload, verifyAuthToken } from '../utils/jwt.ts';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  // Fallback to cookie header if set
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    for (const entry of cookies) {
      const [key, ...rest] = entry.trim().split('=');
      if (key === 'digithela_token') {
        const value = rest.join('=').trim();
        if (value) return decodeURIComponent(value);
      }
    }
  }

  return null;
}

export function authenticateJWT(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    return next(
      new AppError('Authentication required. Please provide a valid Bearer token.', 401, 'UNAUTHORIZED')
    );
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = payload;
    next();
  } catch {
    next(
      new AppError('Invalid or expired authentication token.', 401, 'INVALID_TOKEN')
    );
  }
}

export function optionalAuthenticateJWT(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    req.user = verifyAuthToken(token);
  } catch {
    // Ignore invalid optional token for public browse routes
  }
  next();
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new AppError('Authentication required.', 401, 'UNAUTHORIZED')
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Requires one of roles: ${allowedRoles.join(', ')}.`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}
