import bcrypt from 'bcryptjs';
import { User, IUser } from '@/models/user.model';
import { 
  generateTokenPair, 
  generatePasswordResetToken,
  generateEmailVerificationToken,
  verifyPasswordResetToken,
  verifyEmailVerificationToken,
  blacklistToken
} from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/appError';
import { HttpStatusCode } from '@/types/error.types';
import {
  ILoginRequest,
  IRegisterRequest,
  IChangePasswordRequest,
  IResetPasswordRequest,
  IForgotPasswordRequest,
  IRefreshTokenRequest,
  ITokenPair,
  IAuthResponse,
  IUserProfileResponse,
  IPasswordResetResponse,
  ILogoutResponse
} from '@/types/auth.types';
import { validatePasswordStrength } from '@/utils/validation';

export class AuthService {
  /**
   * Register a new user
   */
  async register(registerData: IRegisterRequest): Promise<IAuthResponse> {
    try {
      const { firstName, lastName, email, password, role = 'user' } = registerData;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new AppError('User already exists with this email', HttpStatusCode.CONFLICT);
      }

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new AppError(
          `Password validation failed: ${passwordValidation.errors.join(', ')}`,
          HttpStatusCode.BAD_REQUEST
        );
      }

      // Create new user
      const user = new User({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password, // Will be hashed by pre-save middleware
        role,
        isActive: true,
        isEmailVerified: false, // Will be verified via email
      });

      await user.save();

      // Generate tokens
      const tokens = generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Save refresh token to user
      await user.addRefreshToken(tokens.refreshToken);

      // Generate email verification token (if email verification is enabled)
      let verificationToken: string | undefined;
      if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
        verificationToken = generateEmailVerificationToken(
          user._id.toString(),
          user.email
        );
        
        // TODO: Send verification email
        logger.logInfo('Email verification token generated', {
          userId: user._id.toString(),
          email: user.email,
        });
      }

      // Log successful registration
      logger.logAuth('User registered successfully', {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.toPublicJSON(),
          tokens,
        },
      };
    } catch (error) {
      logger.logError('User registration failed', error as Error, {
        email: registerData.email,
      });
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(loginData: ILoginRequest): Promise<IAuthResponse> {
    try {
      const { email, password, rememberMe = false } = loginData;

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+password +refreshTokens')
        .exec();

      if (!user) {
        throw new AppError('Invalid email or password', HttpStatusCode.UNAUTHORIZED);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AppError('Account is deactivated', HttpStatusCode.UNAUTHORIZED);
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', HttpStatusCode.UNAUTHORIZED);
      }

      // Check if email verification is required
      if (!user.isEmailVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
        throw new AppError('Please verify your email before logging in', HttpStatusCode.UNAUTHORIZED);
      }

      // Generate tokens
      const tokens = generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Save refresh token to user
      await user.addRefreshToken(tokens.refreshToken);

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Log successful login
      logger.logAuth('User logged in successfully', {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        rememberMe,
      });

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: user.toPublicJSON(),
          tokens,
        },
      };
    } catch (error) {
      logger.logError('User login failed', error as Error, {
        email: loginData.email,
      });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshData: IRefreshTokenRequest): Promise<ITokenPair> {
    try {
      const { refreshToken } = refreshData;

      // This validation is handled by middleware, but we'll double-check
      const user = await User.findOne({
        'refreshTokens.token': refreshToken,
        'refreshTokens.expiresAt': { $gt: new Date() },
      }).select('+refreshTokens');

      if (!user) {
        throw new AppError('Invalid or expired refresh token', HttpStatusCode.UNAUTHORIZED);
      }

      // Generate new token pair
      const newTokens = generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Replace old refresh token with new one
      await user.removeRefreshToken(refreshToken);
      await user.addRefreshToken(newTokens.refreshToken);

      // Log token refresh
      logger.logAuth('Token refreshed successfully', {
        userId: user._id.toString(),
        email: user.email,
      });

      return newTokens;
    } catch (error) {
      logger.logError('Token refresh failed', error as Error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken?: string): Promise<ILogoutResponse> {
    try {
      const user = await User.findById(userId).select('+refreshTokens');
      
      if (!user) {
        throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
      }

      // Remove refresh token if provided
      if (refreshToken) {
        await user.removeRefreshToken(refreshToken);
        
        // Blacklist the refresh token
        blacklistToken(refreshToken, userId, 'refresh');
      }

      // Log successful logout
      logger.logAuth('User logged out successfully', {
        userId,
        email: user.email,
      });

      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      logger.logError('User logout failed', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<ILogoutResponse> {
    try {
      const user = await User.findById(userId).select('+refreshTokens');
      
      if (!user) {
        throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
      }

      // Blacklist all refresh tokens
      for (const tokenData of user.refreshTokens) {
        blacklistToken(tokenData.token, userId, 'refresh');
      }

      // Clear all refresh tokens
      user.refreshTokens = [];
      await user.save();

      // Log successful logout from all devices
      logger.logAuth('User logged out from all devices', {
        userId,
        email: user.email,
      });

      return {
        success: true,
        message: 'Logged out from all devices successfully',
      };
    } catch (error) {
      logger.logError('Logout from all devices failed', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, changePasswordData: IChangePasswordRequest): Promise<IPasswordResetResponse> {
    try {
      const { currentPassword, newPassword } = changePasswordData;

      // Find user with password
      const user = await User.findById(userId).select('+password +refreshTokens');
      
      if (!user) {
        throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', HttpStatusCode.BAD_REQUEST);
      }

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(
          `Password validation failed: ${passwordValidation.errors.join(', ')}`,
          HttpStatusCode.BAD_REQUEST
        );
      }

      // Update password
      user.password = newPassword; // Will be hashed by pre-save middleware
      
      // Clear all refresh tokens (force re-login on all devices)
      for (const tokenData of user.refreshTokens) {
        blacklistToken(tokenData.token, userId, 'refresh');
      }
      user.refreshTokens = [];
      
      await user.save();

      // Log password change
      logger.logAuth('Password changed successfully', {
        userId,
        email: user.email,
      });

      return {
        success: true,
        message: 'Password changed successfully. Please log in again.',
      };
    } catch (error) {
      logger.logError('Password change failed', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(forgotPasswordData: IForgotPasswordRequest): Promise<IPasswordResetResponse> {
    try {
      const { email } = forgotPasswordData;

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        // Don't reveal if email exists or not for security
        return {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
        };
      }

      // Generate password reset token
      const resetToken = generatePasswordResetToken(
        user._id.toString(),
        user.email
      );

      // TODO: Send password reset email
      logger.logInfo('Password reset token generated', {
        userId: user._id.toString(),
        email: user.email,
      });

      // Log password reset request
      logger.logAuth('Password reset requested', {
        userId: user._id.toString(),
        email: user.email,
      });

      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (error) {
      logger.logError('Password reset request failed', error as Error, {
        email: forgotPasswordData.email,
      });
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetPasswordData: IResetPasswordRequest): Promise<IPasswordResetResponse> {
    try {
      const { token, newPassword } = resetPasswordData;

      // Verify reset token
      const verificationResult = verifyPasswordResetToken(token);
      
      if (!verificationResult.valid) {
        throw new AppError(
          verificationResult.error || 'Invalid or expired reset token',
          HttpStatusCode.BAD_REQUEST
        );
      }

      const { userId } = verificationResult.payload;

      // Find user
      const user = await User.findById(userId).select('+password +refreshTokens');
      
      if (!user) {
        throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
      }

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(
          `Password validation failed: ${passwordValidation.errors.join(', ')}`,
          HttpStatusCode.BAD_REQUEST
        );
      }

      // Update password
      user.password = newPassword; // Will be hashed by pre-save middleware
      
      // Clear all refresh tokens (force re-login on all devices)
      for (const tokenData of user.refreshTokens) {
        blacklistToken(tokenData.token, userId, 'refresh');
      }
      user.refreshTokens = [];
      
      await user.save();

      // Log password reset
      logger.logAuth('Password reset successfully', {
        userId,
        email: user.email,
      });

      return {
        success: true,
        message: 'Password reset successfully. Please log in with your new password.',
      };
    } catch (error) {
      logger.logError('Password reset failed', error as Error);
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<IPasswordResetResponse> {
    try {
      // Verify email verification token
      const verificationResult = verifyEmailVerificationToken(token);
      
      if (!verificationResult.valid) {
        throw new AppError(
          verificationResult.error || 'Invalid or expired verification token',
          HttpStatusCode.BAD_REQUEST
        );
      }

      const { userId } = verificationResult.payload;

      // Find and update user
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
      }

      if (user.isEmailVerified) {
        return {
          success: true,
          message: 'Email is already verified.',
        };
      }

      // Mark email as verified
      user.isEmailVerified = true;
      user.emailVerifiedAt = new Date();
      await user.save();

      // Log email verification
      logger.logAuth('Email verified successfully', {
        userId,
        email: user.email,
      });

      return {
        success: true,
        message: 'Email verified successfully.',
      };
    } catch (error) {
      logger.logError('Email verification failed', error as Error);
      throw error;
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(userId: string): Promise<IPasswordResetResponse> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
      }

      if (user.isEmailVerified) {
        return {
          success: true,
          message: 'Email is already verified.',
        };
      }

      // Generate new verification token
      const verificationToken = generateEmailVerificationToken(
        user._id.toString(),
        user.email
      );

      // TODO: Send verification email
      logger.logInfo('Email verification token resent', {
        userId,
        email: user.email,
      });

      return {
        success: true,
        message: 'Verification email sent successfully.',
      };
    } catch (error) {
      logger.logError('Resend email verification failed', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<IUserProfileResponse> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
      }

      return {
        success: true,
        data: {
          user: user.toPublicJSON(),
        },
      };
    } catch (error) {
      logger.logError('Get user profile failed', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: Partial<IUser>): Promise<IUserProfileResponse> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
      }

      // Update allowed fields
      const allowedFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'bio', 'location', 'website', 'avatar'];
      
      for (const field of allowedFields) {
        if (updateData[field as keyof IUser] !== undefined) {
          (user as any)[field] = updateData[field as keyof IUser];
        }
      }

      await user.save();

      // Log profile update
      logger.logAuth('User profile updated', {
        userId,
        email: user.email,
        updatedFields: Object.keys(updateData),
      });

      return {
        success: true,
        data: {
          user: user.toPublicJSON(),
        },
      };
    } catch (error) {
      logger.logError('Update user profile failed', error as Error, { userId });
      throw error;
    }
  }
}