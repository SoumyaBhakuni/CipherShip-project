const mongoose = require('mongoose');
const { TRACKING } = require('../config/constants');

const TrackingLogSchema = new mongoose.Schema({
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: Object.values(TRACKING.STATUS)
  },
  location: {
    type: {
      latitude: Number,
      longitude: Number,
      address: String
    }
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  level: {
    type: String,
    enum: Object.values(TRACKING.LOG_LEVEL),
    default: TRACKING.LOG_LEVEL.INFO
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Define indexes for faster queries
TrackingLogSchema.index({ package: 1, timestamp: -1 });
TrackingLogSchema.index({ user: 1, timestamp: -1 });
TrackingLogSchema.index({ level: 1, timestamp: -1 });
TrackingLogSchema.index({ timestamp: -1 });

// Static method to create a new tracking log entry
TrackingLogSchema.statics.logAction = async function(logData) {
  try {
    const log = new this({
      package: logData.package,
      user: logData.user,
      action: logData.action,
      details: logData.details,
      status: logData.status,
      location: logData.location,
      ipAddress: logData.ipAddress,
      userAgent: logData.userAgent,
      level: logData.level || TRACKING.LOG_LEVEL.INFO
    });
    
    return await log.save();
  } catch (error) {
    console.error('Error logging action:', error);
    throw error;
  }
};

// Static method to get logs for a specific package
TrackingLogSchema.statics.getPackageLogs = async function(packageId, limit = 100) {
  return this.find({ package: packageId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'firstName lastName email role')
    .exec();
};

// Static method to get logs by level
TrackingLogSchema.statics.getLogsByLevel = async function(level, limit = 100) {
  return this.find({ level })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'firstName lastName email role')
    .populate('package', 'trackingNumber status')
    .exec();
};

// Static method to get recent logs
TrackingLogSchema.statics.getRecentLogs = async function(limit = 100) {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'firstName lastName email role')
    .populate('package', 'trackingNumber status')
    .exec();
};

module.exports = mongoose.model('TrackingLog', TrackingLogSchema);