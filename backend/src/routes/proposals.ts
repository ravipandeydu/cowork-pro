import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Proposal from '../models/Proposal';
import Lead from '../models/Lead';
import Center from '../models/Center';
import { authenticate, requireSales } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { generateProposalPDF } from '../services/pdfService';
import { sendProposalEmail } from '../services/emailService';

const router = express.Router();

// @route   GET /api/proposals
// @desc    Get all proposals with filtering
// @access  Private (Sales)
router.get('/', [
  authenticate,
  requireSales,
  query('status').optional().isIn(['draft', 'sent', 'viewed', 'under_review', 'approved', 'rejected', 'expired']).withMessage('Invalid status')
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
  if (req.query.leadId) filter.leadId = req.query.leadId;
  if (req.query.centerId) filter.centerId = req.query.centerId;

  // For non-admin users, only show proposals they created
  if ((req.user as any).role === 'sales_executive') {
    filter.createdBy = (req.user as any)._id;
  }

  const proposals = await Proposal.find(filter)
    .populate('leadId', 'name email company')
    .populate('centerId', 'name address.city')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      proposals
    }
  });
}));

// @route   GET /api/proposals/stats
// @desc    Get proposal statistics
// @access  Private (Sales)
router.get('/stats', [authenticate, requireSales], asyncHandler(async (req, res): Promise<void> => {
  const filter: any = {};
  
  // For sales executives, only show their proposals
  if ((req.user as any).role === 'sales_executive') {
    filter.createdBy = (req.user as any)._id;
  }

  const [
    totalProposals,
    statusStats,
    durationStats,
    recentProposals
  ] = await Promise.all([
    // Total proposals count
    Proposal.countDocuments(filter),
    
    // Proposals by status
    Proposal.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    
    // Proposals by pricing duration
    Proposal.aggregate([
      { $match: filter },
      { $group: { _id: '$pricing.duration', count: { $sum: 1 } } }
    ]),
    
    // Recent proposals (last 5)
    Proposal.find(filter)
      .populate('leadId', 'name company')
      .populate('centerId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  // Calculate conversion rate
  const sentProposals = statusStats.find(stat => stat._id === 'sent')?.count || 0;
  const approvedProposals = statusStats.find(stat => stat._id === 'approved')?.count || 0;
  const conversionRate = sentProposals > 0 ? ((approvedProposals / sentProposals) * 100).toFixed(2) : '0.00';

  // Format status stats
  const statusBreakdown = {
    draft: statusStats.find(stat => stat._id === 'draft')?.count || 0,
    sent: statusStats.find(stat => stat._id === 'sent')?.count || 0,
    viewed: statusStats.find(stat => stat._id === 'viewed')?.count || 0,
    under_review: statusStats.find(stat => stat._id === 'under_review')?.count || 0,
    approved: statusStats.find(stat => stat._id === 'approved')?.count || 0,
    rejected: statusStats.find(stat => stat._id === 'rejected')?.count || 0,
    expired: statusStats.find(stat => stat._id === 'expired')?.count || 0
  };

  // Format duration stats
  const durationBreakdown = {
    monthly: durationStats.find(stat => stat._id === 'monthly')?.count || 0,
    quarterly: durationStats.find(stat => stat._id === 'quarterly')?.count || 0,
    annual: durationStats.find(stat => stat._id === 'annual')?.count || 0
  };

  res.json({
    success: true,
    data: {
      totalProposals,
      statusBreakdown,
      durationBreakdown,
      conversionRate: parseFloat(conversionRate),
      recentProposals
    }
  });
}));

// @route   GET /api/proposals/:id
// @desc    Get single proposal by ID
// @access  Private (Sales)
router.get('/:id', [authenticate, requireSales], asyncHandler(async (req, res): Promise<void> => {
  const proposal = await Proposal.findById(req.params.id)
    .populate('leadId', 'name email company phone businessType businessSize seatingRequirements')
    .populate('centerId')
    .populate('createdBy', 'name email');
  
  if (!proposal) {
    res.status(404).json({ 
      success: false, 
      message: 'Proposal not found' 
    });
    return;
  }

  // Check if user can access this proposal
  if ((req.user as any).role === 'sales_executive' && proposal.createdBy._id.toString() !== (req.user as any)._id.toString()) {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only view your own proposals.' 
    });
    return;
  }

  res.json({
    success: true,
    data: { proposal }
  });
}));

// @route   POST /api/proposals
// @desc    Create new proposal
// @access  Private (Sales)
router.post('/', [
  authenticate,
  requireSales,
  body('leadId').isMongoId().withMessage('Valid lead ID is required'),
  body('centerId').isMongoId().withMessage('Valid center ID is required'),
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('selectedSeating.hotDesks').optional().isInt({ min: 0 }).withMessage('Hot desks must be a non-negative integer'),
  body('selectedSeating.dedicatedDesks').optional().isInt({ min: 0 }).withMessage('Dedicated desks must be a non-negative integer'),
  body('selectedSeating.privateCabins').optional().isInt({ min: 0 }).withMessage('Private cabins must be a non-negative integer'),
  body('selectedSeating.meetingRooms').optional().isInt({ min: 0 }).withMessage('Meeting rooms must be a non-negative integer'),
  body('pricing.baseAmount').isFloat({ min: 0 }).withMessage('Base amount must be a positive number'),
  body('pricing.discountPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount percentage must be between 0 and 100'),
  body('pricing.taxPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax percentage must be between 0 and 100'),
  body('pricing.breakdown').optional().isObject().withMessage('Pricing breakdown must be an object'),
  body('terms.duration').optional().isIn(['monthly', 'quarterly', 'annual']).withMessage('Invalid terms duration'),
  body('terms.startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('terms.endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  body('terms.paymentTerms').optional().trim().isLength({ min: 1 }).withMessage('Payment terms cannot be empty'),
  body('terms.cancellationPolicy').optional().trim().isLength({ min: 1 }).withMessage('Cancellation policy cannot be empty'),
  body('validUntil').optional().isISO8601().withMessage('Valid until must be a valid date'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('contractDuration').optional().trim().isLength({ min: 1 }).withMessage('Contract duration cannot be empty')
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

  // Verify lead exists
  const lead = await Lead.findById(req.body.leadId);
  if (!lead) {
    res.status(404).json({ 
      success: false, 
      message: 'Lead not found' 
    });
    return;
  }

  // Verify center exists and is active
  const center = await Center.findById(req.body.centerId);
  if (!center || !center.isActive) {
    res.status(404).json({ 
      success: false, 
      message: 'Center not found or inactive' 
    });
    return;
  }

  // Check if user can create proposal for this lead
  if ((req.user as any).role === 'sales_executive' && lead.assignedTo.toString() !== (req.user as any)._id.toString()) {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only create proposals for your assigned leads.' 
    });
    return;
  }

  // Calculate pricing
  const baseAmount = req.body.pricing.baseAmount;
  const discountPercentage = req.body.pricing.discountPercentage || 0;
  const taxPercentage = req.body.pricing.taxPercentage || 0;
  const discountAmount = (baseAmount * discountPercentage) / 100;
  const taxAmount = (baseAmount * taxPercentage) / 100;
  const finalAmount = baseAmount - discountAmount + taxAmount;

  // Set expiry date (30 days from creation or use provided validUntil)
  const expiryDate = req.body.validUntil ? new Date(req.body.validUntil) : new Date();
  if (!req.body.validUntil) {
    expiryDate.setDate(expiryDate.getDate() + 30);
  }

  // Transform the request data to match the Proposal schema
  const proposalData = {
    leadId: req.body.leadId,
    centerId: req.body.centerId,
    title: req.body.title,
    selectedSeating: req.body.selectedSeating,
    pricing: {
      baseAmount,
      discountPercentage,
      discountAmount,
      finalAmount,
      currency: 'INR',
      duration: req.body.terms?.duration || 'monthly'
    },
    contractDuration: req.body.contractDuration || `${req.body.terms?.duration || 'monthly'} contract`,
    terms: req.body.terms ? [
      `Duration: ${req.body.terms.duration}`,
      `Start Date: ${req.body.terms.startDate}`,
      `End Date: ${req.body.terms.endDate}`,
      `Payment Terms: ${req.body.terms.paymentTerms}`,
      `Cancellation Policy: ${req.body.terms.cancellationPolicy}`
    ].filter(term => !term.includes('undefined')) : [],
    notes: req.body.notes ? [req.body.notes] : [],
    createdBy: (req.user as any)._id,
    expiryDate
  };

  const proposal = new Proposal(proposalData);
  await proposal.save();

  await proposal.populate([
    { path: 'leadId', select: 'name email company' },
    { path: 'centerId', select: 'name address.city' },
    { path: 'createdBy', select: 'name email' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Proposal created successfully',
    data: { proposal }
  });
}));

// @route   PUT /api/proposals/:id
// @desc    Update proposal
// @access  Private (Sales)
router.put('/:id', [
  authenticate,
  requireSales,
  body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('status').optional().isIn(['draft', 'sent', 'viewed', 'under_review', 'approved', 'rejected', 'expired']).withMessage('Invalid status'),
  body('pricing.baseAmount').optional().isFloat({ min: 0 }).withMessage('Base amount must be a positive number'),
  body('pricing.discountPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount percentage must be between 0 and 100')
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

  const proposal = await Proposal.findById(req.params.id);
  if (!proposal) {
    res.status(404).json({ 
      success: false, 
      message: 'Proposal not found' 
    });
    return;
  }

  // Check if user can update this proposal
  if ((req.user as any).role === 'sales_executive' && proposal.createdBy.toString() !== (req.user as any)._id.toString()) {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only update your own proposals.' 
    });
    return;
  }

  // Don't allow updates to sent proposals unless it's status change
  if (proposal.status === 'sent' && req.body.status === undefined) {
    res.status(400).json({ 
      success: false, 
      message: 'Cannot modify sent proposals. Only status updates are allowed.' 
    });
    return;
  }

  // Recalculate pricing if base amount or discount changes
  if (req.body.pricing) {
    const baseAmount = req.body.pricing.baseAmount || proposal.pricing.baseAmount;
    const discountPercentage = req.body.pricing.discountPercentage !== undefined 
      ? req.body.pricing.discountPercentage 
      : proposal.pricing.discountPercentage;
    
    const discountAmount = (baseAmount * discountPercentage) / 100;
    const finalAmount = baseAmount - discountAmount;

    req.body.pricing = {
      ...req.body.pricing,
      discountAmount,
      finalAmount
    };
  }

  const updatedProposal = await Proposal.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate([
    { path: 'leadId', select: 'name email company' },
    { path: 'centerId', select: 'name address.city' },
    { path: 'createdBy', select: 'name email' }
  ]);

  res.json({
    success: true,
    message: 'Proposal updated successfully',
    data: { proposal: updatedProposal }
  });
}));

// @route   POST /api/proposals/generate-pdf
// @desc    Generate PDF for a proposal without sending email
// @access  Private (Sales)
router.post('/generate-pdf', [
  authenticate,
  requireSales,
  body('client').isObject().withMessage('Client information is required'),
  body('client.name').trim().notEmpty().withMessage('Client name is required'),
  body('client.email').isEmail().withMessage('Valid client email is required'),
  body('hubCentres').isArray({ min: 1 }).withMessage('At least one hub centre is required'),
  body('proposalNumber').trim().notEmpty().withMessage('Proposal number is required')
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

  try {
    // Transform the request body to match the expected proposal structure
    const proposalData = {
      proposalNumber: req.body.proposalNumber,
      createdAt: req.body.createdAt || new Date(),
      expiryDate: req.body.proposal?.validUntil ? new Date(req.body.proposal.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      title: req.body.proposal?.title || 'Coworking Space Proposal',
      leadId: {
        name: req.body.client.name,
        email: req.body.client.email,
        phone: req.body.client.phone || '',
        company: req.body.client.company || '',
        businessType: req.body.client.address || 'Business',
        businessSize: 'Small'
      },
      centerId: {
        name: req.body.hubCentres[0].name,
        address: {
          street: req.body.hubCentres[0].address || '',
          city: req.body.hubCentres[0].location?.split(',')[0] || '',
          state: req.body.hubCentres[0].location?.split(',')[1] || '',
          zipCode: ''
        },
        contact: {
          phone: '+91-80-1234-5678',
          email: 'info@coworkpro.com'
        },
        operatingHours: {
          weekdays: '9:00 AM - 8:00 PM',
          weekends: '10:00 AM - 6:00 PM'
        }
      },
      selectedSeating: {
        hotDesks: 0,
        dedicatedDesks: 0,
        privateCabins: 0,
        meetingRooms: 0
      },
      selectedAmenities: [],
      pricing: {
        baseAmount: parseFloat(req.body.proposal?.value) || 0,
        discountPercentage: 0,
        discountAmount: 0,
        finalAmount: parseFloat(req.body.proposal?.value) || 0,
        duration: 'monthly',
        currency: req.body.proposal?.currency || 'INR'
      },
      contractDuration: req.body.offerDetails?.lockIn || 'Monthly',
      terms: req.body.terms ? [req.body.terms] : [
        'Payment due within 30 days of invoice date',
        'Security deposit equivalent to 2 months rent required',
        'Minimum contract period as specified',
        'Notice period as per agreement terms'
      ],
      createdBy: {
        name: (req.user as any).name || 'Sales Team',
        email: (req.user as any).email || 'sales@coworkpro.com'
      }
    };

    // Generate PDF
    const pdfBuffer = await generateProposalPDF(proposalData);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="proposal-${req.body.proposalNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate PDF. Please try again.' 
    });
  }
}));

// @route   POST /api/proposals/:id/send
// @desc    Generate PDF and send proposal via email
// @access  Private (Sales)
router.post('/:id/send', [authenticate, requireSales], asyncHandler(async (req, res): Promise<void> => {
  const proposal = await Proposal.findById(req.params.id)
    .populate('leadId')
    .populate('centerId')
    .populate('createdBy', 'name email');
  
  if (!proposal) {
    res.status(404).json({ 
      success: false, 
      message: 'Proposal not found' 
    });
    return;
  }

  // Check if user can send this proposal
  if ((req.user as any).role === 'sales_executive' && proposal.createdBy._id.toString() !== (req.user as any)._id.toString()) {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only send your own proposals.' 
    });
    return;
  }

  if (proposal.status === 'sent') {
    res.status(400).json({ 
      success: false, 
      message: 'Proposal has already been sent' 
    });
    return;
  }

  try {
    // Generate PDF
    const pdfBuffer = await generateProposalPDF(proposal);
    
    // Send email
    await sendProposalEmail(proposal.leadId as any, pdfBuffer, proposal);

    // Update proposal status and tracking
    proposal.status = 'sent';
    proposal.emailTracking.sentAt = new Date();
    proposal.emailTracking.emailsSent += 1;
    await proposal.save();

    // Update lead status
    const lead = await Lead.findById(proposal.leadId);
    if (lead && lead.status === 'new' || lead?.status === 'contacted') {
      lead.status = 'proposal_sent';
      lead.lastContactDate = new Date();
      await lead.save();
    }

    res.json({
      success: true,
      message: 'Proposal sent successfully',
      data: { proposal }
    });
  } catch (error) {
    console.error('Error sending proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send proposal. Please try again.'
    });
  }
}));

// @route   DELETE /api/proposals/:id
// @desc    Delete proposal
// @access  Private (Sales)
router.delete('/:id', [authenticate, requireSales], asyncHandler(async (req, res): Promise<void> => {
  const proposal = await Proposal.findById(req.params.id);
  if (!proposal) {
    res.status(404).json({ 
      success: false, 
      message: 'Proposal not found' 
    });
    return;
  }

  // Check if user can delete this proposal
  if ((req.user as any).role === 'sales_executive' && proposal.createdBy.toString() !== (req.user as any)._id.toString()) {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only delete your own proposals.' 
    });
    return;
  }

  // Don't allow deletion of sent proposals
  if (proposal.status === 'sent') {
    res.status(400).json({ 
      success: false, 
      message: 'Cannot delete sent proposals' 
    });
    return;
  }

  await Proposal.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Proposal deleted successfully'
  });
}));

// @route   POST /api/proposals/:id/notes
// @desc    Add note to proposal
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

  const proposal = await Proposal.findById(req.params.id);
  if (!proposal) {
    res.status(404).json({ 
      success: false, 
      message: 'Proposal not found' 
    });
    return;
  }

  // Check if user can add notes to this proposal
  if ((req.user as any).role === 'sales_executive' && proposal.createdBy.toString() !== (req.user as any)._id.toString()) {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only add notes to your own proposals.' 
    });
    return;
  }

  proposal.notes.push(req.body.note);
  await proposal.save();

  res.json({
    success: true,
    message: 'Note added successfully',
    data: { proposal }
  });
}));

// @route   GET /api/proposals/analytics/dashboard
// @desc    Get proposal analytics for dashboard
// @access  Private (Sales)
router.get('/analytics/dashboard', [authenticate, requireSales], asyncHandler(async (req, res): Promise<void> => {
  const filter: any = {};
  
  // For sales executives, only show their proposals
  if ((req.user as any).role === 'sales_executive') {
    filter.createdBy = (req.user as any)._id;
  }

  const [
    totalProposals,
    sentProposals,
    approvedProposals,
    rejectedProposals,
    recentProposals
  ] = await Promise.all([
    Proposal.countDocuments(filter),
    Proposal.countDocuments({ ...filter, status: 'sent' }),
    Proposal.countDocuments({ ...filter, status: 'approved' }),
    Proposal.countDocuments({ ...filter, status: 'rejected' }),
    Proposal.find(filter)
      .populate('leadId', 'name company')
      .populate('centerId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  const conversionRate = sentProposals > 0 ? ((approvedProposals / sentProposals) * 100).toFixed(2) : '0.00';

  res.json({
    success: true,
    data: {
      summary: {
        total: totalProposals,
        sent: sentProposals,
        approved: approvedProposals,
        rejected: rejectedProposals,
        conversionRate: `${conversionRate}%`
      },
      recentProposals
    }
  });
}));

export default router;