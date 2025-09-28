import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string, email: string, role: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  return jwt.sign(
    { userId, email, role },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user (Admin only)
// @access  Private (Admin)
router.post('/register', [
  authenticate,
  requireAdmin,
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'sales_executive', 'sales_manager']).withMessage('Invalid role')
], asyncHandler(async (req, res): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false, 
      message: 'Validation failed', 
      errors: errors.array() 
    });
    return;
  }

  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).json({ 
      success: false, 
      message: 'User already exists with this email' 
    });
    return;
  }

  // Create new user
  const user = new User({ name, email, password, role });
  await user.save();

  // Generate token
  const token = generateToken((user._id as any).toString(), user.email, user.role);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    }
  });
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], asyncHandler(async (req, res): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false, 
      message: 'Validation failed', 
      errors: errors.array() 
    });
    return;
  }

  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid email or password' 
    });
    return;
  }

  // Check if user is active
  if (!user.isActive) {
    res.status(401).json({ 
      success: false, 
      message: 'Account is deactivated. Please contact administrator.' 
    });
    return;
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid email or password' 
    });
    return;
  }

  // Generate token
  const token = generateToken((user._id as any).toString(), user.email, user.role);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    }
  });
}));

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, asyncHandler(async (req, res): Promise<void> => {
  res.json({
    success: true,
    data: {
      user: {
        id: (req.user as any)._id,
        name: (req.user as any).name,
        email: (req.user as any).email,
        role: (req.user as any).role,
        isActive: (req.user as any).isActive,
        createdAt: (req.user as any).createdAt,
        updatedAt: (req.user as any).updatedAt
      }
    }
  });
}));

// @route   PUT /api/auth/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', [
  authenticate,
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email')
], asyncHandler(async (req, res): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false, 
      message: 'Validation failed', 
      errors: errors.array() 
    });
    return;
  }

  const { name, email } = req.body;
  const userId = (req.user as any)._id;

  // Check if email is already taken by another user
  if (email && email !== (req.user as any).email) {
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      res.status(400).json({ 
        success: false, 
        message: 'Email is already taken by another user' 
      });
      return;
    }
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { ...(name && { name }), ...(email && { email }) },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: (updatedUser as any)._id,
        name: (updatedUser as any).name,
        email: (updatedUser as any).email,
        role: (updatedUser as any).role,
        isActive: (updatedUser as any).isActive,
        updatedAt: (updatedUser as any).updatedAt
      }
    }
  });
}));

// @route   GET /api/auth/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/users', [authenticate, requireAdmin], asyncHandler(async (req, res): Promise<void> => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      users,
      count: users.length
    }
  });
}));

export default router;