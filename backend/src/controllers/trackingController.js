const TrackingLog = require('../models/TrackingLog');
const Package = require('../models/Package');
const QRCode = require('../models/QRCode');
const User = require('../models/User');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const { validateObjectId } = require('../utils/validators');

/**
 * Get tracking history for a package
 */
exports.getTrackingHistory = async (req, res) => {
  try {
    const { packageId } = req.params;
    
    // Validate ObjectId
    if (!validateObjectId(packageId)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }
    
    // Find package
    const package = await Package.findById(packageId);
    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    // If user is a customer, ensure they can only view their own packages' tracking history
    if (req.user.role === 'customer' && package.customerId && package.customerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this tracking history' });
    }
    
    // Find tracking logs
    const trackingLogs = await TrackingLog.find({ packageId })
      .populate('userId', 'name email role')
      .sort({ createdAt: 1 });
    
    res.status(200).json({
      success: true,
      count: trackingLogs.length,
      data: {
        package: {
          id: package._id,
          trackingNumber: package.trackingNumber,
          status: package.status,
          customerName: package.customerName,
          createdAt: package.createdAt
        },
        trackingHistory: trackingLogs
      }
    });
  } catch (error) {
    console.error('Get tracking history error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching tracking history' });
  }
};

/**
 * Get tracking history by tracking number (public endpoint)
 */
exports.getTrackingByNumber = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    // Find package by tracking number
    const package = await Package.findOne({ trackingNumber });
    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    // Find tracking logs
    const trackingLogs = await TrackingLog.find({ packageId: package._id })
      .select('-userId') // Don't expose user information in public endpoint
      .sort({ createdAt: 1 });
    
    res.status(200).json({
      success: true,
      data: {
        package: {
          trackingNumber: package.trackingNumber,
          status: package.status,
          createdAt: package.createdAt
        },
        trackingHistory: trackingLogs.map(log => ({
          status: log.status,
          message: log.message,
          createdAt: log.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get tracking by number error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching tracking information' });
  }
};

/**
 * Add tracking event
 */
exports.addTrackingEvent = async (req, res) => {
  try {
    const { packageId, status, message, location } = req.body;
    
    // Validate ObjectId
    if (!validateObjectId(packageId)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }
    
    // Find package
    const package = await Package.findById(packageId);
    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    // Create tracking log entry
    const trackingLog = new TrackingLog({
      packageId,
      status: status || package.status,
      message,
      location,
      userId: req.user.id
    });
    
    await trackingLog.save();
    
    // Update package status if provided
    if (status && status !== package.status) {
      package.status = status;
      await package.save();
    }
    
    // Send email notification to customer if email exists
    if (package.customerEmail) {
      await emailService.sendTrackingUpdateEmail(
        package.customerEmail,
        package.customerName,
        package.trackingNumber,
        status || package.status,
        message,
        location
      );
    }
    
    // Send real-time notification if customer has an account
    if (package.customerId) {
      await notificationService.sendNotification(
        package.customerId,
        'Package Tracking Update',
        message || `Your package ${package.trackingNumber} has a new tracking update`,
        {
          type: 'tracking_update',
          packageId: package._id,
          status: status || package.status,
          location
        }
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Tracking event added successfully',
      data: trackingLog
    });
  } catch (error) {
    console.error('Add tracking event error:', error);
    res.status(500).json({ success: false, message: 'Server error while adding tracking event' });
  }
};

/**
 * Get recent tracking events (for dashboard)
 */
exports.getRecentTrackingEvents = async (req, res) => {
  try {
    // Define filter based on user role
    const matchCondition = {};
    
    // If user is a customer, only show their package events
    if (req.user.role === 'customer') {
      // First get customer's packages
      const packages = await Package.find({ customerId: req.user.id });
      const packageIds = packages.map(pkg => pkg._id);
      
      // Only show events for customer's packages
      matchCondition.packageId = { $in: packageIds };
    }
    
    // If delivery agent, show events they created plus packages they're responsible for
    if (req.user.role === 'delivery-agent') {
      matchCondition.$or = [
        { userId: req.user.id },
        // Add any other conditions for packages assigned to this delivery agent
      ];
    }
    
    // Get recent events with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const recentEvents = await TrackingLog.find(matchCondition)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('packageId', 'trackingNumber status')
      .populate('userId', 'name role');
    
    const total = await TrackingLog.countDocuments(matchCondition);
    
    res.status(200).json({
      success: true,
      count: recentEvents.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: recentEvents
    });
  } catch (error) {
    console.error('Get recent tracking events error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching recent tracking events' });
  }
};

/**
 * Get tracking analytics
 */
exports.getTrackingAnalytics = async (req, res) => {
  try {
    // Define filter based on user role
    let matchCondition = {};
    
    // If user is a customer, only show their package stats
    if (req.user.role === 'customer') {
      // First get customer's packages
      const packages = await Package.find({ customerId: req.user.id });
      const packageIds = packages.map(pkg => pkg._id);
      
      // Only show analytics for customer's packages
      matchCondition = { packageId: { $in: packageIds } };
    }
    
    // Date range filter
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    
    // Ensure end date is set to end of day
    endDate.setHours(23, 59, 59, 999);
    
    matchCondition.createdAt = { $gte: startDate, $lte: endDate };
    
    // Status changes by day
    const statusChangesByDay = await TrackingLog.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    // Format status changes by day
    const formattedStatusChanges = {};
    statusChangesByDay.forEach(item => {
      const date = item._id.date;
      const status = item._id.status;
      
      if (!formattedStatusChanges[date]) {
        formattedStatusChanges[date] = {};
      }
      
      formattedStatusChanges[date][status] = item.count;
    });
    
    // Status distribution
    const statusDistribution = await TrackingLog.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format status distribution
    const formattedStatusDistribution = {};
    statusDistribution.forEach(item => {
      formattedStatusDistribution[item._id] = item.count;
    });
    
    // Average delivery time calculation (for delivered packages)
    const deliveryTimeData = await Package.aggregate([
      {
        $match: {
          status: 'delivered',
          ...(req.user.role === 'customer' ? { customerId: req.user.id } : {})
        }
      },
      {
        $lookup: {
          from: 'trackinglogs',
          let: { packageId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$packageId', '$$packageId'] },
                status: { $in: ['created', 'delivered'] }
              }
            },
            { $sort: { createdAt: 1 } }
          ],
          as: 'logs'
        }
      },
      {
        $project: {
          trackingNumber: 1,
          createdEvent: { $arrayElemAt: ['$logs', 0] },
          deliveredEvent: { $arrayElemAt: [{ $filter: { input: '$logs', as: 'log', cond: { $eq: ['$$log.status', 'delivered'] } } }, 0] }
        }
      },
      {
        $match: {
          'deliveredEvent': { $exists: true, $ne: null }
        }
      },
      {
        $project: {
          trackingNumber: 1,
          deliveryTimeHours: {
            $divide: [
              { $subtract: ['$deliveredEvent.createdAt', '$createdEvent.createdAt'] },
              3600000 // Convert milliseconds to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageDeliveryTime: { $avg: '$deliveryTimeHours' },
          minDeliveryTime: { $min: '$deliveryTimeHours' },
          maxDeliveryTime: { $max: '$deliveryTimeHours' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const deliveryTimeStats = deliveryTimeData.length > 0 ? deliveryTimeData[0] : {
      averageDeliveryTime: 0,
      minDeliveryTime: 0,
      maxDeliveryTime: 0,
      count: 0
    };
    
    res.status(200).json({
      success: true,
      data: {
        timeRange: {
          startDate,
          endDate
        },
        statusChangesByDay: formattedStatusChanges,
        statusDistribution: formattedStatusDistribution,
        deliveryTimeStats: {
          averageDeliveryTime: Math.round(deliveryTimeStats.averageDeliveryTime * 10) / 10, // Round to 1 decimal place
          minDeliveryTime: Math.round(deliveryTimeStats.minDeliveryTime * 10) / 10,
          maxDeliveryTime: Math.round(deliveryTimeStats.maxDeliveryTime * 10) / 10,
          count: deliveryTimeStats.count
        }
      }
    });
  } catch (error) {
    console.error('Get tracking analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching tracking analytics' });
  }
};

/**
 * Delete tracking event (admin only)
 */
exports.deleteTrackingEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid tracking event ID format' });
    }
    
    const trackingEvent = await TrackingLog.findById(id);
    if (!trackingEvent) {
      return res.status(404).json({ success: false, message: 'Tracking event not found' });
    }
    
    await TrackingLog.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Tracking event deleted successfully'
    });
  } catch (error) {
    console.error('Delete tracking event error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting tracking event' });
  }
};