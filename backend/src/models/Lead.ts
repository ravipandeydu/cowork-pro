import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  // Contact Information
  name: string;
  email: string;
  phone: string;
  company: string;
  
  // Business Information
  businessType: string;
  businessSize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  
  // Requirements
  seatingRequirements: {
    hotDesks: number;
    dedicatedDesks: number;
    privateCabins: number;
    meetingRooms: number;
  };
  
  budgetRange: {
    min: number;
    max: number;
  };
  
  preferredLocations: string[];
  timeline: string;
  specialRequirements: string;
  
  // Lead Management
  status: 'new' | 'contacted' | 'proposal_sent' | 'follow_up' | 'converted' | 'lost';
  source: 'website' | 'referral' | 'cold_call' | 'social_media' | 'other';
  assignedTo: mongoose.Types.ObjectId;
  
  // Tracking
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  notes: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>({
  name: {
    type: String,
    required: [true, 'Lead name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  businessType: {
    type: String,
    required: [true, 'Business type is required'],
    trim: true
  },
  businessSize: {
    type: String,
    enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
    required: [true, 'Business size is required']
  },
  seatingRequirements: {
    hotDesks: { type: Number, default: 0, min: 0 },
    dedicatedDesks: { type: Number, default: 0, min: 0 },
    privateCabins: { type: Number, default: 0, min: 0 },
    meetingRooms: { type: Number, default: 0, min: 0 }
  },
  budgetRange: {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 }
  },
  preferredLocations: [{
    type: String,
    trim: true
  }],
  timeline: {
    type: String,
    required: [true, 'Timeline is required'],
    trim: true
  },
  specialRequirements: {
    type: String,
    trim: true,
    maxlength: [1000, 'Special requirements cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'proposal_sent', 'follow_up', 'converted', 'lost'],
    default: 'new'
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'cold_call', 'social_media', 'other'],
    required: [true, 'Lead source is required']
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Lead must be assigned to a user']
  },
  lastContactDate: {
    type: Date
  },
  nextFollowUpDate: {
    type: Date
  },
  notes: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ createdAt: -1 });

export default mongoose.model<ILead>('Lead', leadSchema);