import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import { 
  IJWTPayload, 
  ITokenPair, 
  IJWTVerificationResult,
  ITokenBlacklist 
} from '@/types/auth.types';
import { AppError } from '@/utils/appError';
import { HttpStatusCode } from '@/types/error.types';

// In-memory token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set<string>();

// Token expiration times
const TOKEN_EXPIRY = {
  ACCESS_TOKEN: env.JWT_ACCESS_EXPIRES_IN || '15m',
  REFRESH_TOKEN: env.JWT_REFRESH_EXPIRES_IN || '7d',
  RESET_TOKEN: '1h',
  VERIFICATION_TOKEN: '24h',
} as const;

/**
 * Generate JWT access token
 */
export const generateAccessToken = (payload: Omit<IJWTPayload, 'tokenType' | 'iat' | 'exp'>): string => {
  try {
    const tokenPayload: IJWTPayload = {
      ...payload,
      tokenType: 'access',
    };

    const token = jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      algorithm: 'HS256',
    } as jwt.SignOptions);

    logger.logAuth('Access token generated', {
      userId: payload.userId,
      email: payload.email,
      expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
    });

    return token;
  } catch (error) {
    logger.logError('Failed to generate access token', error as Error, {
      userId: payload.userId,
      email: payload.email,
    });
    throw new AppError('Token generation failed', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (payload: Omit<IJWTPayload, 'tokenType' | 'iat' | 'exp'>): string => {
  try {
    const tokenPayload: IJWTPayload = {
      ...payload,
      tokenType: 'refresh',
    };

    const token = jwt.sign(tokenPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      algorithm: 'HS256',
    } as jwt.SignOptions);

    logger.logAuth('Refresh token generated', {
      userId: payload.userId,
      email: payload.email,
      expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN,
    });

    return token;
  } catch (error) {
    logger.logError('Failed to generate refresh token', error as Error, {
      userId: payload.userId,
      email: payload.email,
    });
    throw new AppError('Token generation failed', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (payload: Omit<IJWTPayload, 'tokenType' | 'iat' | 'exp'>): ITokenPair => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Calculate expiration time in seconds
  const expiresIn = getTokenExpirationTime(TOKEN_EXPIRY.ACCESS_TOKEN);

  return {
    accessToken,
    refreshToken,
    expiresIn,
    tokenType: 'Bearer',
  };
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string, tokenType: 'access' | 'refresh'): IJWTVerificationResult => {
  try {
    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      return {
        valid: false,
        error: 'Token has been revoked',
      };
    }

    const secret = tokenType === 'access' ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET;
    
    const decoded = jwt.verify(token, secret, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      algorithms: ['HS256'],
    }) as IJWTPayload;

    // Verify token type matches
    if (decoded.tokenType !== tokenType) {
      return {
        valid: false,
        error: 'Invalid token type',
      };
    }

    return {
      valid: true,
      payload: decoded,
    };
  } catch (error) {
    let errorMessage = 'Token verification failed';

    if (error instanceof jwt.JsonWebTokenError) {
      if (error.name === 'TokenExpiredError') {
        errorMessage = 'Token has expired';
      } else if (error.name === 'JsonWebTokenError') {
        errorMessage = 'Invalid token';
      } else if (error.name === 'NotBeforeError') {
        errorMessage = 'Token not active yet';
      }
    }

    logger.logAuth('Token verification failed', {
      error: errorMessage,
      tokenType,
    });

    return {
      valid: false,
      error: errorMessage,
    };
  }
};

/**
 * Decode JWT token without verification (for debugging)
 */
export const decodeToken = (token: string): IJWTPayload | null => {
  try {
    return jwt.decode(token) as IJWTPayload;
  } catch (error) {
    logger.logError('Failed to decode token', error as Error);
    return null;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
};

/**
 * Generate secure random token for password reset, email verification, etc.
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = (userId: string, email: string): string => {
  try {
    const payload = {
      userId,
      email,
      type: 'password_reset',
      timestamp: Date.now(),
    };

    const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: TOKEN_EXPIRY.RESET_TOKEN,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    } as jwt.SignOptions);

    logger.logAuth('Password reset token generated', {
      userId,
      email,
      expiresIn: TOKEN_EXPIRY.RESET_TOKEN,
    });

    return token;
  } catch (error) {
    logger.logError('Failed to generate password reset token', error as Error, {
      userId,
      email,
    });
    throw new AppError('Token generation failed', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Verify password reset token
 */
export const verifyPasswordResetToken = (token: string): { valid: boolean; payload?: any; error?: string } => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as any;

    if (decoded.type !== 'password_reset') {
      return {
        valid: false,
        error: 'Invalid token type',
      };
    }

    return {
      valid: true,
      payload: decoded,
    };
  } catch (error) {
    let errorMessage = 'Invalid or expired token';

    if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Reset token has expired';
    }

    return {
      valid: false,
      error: errorMessage,
    };
  }
};

/**
 * Generate email verification token
 */
export const generateEmailVerificationToken = (userId: string, email: string): string => {
  try {
    const payload = {
      userId,
      email,
      type: 'email_verification',
      timestamp: Date.now(),
    };

    const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: TOKEN_EXPIRY.VERIFICATION_TOKEN,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    } as jwt.SignOptions);

    logger.logAuth('Email verification token generated', {
      userId,
      email,
      expiresIn: TOKEN_EXPIRY.VERIFICATION_TOKEN,
    });

    return token;
  } catch (error) {
    logger.logError('Failed to generate email verification token', error as Error, {
      userId,
      email,
    });
    throw new AppError('Token generation failed', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Verify email verification token
 */
export const verifyEmailVerificationToken = (token: string): { valid: boolean; payload?: any; error?: string } => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as any;

    if (decoded.type !== 'email_verification') {
      return {
        valid: false,
        error: 'Invalid token type',
      };
    }

    return {
      valid: true,
      payload: decoded,
    };
  } catch (error) {
    let errorMessage = 'Invalid or expired token';

    if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Verification token has expired';
    }

    return {
      valid: false,
      error: errorMessage,
    };
  }
};

/**
 * Blacklist a token
 */
export const blacklistToken = (token: string, userId: string, tokenType: 'access' | 'refresh'): void => {
  try {
    tokenBlacklist.add(token);

    // In production, store in Redis or database with expiration
    const blacklistEntry: ITokenBlacklist = {
      token,
      userId,
      tokenType,
      blacklistedAt: new Date(),
      expiresAt: new Date(Date.now() + getTokenExpirationTime(
        tokenType === 'access' ? TOKEN_EXPIRY.ACCESS_TOKEN : TOKEN_EXPIRY.REFRESH_TOKEN
      ) * 1000),
    };

    logger.logAuth('Token blacklisted', {
      userId,
      tokenType,
      blacklistedAt: blacklistEntry.blacklistedAt,
    });
  } catch (error) {
    logger.logError('Failed to blacklist token', error as Error, {
      userId,
      tokenType,
    });
  }
};

/**
 * Check if token is blacklisted
 */
export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

/**
 * Clear expired tokens from blacklist (cleanup job)
 */
export const clearExpiredTokens = (): void => {
  // In production, this would be handled by Redis TTL or database cleanup job
  logger.logInfo('Token blacklist cleanup completed');
};

/**
 * Get token expiration time in seconds
 */
export const getTokenExpirationTime = (expiresIn: string): number => {
  const timeMap: Record<string, number> = {
    's': 1,
    'm': 60,
    'h': 3600,
    'd': 86400,
    'w': 604800,
  };

  const match = expiresIn.match(/^(\d+)([smhdw])$/);
  if (!match || match.length < 3) {
    throw new Error('Invalid expiration format');
  }

  const value = match[1];
  const unit = match[2];
  
  if (!unit || !value || !(unit in timeMap)) {
    throw new Error(`Invalid time unit: ${unit}`);
  }
  
  return parseInt(value) * (timeMap[unit] || 0);
};

/**
 * Get token remaining time in seconds
 */
export const getTokenRemainingTime = (token: string): number => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - now);
  } catch (error) {
    return 0;
  }
};

/**
 * Check if token is about to expire (within 5 minutes)
 */
export const isTokenExpiringSoon = (token: string, thresholdMinutes: number = 5): boolean => {
  const remainingTime = getTokenRemainingTime(token);
  return remainingTime > 0 && remainingTime <= (thresholdMinutes * 60);
};