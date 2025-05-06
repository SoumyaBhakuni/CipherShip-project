const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  status: {
    type: String,
    enum: ['pending', 'in-transit', 'delivered', 'cancelled'],
    default: 'pending',
  },
  deliveryAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  weight: {
    type: Number,
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  estimatedDelivery: {
    type: Date,
  },
  actualDelivery: {
    type: Date,
  },
});

module.exports = mongoose.model('Package', PackageSchema);