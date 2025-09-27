import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt';
import { createBaseSchema, IBaseDocument, IBaseModel } from './base.model';
import { env } from '@/config/env';

// User interface
export interface IUser extends IBaseDocument {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'moderator';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerifiedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: Array<{
    token: string;
    expiresAt: Date;
  }>;
  lastLoginAt?: Date;
  profilePicture?: string;
  bio?: string;
  isActive: boolean;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  addRefreshToken(token: string): Promise<void>;
  removeRefreshToken(token: string): Promise<void>;
  clearAllRefreshTokens(): Promise<void>;
  getFullName(): string;
  toPublicJSON(): any;
}

// User schema definition
const userSchemaDefinition = {
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ],
    index: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false, // Don't include password in queries by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin', 'moderator'],
      message: 'Role must be either user, admin, or moderator'
    },
    default: 'user',
    index: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
    index: true,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  emailVerifiedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  refreshTokens: {
    type: [{
      token: {
        type: String,
        required: true,
      },
      expiresAt: {
        type: Date,
        required: true,
      }
    }],
    default: [],
    select: false,
  },
  lastLoginAt: {
    type: Date,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
};

// Create user schema using base schema
const userSchema = createBaseSchema<IUser>(userSchemaDefinition);

// Add additional indexes
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ isEmailVerified: 1, isActive: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, env.BCRYPT_SALT_ROUNDS);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Instance method to generate access token
userSchema.methods.generateAccessToken = function(): string {
  const payload = {
    userId: this._id,
    email: this.email,
    role: this.role,
  };

  return generateAccessToken(payload);
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function(): string {
  const payload = {
    userId: this._id,
    email: this.email,
    role: this.role,
  };

  return generateRefreshToken(payload);
};

// Instance method to add refresh token
userSchema.methods.addRefreshToken = async function(token: string): Promise<void> {
  // Limit the number of refresh tokens per user (max 5 devices)
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift(); // Remove oldest token
  }
  
  // Calculate expiration date (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  this.refreshTokens.push({
    token,
    expiresAt
  });
  await this.save();
};

// Instance method to remove refresh token
userSchema.methods.removeRefreshToken = async function(token: string): Promise<void> {
  this.refreshTokens = this.refreshTokens.filter((tokenData: any) => tokenData.token !== token);
  await this.save();
};

// Instance method to clear all refresh tokens
userSchema.methods.clearAllRefreshTokens = async function(): Promise<void> {
  this.refreshTokens = [];
  await this.save();
};

// Instance method to get full name
userSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`.trim();
};

// Instance method to return public user data
userSchema.methods.toPublicJSON = function(): any {
  const userObject = this.toObject();
  
  // Remove sensitive fields
  delete userObject.password;
  delete userObject.refreshTokens;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  
  return {
    ...userObject,
    fullName: this.getFullName(),
  };
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });
};

// Static method to find active users
userSchema.statics.findActiveUsers = function(filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: { $ne: true } });
};

// Static method to find users by role
userSchema.statics.findByRole = function(role: string, filter = {}) {
  return this.find({ ...filter, role, isActive: true, isDeleted: { $ne: true } });
};

// Create and export the model
export interface IUserModel extends IBaseModel<IUser> {
  findByEmail(email: string): any;
  findActiveUsers(filter?: any): any;
  findByRole(role: string, filter?: any): any;
}

export const User = model<IUser & IBaseDocument, IUserModel>('User', userSchema);