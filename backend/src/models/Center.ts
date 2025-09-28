import mongoose, { Document, Schema } from 'mongoose';

export interface ICenter extends Document {
  // Basic Information
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  operatingHours: {
    weekdays: { open: string; close: string };
    weekends: { open: string; close: string };
  };
  
  // Capacity Information
  capacity: {
    totalSeats: number;
    availableSeats: number;
    hotDesks: { total: number; available: number };
    dedicatedDesks: { total: number; available: number };
    privateCabins: { total: number; available: number };
    meetingRooms: { total: number; available: number };
  };
  
  // Amenities
  amenities: {
    essential: string[];
    comfort: string[];
    business: string[];
    lifestyle: string[];
    technology: string[];
  };
  
  // Pricing
  pricing: {
    hotDesk: { daily: number; monthly: number };
    dedicatedDesk: { daily: number; monthly: number };
    privateCabin: { daily: number; monthly: number };
    meetingRoom: { hourly: number; daily: number };
  };
  
  // Media
  images: string[];
  virtualTourLink?: string;
  floorPlan?: string;
  
  // Location Benefits
  nearbyFacilities: {
    transport: string[];
    restaurants: string[];
    banks: string[];
    other: string[];
  };
  
  // Status
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const centerSchema = new Schema<ICenter>({
  name: {
    type: String,
    required: [true, 'Center name is required'],
    trim: true,
    maxlength: [200, 'Center name cannot exceed 200 characters']
  },
  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'India' }
  },
  contact: {
    phone: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      lowercase: true, 
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  operatingHours: {
    weekdays: {
      open: { type: String, required: true, default: '09:00' },
      close: { type: String, required: true, default: '18:00' }
    },
    weekends: {
      open: { type: String, required: true, default: '10:00' },
      close: { type: String, required: true, default: '17:00' }
    }
  },
  capacity: {
    totalSeats: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, required: true, min: 0 },
    hotDesks: {
      total: { type: Number, required: true, min: 0 },
      available: { type: Number, required: true, min: 0 }
    },
    dedicatedDesks: {
      total: { type: Number, required: true, min: 0 },
      available: { type: Number, required: true, min: 0 }
    },
    privateCabins: {
      total: { type: Number, required: true, min: 0 },
      available: { type: Number, required: true, min: 0 }
    },
    meetingRooms: {
      total: { type: Number, required: true, min: 0 },
      available: { type: Number, required: true, min: 0 }
    }
  },
  amenities: {
    essential: [{ type: String, trim: true }],
    comfort: [{ type: String, trim: true }],
    business: [{ type: String, trim: true }],
    lifestyle: [{ type: String, trim: true }],
    technology: [{ type: String, trim: true }]
  },
  pricing: {
    hotDesk: {
      daily: { type: Number, required: true, min: 0 },
      monthly: { type: Number, required: true, min: 0 }
    },
    dedicatedDesk: {
      daily: { type: Number, required: true, min: 0 },
      monthly: { type: Number, required: true, min: 0 }
    },
    privateCabin: {
      daily: { type: Number, required: true, min: 0 },
      monthly: { type: Number, required: true, min: 0 }
    },
    meetingRoom: {
      hourly: { type: Number, required: true, min: 0 },
      daily: { type: Number, required: true, min: 0 }
    }
  },
  images: [{ type: String, trim: true }],
  virtualTourLink: { type: String, trim: true },
  floorPlan: { type: String, trim: true },
  nearbyFacilities: {
    transport: [{ type: String, trim: true }],
    restaurants: [{ type: String, trim: true }],
    banks: [{ type: String, trim: true }],
    other: [{ type: String, trim: true }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
centerSchema.index({ 'address.city': 1 });
centerSchema.index({ isActive: 1 });
centerSchema.index({ name: 1 });

export default mongoose.model<ICenter>('Center', centerSchema);