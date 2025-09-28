import mongoose, { Document, Schema } from 'mongoose';

export interface IProposal extends Document {
  // Reference Information
  leadId: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  
  // Proposal Details
  proposalNumber: string;
  title: string;
  
  // Configuration
  selectedSeating: {
    hotDesks: number;
    dedicatedDesks: number;
    privateCabins: number;
    meetingRooms: number;
  };
  
  selectedAmenities: {
    essential: string[];
    comfort: string[];
    business: string[];
    lifestyle: string[];
    technology: string[];
  };
  
  // Pricing Information
  pricing: {
    baseAmount: number;
    discountPercentage: number;
    discountAmount: number;
    finalAmount: number;
    currency: string;
    duration: 'monthly' | 'quarterly' | 'annual';
  };
  
  // Terms and Conditions
  contractDuration: string;
  terms: string[];
  additionalServices: string[];
  
  // Status and Tracking
  status: 'draft' | 'sent' | 'viewed' | 'under_review' | 'approved' | 'rejected' | 'expired';
  
  // Email Tracking
  emailTracking: {
    sentAt?: Date;
    openedAt?: Date;
    downloadedAt?: Date;
    responseAt?: Date;
    emailsSent: number;
  };
  
  // File Information
  pdfPath?: string;
  pdfSize?: number;
  
  // Follow-up
  followUpDate?: Date;
  expiryDate?: Date;
  
  // Notes and Comments
  notes: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

const proposalSchema = new Schema<IProposal>({
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    required: [true, 'Lead ID is required']
  },
  centerId: {
    type: Schema.Types.ObjectId,
    ref: 'Center',
    required: [true, 'Center ID is required']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required']
  },
  proposalNumber: {
    type: String,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Proposal title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  selectedSeating: {
    hotDesks: { type: Number, default: 0, min: 0 },
    dedicatedDesks: { type: Number, default: 0, min: 0 },
    privateCabins: { type: Number, default: 0, min: 0 },
    meetingRooms: { type: Number, default: 0, min: 0 }
  },
  selectedAmenities: {
    essential: [{ type: String, trim: true }],
    comfort: [{ type: String, trim: true }],
    business: [{ type: String, trim: true }],
    lifestyle: [{ type: String, trim: true }],
    technology: [{ type: String, trim: true }]
  },
  pricing: {
    baseAmount: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    finalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', trim: true },
    duration: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual'],
      required: [true, 'Duration is required']
    }
  },
  contractDuration: {
    type: String,
    required: [true, 'Contract duration is required'],
    trim: true
  },
  terms: [{ type: String, trim: true }],
  additionalServices: [{ type: String, trim: true }],
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'under_review', 'approved', 'rejected', 'expired'],
    default: 'draft'
  },
  emailTracking: {
    sentAt: { type: Date },
    openedAt: { type: Date },
    downloadedAt: { type: Date },
    responseAt: { type: Date },
    emailsSent: { type: Number, default: 0, min: 0 }
  },
  pdfPath: { type: String, trim: true },
  pdfSize: { type: Number, min: 0 },
  followUpDate: { type: Date },
  expiryDate: { type: Date },
  notes: [{ type: String, trim: true }]
}, {
  timestamps: true
});

// Indexes for better query performance
proposalSchema.index({ leadId: 1 });
proposalSchema.index({ centerId: 1 });
proposalSchema.index({ createdBy: 1 });
proposalSchema.index({ status: 1 });
proposalSchema.index({ createdAt: -1 });

// Pre-save middleware to generate proposal number
proposalSchema.pre('save', async function(next) {
  if (!this.proposalNumber) {
    const count = await (this.constructor as any).countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.proposalNumber = `CWP-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model<IProposal>('Proposal', proposalSchema);