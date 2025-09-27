import { 
  IAppError, 
  HttpStatusCode, 
  ErrorCategory, 
  ErrorCode, 
  ErrorSeverity,
  IErrorContext 
} from '@/types/error.types';

export class AppError extends Error implements IAppError {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;
  public readonly category: ErrorCategory;
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context: IErrorContext | undefined;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
    category: ErrorCategory = ErrorCategory.INTERNAL,
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: IErrorContext,
    isOperational: boolean = true
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.category = category;
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Static factory methods for common errors
  static badRequest(
    message: string = 'Bad Request',
    code: ErrorCode = ErrorCode.INVALID_INPUT,
    context?: IErrorContext
  ): AppError {
    return new AppError(
      message,
      HttpStatusCode.BAD_REQUEST,
      ErrorCategory.VALIDATION,
      code,
      ErrorSeverity.LOW,
      context
    );
  }

  static unauthorized(
    message: string = 'Unauthorized',
    code: ErrorCode = ErrorCode.INVALID_CREDENTIALS,
    context?: IErrorContext
  ): AppError {
    return new AppError(
      message,
      HttpStatusCode.UNAUTHORIZED,
      ErrorCategory.AUTHENTICATION,
      code,
      ErrorSeverity.MEDIUM,
      context
    );
  }

  static forbidden(
    message: string = 'Forbidden',
    code: ErrorCode = ErrorCode.INSUFFICIENT_PERMISSIONS,
    context?: IErrorContext
  ): AppError {
    return new AppError(
      message,
      HttpStatusCode.FORBIDDEN,
      ErrorCategory.AUTHORIZATION,
      code,
      ErrorSeverity.MEDIUM,
      context
    );
  }

  static notFound(
    message: string = 'Resource not found',
    code: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND,
    context?: IErrorContext
  ): AppError {
    return new AppError(
      message,
      HttpStatusCode.NOT_FOUND,
      ErrorCategory.NOT_FOUND,
      code,
      ErrorSeverity.LOW,
      context
    );
  }

  static conflict(
    message: string = 'Resource conflict',
    code: ErrorCode = ErrorCode.RESOURCE_CONFLICT,
    context?: IErrorContext
  ): AppError {
    return new AppError(
      message,
      HttpStatusCode.CONFLICT,
      ErrorCategory.CONFLICT,
      code,
      ErrorSeverity.MEDIUM,
      context
    );
  }

  static unprocessableEntity(
    message: string = 'Validation failed',
    code: ErrorCode = ErrorCode.VALIDATION_FAILED,
    context?: IErrorContext
  ): AppError {
    return new AppError(
      message,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      ErrorCategory.VALIDATION,
      code,
      ErrorSeverity.LOW,
      context
    );
  }

  static tooManyRequests(
    message: string = 'Too many requests',
    code: ErrorCode = ErrorCode.RATE_LIMIT_EXCEEDED,
    context?: IErrorContext
  ): AppError {
    return new AppError(
      message,
      HttpStatusCode.TOO_MANY_REQUESTS,
      ErrorCategory.RATE_LIMIT,
      code,
      ErrorSeverity.MEDIUM,
      context
    );
  }

  static internalServerError(
    message: string = 'Internal server error',
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    context?: IErrorContext
  ): AppError {
    return new AppError(
      message,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      ErrorCategory.INTERNAL,
      code,
      ErrorSeverity.HIGH,
      context
    );
  }

  static databaseError(
    message: string = 'Database operation failed',
    code: ErrorCode = ErrorCode.DATABASE_OPERATION_ERROR,
    context?: IErrorContext
  ): AppError {
    return new AppError(
      message,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      ErrorCategory.DATABASE,
      code,
      ErrorSeverity.HIGH,
      context
    );
  }

  static externalServiceError(
    message: string = 'External service error',
    code: ErrorCode = ErrorCode.EXTERNAL_SERVICE_ERROR,
    context?: IErrorContext
  ): AppError {
    return new AppError(
      message,
      HttpStatusCode.BAD_GATEWAY,
      ErrorCategory.EXTERNAL_SERVICE,
      code,
      ErrorSeverity.MEDIUM,
      context
    );
  }

  // Authentication specific errors
  static invalidToken(
    message: string = 'Invalid token',
    context?: IErrorContext
  ): AppError {
    return new AppError(
      message,
      HttpStatusCode.UNAUTHORIZED,
      ErrorCategory.AUTHENTICATION,
      ErrorCode.TOKEN_INVALID,
      ErrorSeverity.MEDIUM,
      context
    );
  }

  static expiredToken(
    message: string = 'Token has expired',
    context?: IErrorContext
  ): AppError {
    return new AppError(
      message,
      HttpStatusCode.UNAUTHORIZED,
      ErrorCategory.AUTHENTICATION,
      ErrorCode.TOKEN_EXPIRED,
      ErrorSeverity.LOW,
      context
    );
  }

  static missingToken(
    message: string = 'Token is required',
    context?: IErrorContext
  ): AppError {
    return new AppError(
      message,
      HttpStatusCode.UNAUTHORIZED,
      ErrorCategory.AUTHENTICATION,
      ErrorCode.TOKEN_MISSING,
      ErrorSeverity.LOW,
      context
    );
  }

  // Validation specific errors
  static validationError(
    message: string = 'Validation failed',
    errors?: any[],
    context?: IErrorContext
  ): AppError {
    const error = new AppError(
      message,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      ErrorCategory.VALIDATION,
      ErrorCode.VALIDATION_FAILED,
      ErrorSeverity.LOW,
      context
    );
    
    if (errors) {
      (error as any).errors = errors;
    }
    
    return error;
  }

  // Resource specific errors
  static duplicateResource(
    message: string = 'Resource already exists',
    context?: IErrorContext
  ): AppError {
    return new AppError(
      message,
      HttpStatusCode.CONFLICT,
      ErrorCategory.CONFLICT,
      ErrorCode.RESOURCE_ALREADY_EXISTS,
      ErrorSeverity.LOW,
      context
    );
  }

  // Method to convert error to JSON
  toJSON(): any {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      status: this.status,
      category: this.category,
      code: this.code,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      ...(this.context && { context: this.context }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }

  // Method to check if error should be logged
  shouldLog(): boolean {
    return this.severity === ErrorSeverity.HIGH || 
           this.severity === ErrorSeverity.CRITICAL ||
           this.statusCode >= 500;
  }

  // Method to check if error should be reported to external service
  shouldReport(): boolean {
    return this.severity === ErrorSeverity.CRITICAL ||
           (this.statusCode >= 500 && this.isOperational === false);
  }
}