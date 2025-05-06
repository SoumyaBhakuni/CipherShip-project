const mongoose = require('mongoose');

const TrackingLogSchema = new mongoose.Schema({
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true,
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    enum: ['created', 'scanned', 'updated', 'delivered'],
    required: true,
  },
  locationData: {
    latitude: String,
    longitude: String,
    address: String,
  },
  details: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
});

module.exports = mongoose.model('TrackingLog', TrackingLogSchema);