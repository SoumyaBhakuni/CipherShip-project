const mongoose = require('mongoose');
const { TRACKING } = require('../config/constants');

const AddressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: 'United States'
  }
}, { _id: false });

const RecipientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const DimensionsSchema = new mongoose.Schema({
  length: {
    type: Number,
    required: true,
    min: 0
  },
  width: {
    type: Number,
    required: true,
    min: 0
  },
  height: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['cm', 'in'],
    default: 'cm'
  }
}, { _id: false });

const StatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: Object.values(TRACKING.STATUS),
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const PackageSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: RecipientSchema,
    required: true
  },
  pickupAddress: {
    type: AddressSchema,
    required: true
  },
  deliveryAddress: {
    type: AddressSchema,
    required: true
  },
  weight: {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['kg', 'lb'],
      default: 'kg'
    }
  },
  dimensions: {
    type: DimensionsSchema
  },
  description: {
    type: String,
    trim: true
  },
  isFragile: {
    type: Boolean,
    default: false
  },
  requiresSignature: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: Object.values(TRACKING.STATUS),
    default: TRACKING.STATUS.CREATED
  },
  statusHistory: [StatusHistorySchema],
  qrCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QRCode'
  },
  estimatedDelivery: {
    type: Date
  },
  actualDelivery: {
    type: Date
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
PackageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Add status change to history if status changed
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: Date.now()
    });
  }
  
  next();
});

// Generate tracking number
PackageSchema.statics.generateTrackingNumber = function() {
  const prefix = 'CS'; // Cipher Ship
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
};

// Get current status with formatted timestamp
PackageSchema.virtual('currentStatus').get(function() {
  if (this.statusHistory.length === 0) {
    return {
      status: this.status,
      timestamp: this.createdAt
    };
  }
  
  const latestStatus = this.statusHistory[this.statusHistory.length - 1];
  return {
    status: latestStatus.status,
    timestamp: latestStatus.timestamp,
    location: latestStatus.location,
    notes: latestStatus.notes
  };
});

module.exports = mongoose.model('Package', PackageSchema);