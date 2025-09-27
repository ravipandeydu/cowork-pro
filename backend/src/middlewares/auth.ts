import { Request, Response, NextFunction } from 'express';
import { User } from '@/models/user.model';
import { 
  verifyToken, 
  extractTokenFromHeader, 
  isTokenBlacklisted 
} from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/appError';
import { HttpStatusCode } from '@/types/error.types';
import { 
  IAuthenticatedRequest, 
  IAuthMiddlewareOptions,
  IJWTPayload 
} from '@/types/auth.types';
import { asyncHandler } from '@/middlewares/errorHandler';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string | null;
      validatedBody?: any;
      validatedQuery?: any;
      validatedParams?: any;
      resource?: any;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
export const authenticate = (options: IAuthMiddlewareOptions = {}) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { required = true, skipExpiredCheck = false } = options;

    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      const token = extractTokenFromHeader(authHeader);

      // If no token and authentication is not required, continue
      if (!token && !required) {
        return next();
      }

      // If no token and authentication is required, throw error
      if (!token && required) {
        throw new AppError('Access token is required', HttpStatusCode.UNAUTHORIZED);
      }

      // Verify token
      const verificationResult = verifyToken(token!, 'access');

      if (!verificationResult.valid) {
        // If token is expired and we're skipping expired check, continue
        if (verificationResult.error?.includes('expired') && skipExpiredCheck) {
          return next();
        }

        throw new AppError(
          verificationResult.error || 'Invalid token',
          HttpStatusCode.UNAUTHORIZED
        );
      }

      const payload = verificationResult.payload as IJWTPayload;

      // Find user in database
      const user = await User.findById(payload.userId)
        .select('+refreshTokens') // Include refresh tokens for validation
        .exec();

      if (!user) {
        throw new AppError('User not found', HttpStatusCode.UNAUTHORIZED);
      }

      // Check if user account is active
      if (!user.isActive) {
        throw new AppError('Account is deactivated', HttpStatusCode.UNAUTHORIZED);
      }

      // Check if user is verified (if email verification is required)
      if (!user.isEmailVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
        throw new AppError('Email verification required', HttpStatusCode.UNAUTHORIZED);
      }

      // Attach user and token to request
      req.user = user;
      req.token = token;

      // Log successful authentication
      logger.logAuth('User authenticated successfully', {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      next();
    } catch (error) {
      // Log authentication failure
      logger.logAuth('Authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });

      next(error);
    }
  });
};

/**
 * Authorization middleware - checks user roles and permissions
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', HttpStatusCode.UNAUTHORIZED);
      }

      // If no roles specified, just check if user is authenticated
      if (roles.length === 0) {
        return next();
      }

      // Check if user has required role
      if (!roles.includes(req.user.role)) {
        logger.logAuth('Authorization failed - insufficient permissions', {
          userId: req.user._id.toString(),
          userRole: req.user.role,
          requiredRoles: roles,
          path: req.path,
          method: req.method,
        });

        throw new AppError(
          'Insufficient permissions',
          HttpStatusCode.FORBIDDEN
        );
      }

      // Log successful authorization
      logger.logAuth('User authorized successfully', {
        userId: req.user._id.toString(),
        role: req.user.role,
        requiredRoles: roles,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional authentication middleware - doesn't throw error if no token
 */
export const optionalAuth = authenticate({ required: false });

/**
 * Admin only middleware
 */
export const adminOnly = [
  authenticate(),
  authorize('admin'),
];

/**
 * User or Admin middleware
 */
export const userOrAdmin = [
  authenticate(),
  authorize('user', 'admin'),
];

/**
 * Self or Admin middleware - allows users to access their own resources or admins to access any
 */
export const selfOrAdmin = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', HttpStatusCode.UNAUTHORIZED);
      }

      const requestedUserId = req.params[userIdParam];
      const currentUserId = req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      // Allow if user is admin or accessing their own resource
      if (isAdmin || currentUserId === requestedUserId) {
        return next();
      }

      logger.logAuth('Authorization failed - not self or admin', {
        userId: currentUserId,
        requestedUserId,
        userRole: req.user.role,
        path: req.path,
        method: req.method,
      });

      throw new AppError(
        'You can only access your own resources',
        HttpStatusCode.FORBIDDEN
      );
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limiting for authentication endpoints
 */
export const authRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  // This would typically use Redis or a more sophisticated rate limiting solution
  // For now, we'll use the rate limiting middleware from security.ts
  next();
};

/**
 * Refresh token validation middleware
 */
export const validateRefreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', HttpStatusCode.BAD_REQUEST);
      }

      // Verify refresh token
      const verificationResult = verifyToken(refreshToken, 'refresh');

      if (!verificationResult.valid) {
        throw new AppError(
          verificationResult.error || 'Invalid refresh token',
          HttpStatusCode.UNAUTHORIZED
        );
      }

      const payload = verificationResult.payload as IJWTPayload;

      // Find user and check if refresh token exists
      const user = await User.findById(payload.userId)
        .select('+refreshTokens')
        .exec();

      if (!user) {
        throw new AppError('User not found', HttpStatusCode.UNAUTHORIZED);
      }

      // Check if refresh token exists in user's refresh tokens
      const hasValidRefreshToken = user.refreshTokens.some(
        (token) => token.token === refreshToken && token.expiresAt > new Date()
      );

      if (!hasValidRefreshToken) {
        throw new AppError('Invalid or expired refresh token', HttpStatusCode.UNAUTHORIZED);
      }

      // Check if user account is active
      if (!user.isActive) {
        throw new AppError('Account is deactivated', HttpStatusCode.UNAUTHORIZED);
      }

      // Attach user and refresh token to request
      req.user = user;
      req.token = refreshToken;

      next();
    } catch (error) {
      logger.logAuth('Refresh token validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      next(error);
    }
  }
);

/**
 * Check if user owns resource middleware
 */
export const checkResourceOwnership = (
  resourceModel: any,
  resourceIdParam: string = 'id',
  ownerField: string = 'userId'
) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', HttpStatusCode.UNAUTHORIZED);
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      // Admin can access any resource
      if (isAdmin) {
        return next();
      }

      // Find resource and check ownership
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        throw new AppError('Resource not found', HttpStatusCode.NOT_FOUND);
      }

      // Check if user owns the resource
      const resourceOwnerId = resource[ownerField]?.toString();
      
      if (resourceOwnerId !== userId) {
        logger.logAuth('Resource access denied - not owner', {
          userId,
          resourceId,
          resourceOwnerId,
          resourceType: resourceModel.modelName,
        });

        throw new AppError(
          'You do not have permission to access this resource',
          HttpStatusCode.FORBIDDEN
        );
      }

      // Attach resource to request for use in controller
      req.resource = resource;

      next();
    } catch (error) {
      next(error);
    }
  });
};

/**
 * API key authentication middleware (for API access)
 */
export const authenticateApiKey = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiKey = req.headers['x-api-key'] as string;

      if (!apiKey) {
        throw new AppError('API key is required', HttpStatusCode.UNAUTHORIZED);
      }

      // In production, validate API key against database
      // For now, we'll use a simple check
      if (apiKey !== process.env.API_KEY) {
        throw new AppError('Invalid API key', HttpStatusCode.UNAUTHORIZED);
      }

      // Log API key usage
      logger.logAuth('API key authenticated', {
        apiKey: apiKey.substring(0, 8) + '...',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      logger.logAuth('API key authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      next(error);
    }
  }
);