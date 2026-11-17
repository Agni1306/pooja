import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../utils/appError.ts';

export function apiNotFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
    },
  });
}

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof MulterError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message:
          err.code === 'LIMIT_FILE_SIZE'
            ? 'Uploaded image exceeds the 5MB size limit.'
            : err.message,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors = err.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: fieldErrors[0]?.message || 'Invalid request input.',
        details: fieldErrors,
      },
    });
    return;
  }

  // Handle Prisma known errors and connection errors safely without exposing credentials
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const prismaErr = err as { code?: string; message?: string };
    if (prismaErr.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_RECORD',
          message: 'An account with this email or mobile number already exists.',
        },
      });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Requested record was not found.',
        },
      });
      return;
    }
    if (
      prismaErr.code === 'ECONNREFUSED' ||
      prismaErr.code === 'ENOTFOUND' ||
      prismaErr.code === 'P1001' ||
      prismaErr.code === 'P1000'
    ) {
      res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'PostgreSQL database is unavailable. Verify DATABASE_URL and ensure PostgreSQL is running.',
        },
      });
      return;
    }
  }

  const message =
    err instanceof Error && /connect|ECONNREFUSED|DATABASE_URL|authentication failed/i.test(err.message)
      ? 'Database connection is not configured or unreachable.'
      : 'Internal server error.';

  const statusCode =
    err instanceof Error && /connect|ECONNREFUSED|DATABASE_URL/i.test(err.message) ? 503 : 500;

  if (process.env.NODE_ENV !== 'test') {
    console.error('[API Error]', err instanceof Error ? err.message : err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode === 503 ? 'DATABASE_UNAVAILABLE' : 'INTERNAL_ERROR',
      message,
    },
  });
}
