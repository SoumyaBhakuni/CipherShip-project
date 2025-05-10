const Package = require('../models/Package');
const QRCode = require('../models/QRCode');
const TrackingLog = require('../models/TrackingLog');
const User = require('../models/User');
const qrCodeService = require('../services/qrCodeService');
const encryptionService = require('../services/encryptionService');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const { validateObjectId } = require('../utils/validators');

/**
 * Create a new package
 */
exports.createPackage = async (req, res) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      customerEmail, 
      customerAddress, 
      packageDetails, 
      weight, 
      dimensions,
      customerId 
    } = req.body;

    // Check if customer exists if customerId provided
    let customer = null;
    if (customerId) {
      if (!validateObjectId(customerId)) {
        return res.status(400).json({ success: false, message: 'Invalid customer ID format' });
      }
      
      customer = await User.findById(customerId);
      if (!customer || customer.role !== 'customer') {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
    }

    // Create new package
    const newPackage = new Package({
      customerName: customer ? customer.name : customerName,
      customerPhone: customer ? customer.phone : customerPhone,
      customerEmail: customer ? customer.email : customerEmail,
      customerAddress: customer ? customer.address : customerAddress,
      customerId: customer ? customer._id : null,
      packageDetails,
      weight,
      dimensions,
      status: 'created',
      createdBy: req.user.id
    });

    await newPackage.save();

    // Generate tracking number
    const trackingNumber = `CS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    newPackage.trackingNumber = trackingNumber;
    await newPackage.save();

    // Create tracking log entry
    await TrackingLog.create({
      packageId: newPackage._id,
      status: 'created',
      message: 'Package has been created',
      userId: req.user.id
    });

    // Create encrypted QR code
    const packageData = {
      trackingNumber,
      customerName: newPackage.customerName,
      customerPhone: newPackage.customerPhone,
      customerAddress: newPackage.customerAddress,
      packageId: newPackage._id
    };

    // Encrypt sensitive data
    const encryptedData = encryptionService.encryptAES(JSON.stringify(packageData));

    // Generate QR code
    const qrCodeDataUrl = await qrCodeService.generateQRCode(encryptedData);

    // Save QR code data
    const qrCode = new QRCode({
      packageId: newPackage._id,
      encryptedData,
      qrCodeDataUrl
    });

    await qrCode.save();

    // Update package with QR code reference
    newPackage.qrCodeId = qrCode._id;
    await newPackage.save();

    // Send notification to customer if email is provided
    if (newPackage.customerEmail) {
      await emailService.sendPackageCreatedEmail(
        newPackage.customerEmail,
        newPackage.customerName,
        trackingNumber,
        qrCodeDataUrl
      );
    }

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: {
        package: newPackage,
        qrCodeUrl: qrCodeDataUrl
      }
    });
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating package' });
  }
};

/**
 * Get all packages with filters and pagination
 */
exports.getAllPackages = async (req, res) => {
  try {
    // Include pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Search by tracking number or customer details
    if (req.query.search) {
      filter.$or = [
        { trackingNumber: { $regex: req.query.search, $options: 'i' } },
        { customerName: { $regex: req.query.search, $options: 'i' } },
        { customerPhone: { $regex: req.query.search, $options: 'i' } },
        { customerEmail: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Filter by customer ID
    if (req.query.customerId && validateObjectId(req.query.customerId)) {
      filter.customerId = req.query.customerId;
    }
    
    // If user is a customer, only show their packages
    if (req.user.role === 'customer') {
      filter.customerId = req.user.id;
    }
    
    // Get packages with populated QR code
    const packages = await Package.find(filter)
      .populate('qrCodeId', 'qrCodeDataUrl')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Get total count
    const total = await Package.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: packages.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: packages
    });
  } catch (error) {
    console.error('Get all packages error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching packages' });
  }
};

/**
 * Get package by ID
 */
exports.getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }
    
    // Find package and populate QR code
    const package = await Package.findById(id).populate('qrCodeId');
    
    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    // If user is a customer, ensure they can only view their own packages
    if (req.user.role === 'customer' && package.customerId && package.customerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this package' });
    }
    
    // Get tracking history
    const trackingLogs = await TrackingLog.find({ packageId: id })
      .populate('userId', 'name email role')
      .sort({ createdAt: 1 });
    
    res.status(200).json({
      success: true,
      data: {
        package,
        trackingHistory: trackingLogs
      }
    });
  } catch (error) {
    console.error('Get package by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching package' });
  }
};

/**
 * Update package status
 */
exports.updatePackageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;
    
    // Validate ObjectId
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }
    
    // Validate status
    const validStatuses = ['created', 'in-transit', 'out-for-delivery', 'delivered', 'failed', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of: created, in-transit, out-for-delivery, delivered, failed, returned' 
      });
    }
    
    // Find package
    const package = await Package.findById(id);
    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    // Update package status
    package.status = status;
    await package.save();
    
    // Create tracking log entry
    const logMessage = message || `Package status updated to ${status}`;
    const trackingLog = new TrackingLog({
      packageId: package._id,
      status,
      message: logMessage,
      userId: req.user.id
    });
    
    await trackingLog.save();
    
    // Send email notification to customer if email exists
    if (package.customerEmail) {
      await emailService.sendStatusUpdateEmail(
        package.customerEmail,
        package.customerName,
        package.trackingNumber,
        status,
        logMessage
      );
    }
    
    // Send real-time notification if customer has an account
    if (package.customerId) {
      await notificationService.sendNotification(
        package.customerId,
        'Package Status Update',
        `Your package ${package.trackingNumber} status is now: ${status}`,
        {
          type: 'package_update',
          packageId: package._id,
          status
        }
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Package status updated successfully',
      data: {
        package,
        trackingLog
      }
    });
  } catch (error) {
    console.error('Update package status error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating package status' });
  }
};

/**
 * Update package details
 */
exports.updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }
    
    const package = await Package.findById(id);
    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    // Fields that can be updated
    const allowedUpdates = [
      'customerName', 
      'customerPhone', 
      'customerEmail', 
      'customerAddress', 
      'packageDetails', 
      'weight', 
      'dimensions'
    ];
    
    // Update only allowed fields
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        package[field] = req.body[field];
      }
    });
    
    await package.save();
    
    // If customer details were updated, update QR code as well
    if (
      req.body.customerName !== undefined || 
      req.body.customerPhone !== undefined || 
      req.body.customerAddress !== undefined
    ) {
      // Get QR code
      const qrCode = await QRCode.findById(package.qrCodeId);
      if (qrCode) {
        // Decrypt existing data
        const decryptedData = encryptionService.decryptAES(qrCode.encryptedData);
        const packageData = JSON.parse(decryptedData);
        
        // Update package data
        packageData.customerName = package.customerName;
        packageData.customerPhone = package.customerPhone;
        packageData.customerAddress = package.customerAddress;
        
        // Encrypt updated data
        const encryptedData = encryptionService.encryptAES(JSON.stringify(packageData));
        
        // Generate new QR code
        const qrCodeDataUrl = await qrCodeService.generateQRCode(encryptedData);
        
        // Update QR code
        qrCode.encryptedData = encryptedData;
        qrCode.qrCodeDataUrl = qrCodeDataUrl;
        await qrCode.save();
      }
    }
    
    // Create log entry for the update
    await TrackingLog.create({
      packageId: package._id,
      status: package.status,
      message: 'Package details updated',
      userId: req.user.id
    });
    
    res.status(200).json({
      success: true,
      message: 'Package updated successfully',
      data: package
    });
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating package' });
  }
};

/**
 * Delete package
 */
exports.deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }
    
    const package = await Package.findById(id);
    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    // Check if package is already delivered
    if (package.status === 'delivered') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete a package that has already been delivered' 
      });
    }
    
    // Delete associated QR code
    if (package.qrCodeId) {
      await QRCode.findByIdAndDelete(package.qrCodeId);
    }
    
    // Delete associated tracking logs
    await TrackingLog.deleteMany({ packageId: id });
    
    // Delete package
    await Package.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Package and associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting package' });
  }
};

/**
 * Get package stats
 */
exports.getPackageStats = async (req, res) => {
  try {
    // Define filter based on user role
    const filter = {};
    if (req.user.role === 'customer') {
      filter.customerId = req.user.id;
    }
    
    // Get count by status
    const statusStats = await Package.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format status stats
    const formattedStatusStats = {};
    statusStats.forEach(item => {
      formattedStatusStats[item._id] = item.count;
    });
    
    // Get total count
    const totalPackages = await Package.countDocuments(filter);
    formattedStatusStats.total = totalPackages;
    
    // Get packages created in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newPackages = await Package.countDocuments({
      ...filter,
      createdAt: { $gte: oneWeekAgo }
    });
    formattedStatusStats.newPackages = newPackages;
    
    // Get packages delivered in the last 7 days
    const recentDeliveries = await Package.countDocuments({
      ...filter,
      status: 'delivered',
      updatedAt: { $gte: oneWeekAgo }
    });
    formattedStatusStats.recentDeliveries = recentDeliveries;
    
    res.status(200).json({
      success: true,
      data: formattedStatusStats
    });
  } catch (error) {
    console.error('Get package stats error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching package statistics' });
  }
};

/**
 * Get package by tracking number
 */
exports.getPackageByTrackingNumber = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    const package = await Package.findOne({ trackingNumber });
    
    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    // Get tracking history
    const trackingLogs = await TrackingLog.find({ packageId: package._id })
      .sort({ createdAt: 1 });
    
    res.status(200).json({
      success: true,
      data: {
        package,
        trackingHistory: trackingLogs
      }
    });
  } catch (error) {
    console.error('Get package by tracking number error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching package' });
  }
};