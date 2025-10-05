import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import Lead from '../models/Lead';
import User from '../models/User';
import { validateSuperfoneWebhook, rawBodyParser } from '../middleware/webhookAuth';

const router = express.Router();

// @route   POST /api/webhooks/superfone/lead
// @desc    Handle lead creation webhook from Superfone
// @access  Private (Requires Superfone webhook signature)
router.post('/superfone/lead', rawBodyParser, validateSuperfoneWebhook, asyncHandler(async (req, res): Promise<void> => {
  const rawBody = req.rawBody?.toString() || '{}';
  console.log('Raw webhook body:', rawBody);
  const webhookData = JSON.parse(rawBody);
  console.log('Parsed webhook data:', webhookData);
  
  // Find any active sales user to assign the lead to
  const salesUser = await User.findOne({
    role: { $in: ['sales_admin', 'sales_manager', 'sales_executive'] },
    isActive: true
  });

  // If no sales user exists, create unassigned lead
  const assignedTo = salesUser ? salesUser._id : null;

  // Transform Superfone lead data to our Lead model format
  const leadData = {
    name: webhookData.name || '',
    email: webhookData.email || '',
    phone: webhookData.phone || '',
    company: webhookData.company || 'Not specified',
    businessType: webhookData.business_type || 'other',
    businessSize: webhookData.business_size || 'small',
    seatingRequirements: {
      hotDesks: 0,
      dedicatedDesks: 0,
      privateCabins: 0,
      meetingRooms: 0
    },
    budgetRange: {
      min: 1000,
      max: 5000
    },
    preferredLocations: [],
    timeline: 'Immediate',
    specialRequirements: '',
    source: 'website',
    status: 'new',
    assignedTo,
    notes: [`Lead created via Superfone webhook at ${new Date().toISOString()}`]
  };

  console.log('Creating lead with data:', leadData);

  // Create new lead in database
  const lead = await Lead.create(leadData);

  console.log('Lead created successfully:', lead);

  res.status(201).json({
    success: true,
    message: 'Lead created successfully',
    data: { lead }
  });
}));

export default router;