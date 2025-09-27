import { z } from 'zod';
import { IPasswordValidation } from '@/types/auth.types';

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/^(?=.*\d)/, 'Password must contain at least one number')
  .regex(/^(?=.*[@$!%*?&])/, 'Password must contain at least one special character (@$!%*?&)');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .trim();

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// Auth validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(['user', 'admin']).optional().default('user'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'New passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// User validation schemas
export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
  dateOfBirth: z.string()
    .datetime('Invalid date format')
    .optional(),
  bio: z.string()
    .max(500, 'Bio must not exceed 500 characters')
    .optional(),
  location: z.string()
    .max(100, 'Location must not exceed 100 characters')
    .optional(),
  website: z.string()
    .url('Invalid website URL')
    .optional(),
  avatar: z.string()
    .url('Invalid avatar URL')
    .optional(),
});

// Pagination validation schema
export const paginationSchema = z.object({
  page: z.coerce.number()
    .int('Page must be an integer')
    .min(1, 'Page must be greater than 0')
    .default(1),
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must not exceed 100')
    .default(10),
  sort: z.string()
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*(:asc|:desc)?$/, 'Invalid sort format')
    .default('createdAt:desc'),
  search: z.string()
    .max(100, 'Search query must not exceed 100 characters')
    .optional(),
});

// Query validation schema
export const querySchema = z.object({
  fields: z.string()
    .regex(/^[a-zA-Z_][a-zA-Z0-9_,]*$/, 'Invalid fields format')
    .optional(),
  populate: z.string()
    .regex(/^[a-zA-Z_][a-zA-Z0-9_,]*$/, 'Invalid populate format')
    .optional(),
});

// File upload validation schema
export const fileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string().refine(
    (type) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(type),
    'Only JPEG, PNG, GIF, and WebP images are allowed'
  ),
  size: z.number().max(5 * 1024 * 1024, 'File size must not exceed 5MB'),
});

// Password strength validation
export const validatePasswordStrength = (password: string): IPasswordValidation => {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Special character check
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  } else {
    score += 1;
  }

  // Common patterns check
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters
    /123456|654321|abcdef|qwerty|password/i, // Common sequences
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns');
      score -= 1;
      break;
    }
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong';
  if (score < 3) {
    strength = 'weak';
  } else if (score < 5) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.max(0, score),
  };
};

// Email validation
export const validateEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

// ObjectId validation
export const validateObjectId = (id: string): boolean => {
  try {
    objectIdSchema.parse(id);
    return true;
  } catch {
    return false;
  }
};

// Sanitize input
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Validate and sanitize object
export const validateAndSanitize = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};

// Custom validation middleware factory
export const validateBody = <T>(schema: z.ZodSchema<T>) => {
  return (req: any, res: any, next: any) => {
    const result = validateAndSanitize(schema, req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: result.errors,
          code: 'VALIDATION_ERROR',
        },
      });
    }
    
    req.validatedBody = result.data;
    next();
  };
};

// Query validation middleware
export const validateQuery = (req: any, res: any, next: any) => {
  const result = validateAndSanitize(
    paginationSchema.merge(querySchema),
    req.query
  );
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid query parameters',
        details: result.errors,
        code: 'QUERY_VALIDATION_ERROR',
      },
    });
  }
  
  req.validatedQuery = result.data;
  next();
};

// Params validation middleware
export const validateParams = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    const result = validateAndSanitize(schema, req.params);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid parameters',
          details: result.errors,
          code: 'PARAMS_VALIDATION_ERROR',
        },
      });
    }
    
    req.validatedParams = result.data;
    next();
  };
};