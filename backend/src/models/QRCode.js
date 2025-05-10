const mongoose = require('mongoose');
const { QR_CODE } = require('../config/constants');

const QRCodeSchema = new mongoose.Schema({
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  encryptedData: {
    type: String,
    required: true
  },
  iv: {
    type: String, // Initialization Vector for AES encryption
    required: true
  },
  image: {
    type: String, // Base64 encoded QR code image
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + QR_CODE.EXPIRY * 1000)
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scans: [{
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      type: {
        latitude: Number,
        longitude: Number,
        accuracy: Number
      },
      default: null
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    isAuthorized: {
      type: Boolean,
      required: true
    }
  }],
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
QRCodeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Check if QR code is expired
QRCodeSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Record a scan attempt
QRCodeSchema.methods.recordScan = function(scanData) {
  this.scans.push({
    scannedBy: scanData.scannedBy,
    location: scanData.location,
    ipAddress: scanData.ipAddress,
    userAgent: scanData.userAgent,
    isAuthorized: scanData.isAuthorized
  });
  
  return this.save();
};

// Get scan count
QRCodeSchema.virtual('scanCount').get(function() {
  return this.scans.length;
});

// Get last scan
QRCodeSchema.virtual('lastScan').get(function() {
  if (this.scans.length === 0) return null;
  return this.scans[this.scans.length - 1];
});

// Get authorized scan count
QRCodeSchema.virtual('authorizedScanCount').get(function() {
  return this.scans.filter(scan => scan.isAuthorized).length;
});

// Get unauthorized scan count
QRCodeSchema.virtual('unauthorizedScanCount').get(function() {
  return this.scans.filter(scan => !scan.isAuthorized).length;
});

module.exports = mongoose.model('QRCode', QRCodeSchema);