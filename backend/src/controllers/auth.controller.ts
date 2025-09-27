import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/appError';
import { HttpStatusCode } from '@/types/error.types';
import { IAuthenticatedRequest, ILoginRequest, IRegisterRequest, IChangePasswordRequest } from '@/types/auth.types';
import { IUser } from '@/models/user.model';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.register(req.validatedBody || req.body as IRegisterRequest);
      
      res.status(HttpStatusCode.CREATED).json(result);
    } catch (error) {
      throw error; // Will be handled by global error handler
    }
  };

  /**
   * Login user
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.login(req.validatedBody || req.body as ILoginRequest);
      
      // Set refresh token as httpOnly cookie if provided
      if (result.data?.tokens?.refreshToken) {
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
          httpOnly: true,
          secure: isProduction, // Only send over HTTPS in production
          sameSite: isProduction ? 'strict' as const : 'lax' as const,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/api/auth/refresh', // Only send to refresh endpoint
        };
        
        res.cookie('refreshToken', result.data.tokens.refreshToken, cookieOptions);
      }

      res.status(HttpStatusCode.OK).json(result);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies?.refreshToken || (req.validatedBody || req.body as any)?.refreshToken;
      
      if (!refreshToken) {
        throw new AppError('Refresh token is required', HttpStatusCode.BAD_REQUEST);
      }

      const tokens = await this.authService.refreshToken({ refreshToken });
      
      // Update refresh token cookie
      if (tokens.refreshToken) {
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'strict' as const : 'lax' as const,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/api/auth/refresh',
        };
        
        res.cookie('refreshToken', tokens.refreshToken, cookieOptions);
      }

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens },
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?._id;
      const refreshToken = req.cookies?.refreshToken || (req.validatedBody || req.body as any)?.refreshToken;
      
      if (!userId) {
        throw new AppError('User not authenticated', HttpStatusCode.UNAUTHORIZED);
      }

      const result = await this.authService.logout(userId.toString(), req.token!);
      
      // Clear refresh token cookie
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

      res.status(HttpStatusCode.OK).json(result);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Logout from all devices
   * POST /api/auth/logout-all
   */
  logoutAll = async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        throw new AppError('User not authenticated', HttpStatusCode.UNAUTHORIZED);
      }

      const result = await this.authService.logoutAll(userId.toString());
      
      // Clear refresh token cookie
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

      res.status(HttpStatusCode.OK).json(result);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Change user password
   * POST /api/auth/change-password
   */
  changePassword = async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        throw new AppError('User not authenticated', HttpStatusCode.UNAUTHORIZED);
      }

      const changePasswordData: IChangePasswordRequest = req.validatedBody || req.body;
      const result = await this.authService.changePassword(userId.toString(), changePasswordData);
      
      // Clear refresh token cookie (user will need to log in again)
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

      res.status(HttpStatusCode.OK).json(result);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.forgotPassword(req.body);
      
      res.status(HttpStatusCode.OK).json(result);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.resetPassword(req.body);
      
      res.status(HttpStatusCode.OK).json(result);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Verify email with token
   * GET /api/auth/verify-email/:token
   */
  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;
      
      if (!token) {
        throw new AppError('Verification token is required', HttpStatusCode.BAD_REQUEST);
      }

      const result = await this.authService.verifyEmail(token);
      
      res.status(HttpStatusCode.OK).json(result);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Resend email verification
   * POST /api/auth/resend-verification
   */
  resendEmailVerification = async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        throw new AppError('User not authenticated', HttpStatusCode.UNAUTHORIZED);
      }

      const result = await this.authService.resendEmailVerification(userId.toString());
      
      res.status(HttpStatusCode.OK).json(result);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get user profile
   * GET /api/auth/profile
   */
  getProfile = async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        throw new AppError('User not authenticated', HttpStatusCode.UNAUTHORIZED);
      }

      const result = await this.authService.getProfile(userId.toString());
      
      res.status(HttpStatusCode.OK).json(result);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  updateProfile = async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        throw new AppError('User not authenticated', HttpStatusCode.UNAUTHORIZED);
      }

      const result = await this.authService.updateProfile(userId.toString(), req.body as Partial<IUser>);
      
      res.status(HttpStatusCode.OK).json(result);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get current user info (from token)
   * GET /api/auth/me
   */
  getCurrentUser = async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AppError('User not authenticated', HttpStatusCode.UNAUTHORIZED);
      }

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Check if user is authenticated
   * GET /api/auth/check
   */
  checkAuth = async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        authenticated: !!user,
        data: user ? { user } : null,
      });
    } catch (error) {
      throw error;
    }
  };
}

// Export controller instance
export const authController = new AuthController();