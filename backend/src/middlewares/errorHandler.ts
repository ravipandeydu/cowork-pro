import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { AppError } from '@/utils/appError';
import { logger, logError, logSecurityEvent } from '@/utils/logger';
import { 
  IErrorResponse, 
  IValidationError, 
  IErrorContext,
  HttpStatusCode, 
  ErrorCode,
  ErrorCategory,
  ErrorSeverity 
} from '@/types/error.types';
import { env, isDevelopment } from '@/config/env';

// Handle Mongoose validation errors
const handleValidationError = (error: mongoose.Error.ValidationError): AppError => {
  const errors: IValidationError[] = Object.values(error.errors).map(err => ({
    field: err.path,
    message: err.message,
    value: (err as any).value,
  }));

  const message = 'Validation failed';
  const appError = AppError.validationError(message, errors);
  (appError as any).errors = errors;
  
  return appError;
};

// Handle Mongoose cast errors (invalid ObjectId, etc.)
const handleCastError = (error: mongoose.Error.CastError): AppError => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return AppError.badRequest(message, ErrorCode.INVALID_INPUT);
};

// Handle Mongoose duplicate key errors
const handleDuplicateKeyError = (error: any): AppError => {
  const keyValue = error.keyValue || {};
  const field = Object.keys(keyValue)[0];
  const value = field ? keyValue[field] : 'unknown';
  const message = `${field || 'field'} '${value}' already exists`;
  
  return AppError.conflict(message, ErrorCode.DUPLICATE_KEY_ERROR);
};

// Handle JWT errors
const handleJWTError = (error: JsonWebTokenError | TokenExpiredError | NotBeforeError): AppError => {
  if (error instanceof TokenExpiredError) {
    return AppError.expiredToken('Your token has expired. Please log in again.');
  }
  
  if (error instanceof NotBeforeError) {
    return AppError.invalidToken('Token not active yet.');
  }
  
  // JsonWebTokenError and other JWT errors
  return AppError.invalidToken('Invalid token. Please log in again.');
};

// Handle Zod validation errors
const handleZodError = (error: ZodError): AppError => {
  const errors: IValidationError[] = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    value: err.code === 'invalid_type' ? `Expected ${err.expected}, received ${err.received}` : undefined,
  }));

  const message = 'Validation failed';
  const appError = AppError.validationError(message, errors);
  (appError as any).errors = errors;
  
  return appError;
};

// Handle multer errors (file upload)
const handleMulterError = (error: any): AppError => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return AppError.badRequest('File too large', ErrorCode.FILE_TOO_LARGE);
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return AppError.badRequest('Too many files');
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return AppError.badRequest('Unexpected file field');
  }
  
  return AppError.badRequest('File upload error');
};

// Convert operational errors to AppError
const handleOperationalError = (error: any): AppError => {
  // MongoDB connection errors
  if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
    return AppError.databaseError('Database connection failed', ErrorCode.DATABASE_CONNECTION_ERROR);
  }
  
  // Rate limiting errors
  if (error.type === 'entity.too.large') {
    return AppError.badRequest('Request entity too large');
  }
  
  // Default to internal server error for unknown operational errors
  return AppError.internalServerError('Something went wrong');
};

// Create error response object
const createErrorResponse = (error: AppError, req: Request): IErrorResponse => {
  return {
    status: error.status,
    message: error.message,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.url,
    method: req.method,
    ...(isDevelopment() && { stack: error.stack }),
    ...((error as any).errors && { errors: (error as any).errors }),
  };
};

// Log error with appropriate level and context
const logErrorWithContext = (error: AppError, req: Request): void => {
  const context = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    body: req.method !== 'GET' ? req.body : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    params: Object.keys(req.params).length > 0 ? req.params : undefined,
  };

  // Log security events for authentication/authorization errors
  if (error.category === ErrorCategory.AUTHENTICATION || 
      error.category === ErrorCategory.AUTHORIZATION) {
    logSecurityEvent(
      `${error.category}: ${error.message}`,
      error.severity as any,
      context
    );
  }

  // Log error based on severity
  if (error.shouldLog()) {
    logError(error.message, error, context);
  } else if (error.statusCode >= 400 && error.statusCode < 500) {
    logger.warn(error.message, { ...context, error: error.toJSON() });
  }
};

// Main error handling middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Convert different error types to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof mongoose.Error.ValidationError) {
    appError = handleValidationError(error);
  } else if (error instanceof mongoose.Error.CastError) {
    appError = handleCastError(error);
  } else if (error.code === 11000) {
    appError = handleDuplicateKeyError(error);
  } else if (error instanceof ZodError) {
    appError = handleZodError(error);
  } else if (error instanceof JsonWebTokenError || 
             error instanceof TokenExpiredError || 
             error instanceof NotBeforeError) {
    appError = handleJWTError(error);
  } else if (error.name === 'MulterError') {
    appError = handleMulterError(error);
  } else if (error.isOperational) {
    appError = handleOperationalError(error);
  } else {
    // Programming errors or unknown errors
    appError = new AppError(
      isDevelopment() ? error.message : 'Something went wrong',
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      ErrorCategory.INTERNAL,
      ErrorCode.INTERNAL_SERVER_ERROR,
      ErrorSeverity.HIGH,
      undefined,
      false // Not operational
    );
  }

  // Log error with context
  logErrorWithContext(appError, req);

  // Create and send error response
  const errorResponse = createErrorResponse(appError, req);
  
  res.status(appError.statusCode).json(errorResponse);
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const context: IErrorContext = {
    method: req.method,
    url: req.originalUrl,
  };
  
  if (req.ip) {
    context.ip = req.ip;
  }
  
  const error = AppError.notFound(
    `Route ${req.method} ${req.originalUrl} not found`,
    ErrorCode.RESOURCE_NOT_FOUND,
    context
  );
  
  next(error);
};

// Async error wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global unhandled promise rejection handler
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
  });
  
  // Gracefully close the server
  process.exit(1);
});

// Global uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });
  
  // Gracefully close the server
  process.exit(1);
});