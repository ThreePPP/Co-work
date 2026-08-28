import { Response } from 'express';

export class ApiError extends Error {
  statusCode: number;
  errors?: any;

  constructor(statusCode: number, message: string, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message = 'Bad Request', errors?: any) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized', errors?: any) {
    return new ApiError(401, message, errors);
  }

  static forbidden(message = 'Forbidden', errors?: any) {
    return new ApiError(403, message, errors);
  }

  static notFound(message = 'Resource Not Found', errors?: any) {
    return new ApiError(404, message, errors);
  }

  static internal(message = 'Internal Server Error', errors?: any) {
    return new ApiError(500, message, errors);
  }
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T
) => {
  return res.status(statusCode).json({
    success,
    message,
    data: data !== undefined ? data : null,
  });
};

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message = 'Success',
  statusCode = 200
) => {
  return sendResponse(res, statusCode, true, message, data);
};

export const sendCreated = <T>(
  res: Response,
  data?: T,
  message = 'Created successfully'
) => {
  return sendResponse(res, 201, true, message, data);
};
