import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Center from '../models/Center';
import { authenticate, requireSales, requireManager } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// @route   GET /api/centers
// @desc    Get all centers with filtering
// @access  Private (Sales)
router.get('/', [
  authenticate,
  requireSales,
  query('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
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

  // Build filter object
  const filter: any = {};
  
  // For non-admin users, only show centers they have access to
  if ((req.user as any).role === 'sales_executive') {
    // Sales executives can see all active centers
    filter.isActive = true;
  }
  
  if (req.query.city) filter['address.city'] = { $regex: req.query.city, $options: 'i' };
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { 'address.city': { $regex: req.query.search, $options: 'i' } },
      { 'address.state': { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const centers = await Center.find(filter)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      centers
    }
  });
}));

// @route   GET /api/centers/:id
// @desc    Get single center by ID
// @access  Private (Sales)
router.get('/:id', [authenticate, requireSales], asyncHandler(async (req, res): Promise<void> => {
  const center = await Center.findById(req.params.id);
  
  if (!center) {
    res.status(404).json({ 
      success: false, 
      message: 'Center not found' 
    });
    return;
  }

  res.json({
    success: true,
    data: { center }
  });
}));

// @route   POST /api/centers
// @desc    Create new center
// @access  Private (Manager/Admin)
router.post('/', [
  authenticate,
  requireManager,
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Center name must be between 2 and 200 characters'),
  body('address.street').trim().notEmpty().withMessage('Street address is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('address.zipCode').trim().notEmpty().withMessage('Zip code is required'),
  body('contact.phone').trim().notEmpty().withMessage('Phone number is required'),
  body('contact.email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('capacity.totalSeats').isInt({ min: 1 }).withMessage('Total seats must be at least 1'),
  body('pricing.hotDesk.daily').isFloat({ min: 0 }).withMessage('Hot desk daily price must be a positive number'),
  body('pricing.hotDesk.monthly').isFloat({ min: 0 }).withMessage('Hot desk monthly price must be a positive number')
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

  // Validate capacity consistency
  const { capacity } = req.body;
  const totalCalculated = capacity.hotDesks.total + capacity.dedicatedDesks.total + 
                         capacity.privateCabins.total + capacity.meetingRooms.total;
  
  if (totalCalculated > capacity.totalSeats) {
    res.status(400).json({ 
      success: false, 
      message: 'Sum of individual seat types cannot exceed total seats' 
    });
    return;
  }

  // Validate available seats don't exceed total
  if (capacity.hotDesks.available > capacity.hotDesks.total ||
      capacity.dedicatedDesks.available > capacity.dedicatedDesks.total ||
      capacity.privateCabins.available > capacity.privateCabins.total ||
      capacity.meetingRooms.available > capacity.meetingRooms.total) {
    res.status(400).json({ 
      success: false, 
      message: 'Available seats cannot exceed total seats for any category' 
    });
    return;
  }

  const center = new Center(req.body);
  await center.save();

  res.status(201).json({
    success: true,
    message: 'Center created successfully',
    data: { center }
  });
}));

// @route   PUT /api/centers/:id
// @desc    Update center
// @access  Private (Manager/Admin)
router.put('/:id', [
  authenticate,
  requireManager,
  body('name').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Center name must be between 2 and 200 characters'),
  body('contact.email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('capacity.totalSeats').optional().isInt({ min: 1 }).withMessage('Total seats must be at least 1')
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

  const center = await Center.findById(req.params.id);
  if (!center) {
    res.status(404).json({ 
      success: false, 
      message: 'Center not found' 
    });
    return;
  }

  // Validate capacity if provided
  if (req.body.capacity) {
    const capacity = { ...center.capacity, ...req.body.capacity };
    
    const totalCalculated = capacity.hotDesks.total + capacity.dedicatedDesks.total + 
                           capacity.privateCabins.total + capacity.meetingRooms.total;
    
    if (totalCalculated > capacity.totalSeats) {
      res.status(400).json({ 
        success: false, 
        message: 'Sum of individual seat types cannot exceed total seats' 
      });
      return;
    }

    if (capacity.hotDesks.available > capacity.hotDesks.total ||
        capacity.dedicatedDesks.available > capacity.dedicatedDesks.total ||
        capacity.privateCabins.available > capacity.privateCabins.total ||
        capacity.meetingRooms.available > capacity.meetingRooms.total) {
      res.status(400).json({ 
        success: false, 
        message: 'Available seats cannot exceed total seats for any category' 
      });
      return;
    }
  }

  const updatedCenter = await Center.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Center updated successfully',
    data: { center: updatedCenter }
  });
}));

// @route   DELETE /api/centers/:id
// @desc    Delete center (soft delete by setting isActive to false)
// @access  Private (Manager/Admin)
router.delete('/:id', [authenticate, requireManager], asyncHandler(async (req, res): Promise<void> => {
  const center = await Center.findById(req.params.id);
  if (!center) {
    res.status(404).json({ 
      success: false, 
      message: 'Center not found' 
    });
    return;
  }

  // Soft delete by setting isActive to false
  center.isActive = false;
  await center.save();

  res.json({
    success: true,
    message: 'Center deactivated successfully'
  });
}));

// @route   PUT /api/centers/:id/availability
// @desc    Update center availability
// @access  Private (Manager/Admin)
router.put('/:id/availability', [
  authenticate,
  requireManager,
  body('hotDesks').optional().isInt({ min: 0 }).withMessage('Hot desks availability must be a non-negative integer'),
  body('dedicatedDesks').optional().isInt({ min: 0 }).withMessage('Dedicated desks availability must be a non-negative integer'),
  body('privateCabins').optional().isInt({ min: 0 }).withMessage('Private cabins availability must be a non-negative integer'),
  body('meetingRooms').optional().isInt({ min: 0 }).withMessage('Meeting rooms availability must be a non-negative integer')
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

  const center = await Center.findById(req.params.id);
  if (!center) {
    res.status(404).json({ 
      success: false, 
      message: 'Center not found' 
    });
    return;
  }

  // Update availability
  if (req.body.hotDesks !== undefined) {
    if (req.body.hotDesks > center.capacity.hotDesks.total) {
      res.status(400).json({ 
        success: false, 
        message: 'Hot desks availability cannot exceed total hot desks' 
      });
      return;
    }
    center.capacity.hotDesks.available = req.body.hotDesks;
  }

  if (req.body.dedicatedDesks !== undefined) {
    if (req.body.dedicatedDesks > center.capacity.dedicatedDesks.total) {
      res.status(400).json({ 
        success: false, 
        message: 'Dedicated desks availability cannot exceed total dedicated desks' 
      });
      return;
    }
    center.capacity.dedicatedDesks.available = req.body.dedicatedDesks;
  }

  if (req.body.privateCabins !== undefined) {
    if (req.body.privateCabins > center.capacity.privateCabins.total) {
      res.status(400).json({ 
        success: false, 
        message: 'Private cabins availability cannot exceed total private cabins' 
      });
      return;
    }
    center.capacity.privateCabins.available = req.body.privateCabins;
  }

  if (req.body.meetingRooms !== undefined) {
    if (req.body.meetingRooms > center.capacity.meetingRooms.total) {
      res.status(400).json({ 
        success: false, 
        message: 'Meeting rooms availability cannot exceed total meeting rooms' 
      });
      return;
    }
    center.capacity.meetingRooms.available = req.body.meetingRooms;
  }

  // Update total available seats
  center.capacity.availableSeats = center.capacity.hotDesks.available + 
                                  center.capacity.dedicatedDesks.available + 
                                  center.capacity.privateCabins.available + 
                                  center.capacity.meetingRooms.available;

  await center.save();

  res.json({
    success: true,
    message: 'Center availability updated successfully',
    data: { center }
  });
}));

// @route   GET /api/centers/search/by-location
// @desc    Search centers by location and requirements
// @access  Private (Sales)
router.get('/search/by-location', [
  authenticate,
  requireSales,
  query('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  query('hotDesks').optional().isInt({ min: 0 }).withMessage('Hot desks must be a non-negative integer'),
  query('dedicatedDesks').optional().isInt({ min: 0 }).withMessage('Dedicated desks must be a non-negative integer'),
  query('privateCabins').optional().isInt({ min: 0 }).withMessage('Private cabins must be a non-negative integer'),
  query('meetingRooms').optional().isInt({ min: 0 }).withMessage('Meeting rooms must be a non-negative integer')
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

  const filter: any = { isActive: true };
  
  if (req.query.city) {
    filter['address.city'] = { $regex: req.query.city, $options: 'i' };
  }

  // Filter by availability requirements
  if (req.query.hotDesks) {
    filter['capacity.hotDesks.available'] = { $gte: parseInt(req.query.hotDesks as string) };
  }
  if (req.query.dedicatedDesks) {
    filter['capacity.dedicatedDesks.available'] = { $gte: parseInt(req.query.dedicatedDesks as string) };
  }
  if (req.query.privateCabins) {
    filter['capacity.privateCabins.available'] = { $gte: parseInt(req.query.privateCabins as string) };
  }
  if (req.query.meetingRooms) {
    filter['capacity.meetingRooms.available'] = { $gte: parseInt(req.query.meetingRooms as string) };
  }

  const centers = await Center.find(filter).sort({ name: 1 });

  res.json({
    success: true,
    data: {
      centers,
      count: centers.length
    }
  });
}));

export default router;