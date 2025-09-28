import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Lead from '../models/Lead';
import { authenticate, requireSales } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// @route   GET /api/leads
// @desc    Get all leads with filtering
// @access  Private (Sales)
router.get('/', [
  authenticate,
  requireSales,
  query('status').optional().isIn(['new', 'contacted', 'proposal_sent', 'follow_up', 'converted', 'lost']).withMessage('Invalid status'),
  query('businessSize').optional().isIn(['startup', 'small', 'medium', 'large', 'enterprise']).withMessage('Invalid business size')
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
  
  if (req.query.status) filter.status = req.query.status;
  if (req.query.businessSize) filter.businessSize = req.query.businessSize;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { company: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // For non-admin users, only show leads assigned to them
  if ((req.user as any).role === 'sales_executive') {
    filter.assignedTo = (req.user as any)._id;
  }

  const leads = await Lead.find(filter)
    .populate('assignedTo', 'name email role')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      leads
    }
  });
}));

// @route   GET /api/leads/stats
// @desc    Get lead statistics
// @access  Private (Sales)
router.get('/stats', [authenticate, requireSales], asyncHandler(async (req, res): Promise<void> => {
  // Build filter for user role
  const filter: any = {};
  
  // For non-admin users, only show stats for leads assigned to them
  if ((req.user as any).role === 'sales_executive') {
    filter.assignedTo = (req.user as any)._id;
  }

  // Get total leads count
  const totalLeads = await Lead.countDocuments(filter);

  // Get leads by status
  const statusStats = await Lead.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Get leads by business size
  const businessSizeStats = await Lead.aggregate([
    { $match: filter },
    { $group: { _id: '$businessSize', count: { $sum: 1 } } }
  ]);

  // Get leads by source
  const sourceStats = await Lead.aggregate([
    { $match: filter },
    { $group: { _id: '$source', count: { $sum: 1 } } }
  ]);

  // Get recent leads (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentLeads = await Lead.countDocuments({
    ...filter,
    createdAt: { $gte: thirtyDaysAgo }
  });

  // Calculate conversion rate (converted leads / total leads)
  const convertedLeads = await Lead.countDocuments({
    ...filter,
    status: 'converted'
  });
  
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : '0.00';

  // Format the response
  const formattedStats = {
    total: totalLeads,
    recentLeads,
    convertedLeads,
    conversionRate: `${conversionRate}%`,
    byStatus: statusStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>),
    byBusinessSize: businessSizeStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>),
    bySource: sourceStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>)
  };

  res.json({
    success: true,
    data: formattedStats
  });
}));

// @route   GET /api/leads/:id
// @desc    Get single lead by ID
// @access  Private (Sales)
router.get('/:id', [authenticate, requireSales], asyncHandler(async (req, res): Promise<void> => {
  const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email role');
  
  if (!lead) {
    res.status(404).json({ 
      success: false, 
      message: 'Lead not found' 
    });
    return;
  }

  // Check if user can access this lead
  if ((req.user as any).role === 'sales_executive' && lead.assignedTo._id.toString() !== (req.user as any)._id.toString()) {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only view your assigned leads.' 
    });
    return;
  }

  res.json({
    success: true,
    data: { lead }
  });
}));

// @route   POST /api/leads
// @desc    Create new lead
// @access  Private (Sales)
router.post('/', [
  authenticate,
  requireSales,
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('company').trim().isLength({ min: 2, max: 200 }).withMessage('Company name must be between 2 and 200 characters'),
  body('businessType').trim().notEmpty().withMessage('Business type is required'),
  body('businessSize').isIn(['startup', 'small', 'medium', 'large', 'enterprise']).withMessage('Invalid business size'),
  body('budgetRange.min').isNumeric().withMessage('Minimum budget must be a number'),
  body('budgetRange.max').isNumeric().withMessage('Maximum budget must be a number'),
  body('timeline').trim().notEmpty().withMessage('Timeline is required'),
  body('source').isIn(['website', 'referral', 'cold_call', 'social_media', 'other']).withMessage('Invalid lead source')
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

  // Check if lead with same email already exists
  const existingLead = await Lead.findOne({ email: req.body.email });
  if (existingLead) {
    res.status(400).json({ 
      success: false, 
      message: 'Lead with this email already exists' 
    });
    return;
  }

  // Validate budget range
  if (req.body.budgetRange.min > req.body.budgetRange.max) {
    res.status(400).json({ 
      success: false, 
      message: 'Minimum budget cannot be greater than maximum budget' 
    });
    return;
  }

  // Create lead with current user as assignedTo
  const leadData = {
    ...req.body,
    assignedTo: req.body.assignedTo || req.user!._id
  };

  const lead = new Lead(leadData);
  await lead.save();

  await lead.populate('assignedTo', 'name email role');

  res.status(201).json({
    success: true,
    message: 'Lead created successfully',
    data: { lead }
  });
}));

// @route   PUT /api/leads/:id
// @desc    Update lead
// @access  Private (Sales)
router.put('/:id', [
  authenticate,
  requireSales,
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('businessSize').optional().isIn(['startup', 'small', 'medium', 'large', 'enterprise']).withMessage('Invalid business size'),
  body('status').optional().isIn(['new', 'contacted', 'proposal_sent', 'follow_up', 'converted', 'lost']).withMessage('Invalid status'),
  body('source').optional().isIn(['website', 'referral', 'cold_call', 'social_media', 'other']).withMessage('Invalid lead source')
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

  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404).json({ 
      success: false, 
      message: 'Lead not found' 
    });
    return;
  }

  // Check if user can update this lead
  if ((req.user as any).role === 'sales_executive' && lead.assignedTo.toString() !== (req.user as any)._id.toString()) {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only update your assigned leads.' 
    });
    return;
  }

  // Check if email is already taken by another lead
  if (req.body.email && req.body.email !== lead.email) {
    const existingLead = await Lead.findOne({ email: req.body.email, _id: { $ne: req.params.id } });
    if (existingLead) {
      res.status(400).json({ 
        success: false, 
        message: 'Email is already taken by another lead' 
      });
      return;
    }
  }

  // Validate budget range if provided
  if (req.body.budgetRange && req.body.budgetRange.min > req.body.budgetRange.max) {
    res.status(400).json({ 
      success: false, 
      message: 'Minimum budget cannot be greater than maximum budget' 
    });
    return;
  }

  const updatedLead = await Lead.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('assignedTo', 'name email role');

  res.json({
    success: true,
    message: 'Lead updated successfully',
    data: { lead: updatedLead }
  });
}));

// @route   DELETE /api/leads/:id
// @desc    Delete lead
// @access  Private (Sales Manager/Admin)
router.delete('/:id', [authenticate, requireSales], asyncHandler(async (req, res): Promise<void> => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404).json({ 
      success: false, 
      message: 'Lead not found' 
    });
    return;
  }

  // Only managers and admins can delete leads
  if (req.user!.role === 'sales_executive') {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. Only managers and admins can delete leads.' 
    });
    return;
  }

  await Lead.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Lead deleted successfully'
  });
}));

// @route   POST /api/leads/:id/notes
// @desc    Add note to lead
// @access  Private (Sales)
router.post('/:id/notes', [
  authenticate,
  requireSales,
  body('note').trim().notEmpty().withMessage('Note cannot be empty')
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

  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404).json({ 
      success: false, 
      message: 'Lead not found' 
    });
    return;
  }

  // Check if user can delete this lead
  if ((req.user as any).role === 'sales_executive' && lead.assignedTo.toString() !== (req.user as any)._id.toString()) {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only add notes to your assigned leads.' 
    });
    return;
  }

  lead.notes.push(req.body.note);
  await lead.save();

  res.json({
    success: true,
    message: 'Note added successfully',
    data: { lead }
  });
}));

export default router;