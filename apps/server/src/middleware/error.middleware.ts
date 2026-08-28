import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError, sendResponse } from '../utils/apiResponse.js';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Handle custom ApiError
  if (err instanceof ApiError) {
    return sendResponse(res, err.statusCode, false, err.message, err.errors);
  }

  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendResponse(
      res,
      400,
      false,
      'Validation Error',
      formattedErrors
    );
  }

  // Handle Prisma Known Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return sendResponse(
        res,
        409,
        false,
        'A record with this information already exists',
        err.meta
      );
    }
    if (err.code === 'P2025') {
      return sendResponse(res, 404, false, 'Record not found in database');
    }
  }

  // Multer Errors
  if (err.name === 'MulterError') {
    return sendResponse(res, 400, false, `File upload error: ${err.message}`);
  }

  // General unhandled internal errors
  console.error('[UNHANDLED ERROR]:', err);
  return sendResponse(
    res,
    500,
    false,
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error'
  );
};
