import { Document } from 'mongoose';
import { IUser } from '@/models/user.model';

// JWT Payload interface
export interface IJWTPayload {
  userId: string;
  email: string;
  role: string;
  tokenType: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// Token pair interface
export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// Login request interface
export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Register request interface
export interface IRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: 'user' | 'admin';
}

// Change password request interface
export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Reset password request interface
export interface IResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Forgot password request interface
export interface IForgotPasswordRequest {
  email: string;
}

// Refresh token request interface
export interface IRefreshTokenRequest {
  refreshToken: string;
}

// Auth response interface
export interface IAuthResponse {
  success: boolean;
  message: string;
  data: {
    user: Partial<IUser>;
    tokens: ITokenPair;
  };
}

// User profile response interface
export interface IUserProfileResponse {
  success: boolean;
  data: {
    user: Partial<IUser>;
  };
}

// Logout response interface
export interface ILogoutResponse {
  success: boolean;
  message: string;
}

// Password reset response interface
export interface IPasswordResetResponse {
  success: boolean;
  message: string;
}

// Authenticated request interface (extends Express Request)
export interface IAuthenticatedRequest extends Request {
  user?: IUser & Document;
  token?: string;
  validatedBody?: any;
  validatedQuery?: any;
  validatedParams?: any;
  cookies?: any;
}

// JWT verification result interface
export interface IJWTVerificationResult {
  valid: boolean;
  payload?: IJWTPayload;
  error?: string;
}

// Token blacklist interface
export interface ITokenBlacklist {
  token: string;
  userId: string;
  tokenType: 'access' | 'refresh';
  blacklistedAt: Date;
  expiresAt: Date;
}

// Password validation result interface
export interface IPasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number;
}

// Account verification interface
export interface IAccountVerification {
  userId: string;
  token: string;
  type: 'email' | 'phone';
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

// Session interface
export interface ISession {
  userId: string;
  sessionId: string;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  isActive: boolean;
  lastActivity: Date;
  expiresAt: Date;
}

// Auth middleware options interface
export interface IAuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
  permissions?: string[];
  skipExpiredCheck?: boolean;
}

// Rate limiting for auth endpoints
export interface IAuthRateLimit {
  windowMs: number;
  maxAttempts: number;
  blockDuration: number;
  skipSuccessfulRequests?: boolean;
}

// OAuth provider interface
export interface IOAuthProvider {
  provider: 'google' | 'facebook' | 'github' | 'linkedin';
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
}

// Two-factor authentication interface
export interface ITwoFactorAuth {
  userId: string;
  secret: string;
  backupCodes: string[];
  isEnabled: boolean;
  lastUsed?: Date;
}

// Login attempt interface
export interface ILoginAttempt {
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
  failureReason?: string;
}

// Account lockout interface
export interface IAccountLockout {
  userId: string;
  lockedAt: Date;
  lockoutReason: string;
  unlockAt?: Date;
  attempts: number;
}

// API key interface
export interface IAPIKey {
  keyId: string;
  userId: string;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  lastUsed?: Date;
  expiresAt?: Date;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

// Auth event types
export type AuthEventType = 
  | 'login'
  | 'logout'
  | 'register'
  | 'password_change'
  | 'password_reset'
  | 'token_refresh'
  | 'account_locked'
  | 'account_unlocked'
  | 'email_verified'
  | 'two_factor_enabled'
  | 'two_factor_disabled';

// Auth event interface
export interface IAuthEvent {
  userId: string;
  eventType: AuthEventType;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Permission interface
export interface IPermission {
  name: string;
  description: string;
  resource: string;
  action: string;
}

// Role interface
export interface IRole {
  name: string;
  description: string;
  permissions: IPermission[];
  isDefault: boolean;
}

// User role assignment interface
export interface IUserRole {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
}