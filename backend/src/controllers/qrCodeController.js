const QRCode = require('../models/QRCode');
const Package = require('../models/Package');
const TrackingLog = require('../models/TrackingLog');
const qrCodeService = require('../services/qrCodeService');
const encryptionService = require('../services/encryptionService');
const notificationService = require('../services/notificationService');
const { validateObjectId } = require('../utils/validators');

/**
 * Generate QR code for a package
 */
exports.generateQRCode = async (req, res) => {
  try {
    const { packageId } = req.body;
    
    // Validate ObjectId
    if (!validateObjectId(packageId)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }
    
    // Find package
    const package = await Package.findById(packageId);
    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    // Create package data object with sensitive information
    const packageData = {
      trackingNumber: package.trackingNumber,
      customerName: package.customerName,
      customerPhone: package.customerPhone,
      customerAddress: package.customerAddress,
      packageId: package._id
    };
    
    // Encrypt sensitive data
    const encryptedData = encryptionService.encryptAES(JSON.stringify(packageData));
    
    // Generate QR code
    const qrCodeDataUrl = await qrCodeService.generateQRCode(encryptedData);
    
    // Check if QR code already exists for this package
    let qrCode;
    if (package.qrCodeId) {
      // Update existing QR code
      qrCode = await QRCode.findById(package.qrCodeId);
      if (qrCode) {
        qrCode.encryptedData = encryptedData;
        qrCode.qrCodeDataUrl = qrCodeDataUrl;
        qrCode.updatedAt = Date.now();
        await qrCode.save();
      } else {
        // Create new QR code if the referenced one doesn't exist
        qrCode = new QRCode({
          packageId: package._id,
          encryptedData,
          qrCodeDataUrl
        });
        await qrCode.save();
        
        // Update package with QR code reference
        package.qrCodeId = qrCode._id;
        await package.save();
      }
    } else {
      // Create new QR code
      qrCode = new QRCode({
        packageId: package._id,
        encryptedData,
        qrCodeDataUrl
      });
      await qrCode.save();
      
      // Update package with QR code reference
      package.qrCodeId = qrCode._id;
      await package.save();
    }
    
    // Create log entry
    await TrackingLog.create({
      packageId: package._id,
      status: package.status,
      message: 'QR code generated/regenerated',
      userId: req.user.id
    });
    
    res.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        qrCodeId: qrCode._id,
        qrCodeDataUrl,
        packageId: package._id,
        trackingNumber: package.trackingNumber
      }
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ success: false, message: 'Server error while generating QR code' });
  }
};

/**
 * Get QR code by ID
 */
exports.getQRCodeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid QR code ID format' });
    }
    
    const qrCode = await QRCode.findById(id);
    if (!qrCode) {
      return res.status(404).json({ success: false, message: 'QR code not found' });
    }
    
    // Get associated package
    const package = await Package.findById(qrCode.packageId);
    if (!package) {
      return res.status(404).json({ success: false, message: 'Associated package not found' });
    }
    
    // If user is a customer, ensure they can only view their own packages' QR codes
    if (req.user.role === 'customer' && package.customerId && package.customerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this QR code' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        qrCode,
        package: {
          id: package._id,
          trackingNumber: package.trackingNumber,
          status: package.status
        }
      }
    });
  } catch (error) {
    console.error('Get QR code by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching QR code' });
  }
};

/**
 * Get QR code by package ID
 */
exports.getQRCodeByPackageId = async (req, res) => {
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
    
    // If user is a customer, ensure they can only view their own packages' QR codes
    if (req.user.role === 'customer' && package.customerId && package.customerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this QR code' });
    }
    
    // Find QR code
    const qrCode = await QRCode.findOne({ packageId });
    if (!qrCode) {
      return res.status(404).json({ success: false, message: 'QR code not found for this package' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        qrCode,
        package: {
          id: package._id,
          trackingNumber: package.trackingNumber,
          status: package.status
        }
      }
    });
  } catch (error) {
    console.error('Get QR code by package ID error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching QR code' });
  }
};

/**
 * Scan QR code (decode)
 */
exports.scanQRCode = async (req, res) => {
  try {
    const { encryptedData } = req.body;
    
    // Verify that the user is a delivery agent or admin
    if (req.user.role !== 'admin' && req.user.role !== 'delivery-agent') {
      return res.status(403).json({ success: false, message: 'Not authorized to scan QR codes' });
    }
    
    // Decrypt data
    try {
      const decryptedData = encryptionService.decryptAES(encryptedData);
      const packageData = JSON.parse(decryptedData);
      
      // Find associated package
      const package = await Package.findById(packageData.packageId);
      
      if (!package) {
        return res.status(404).json({ success: false, message: 'Associated package not found' });
      }
      
      // Log scan event
      await TrackingLog.create({
        packageId: package._id,
        status: package.status,
        message: `QR code scanned by ${req.user.name} (${req.user.role})`,
        userId: req.user.id
      });
      
      // Return the decrypted customer information
      res.status(200).json({
        success: true,
        message: 'QR code scanned successfully',
        data: {
          packageData,
          package: {
            id: package._id,
            trackingNumber: package.trackingNumber,
            status: package.status,
            details: package.packageDetails
          }
        }
      });
      
      // Notify customer if they have an account
      if (package.customerId) {
        await notificationService.sendNotification(
          package.customerId,
          'Package Scanned',
          `Your package (${package.trackingNumber}) was scanned by a delivery agent`,
          {
            type: 'package_scanned',
            packageId: package._id,
            status: package.status
          }
        );
      }
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Invalid QR code data' });
    }
  } catch (error) {
    console.error('Scan QR code error:', error);
    res.status(500).json({ success: false, message: 'Server error while scanning QR code' });
  }
};

/**
 * Verify QR code authenticity
 */
exports.verifyQRCode = async (req, res) => {
  try {
    const { encryptedData } = req.body;
    
    try {
      // Try to decrypt the data to verify authenticity
      const decryptedData = encryptionService.decryptAES(encryptedData);
      const packageData = JSON.parse(decryptedData);
      
      // Verify the package exists
      const package = await Package.findById(packageData.packageId);
      if (!package) {
        return res.status(200).json({ 
          success: true, 
          isValid: false, 
          message: 'QR code is invalid or associated package not found' 
        });
      }
      
      // Verify tracking number matches
      if (package.trackingNumber !== packageData.trackingNumber) {
        return res.status(200).json({ 
          success: true, 
          isValid: false, 
          message: 'QR code contains invalid tracking information' 
        });
      }
      
      res.status(200).json({
        success: true,
        isValid: true,
        message: 'QR code is valid',
        data: {
          trackingNumber: packageData.trackingNumber,
          status: package.status
        }
      });
    } catch (error) {
      // If decryption fails, the QR code is invalid
      res.status(200).json({ 
        success: true, 
        isValid: false, 
        message: 'QR code is invalid or has been tampered with' 
      });
    }
  } catch (error) {
    console.error('Verify QR code error:', error);
    res.status(500).json({ success: false, message: 'Server error while verifying QR code' });
  }
};

/**
 * Get scan history for a QR code
 */
exports.getScanHistory = async (req, res) => {
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
    
    // If user is a customer, ensure they can only view their own packages' scan history
    if (req.user.role === 'customer' && package.customerId && package.customerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this scan history' });
    }
    
    // Find scan logs
    const scanLogs = await TrackingLog.find({
      packageId,
      message: { $regex: /QR code scanned/ }
    })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: scanLogs.length,
      data: scanLogs
    });
  } catch (error) {
    console.error('Get scan history error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching scan history' });
  }
};

/**
 * Invalidate QR code (for security reasons)
 */
exports.invalidateQRCode = async (req, res) => {
  try {
    const { packageId } = req.body;
    
    // Validate ObjectId
    if (!validateObjectId(packageId)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }
    
    // Find package
    const package = await Package.findById(packageId);
    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    // Find QR code
    if (!package.qrCodeId) {
      return res.status(404).json({ success: false, message: 'No QR code associated with this package' });
    }
    
    // Delete old QR code
    await QRCode.findByIdAndDelete(package.qrCodeId);
    
    // Create package data object with sensitive information
    const packageData = {
      trackingNumber: package.trackingNumber,
      customerName: package.customerName,
      customerPhone: package.customerPhone,
      customerAddress: package.customerAddress,
      packageId: package._id
    };
    
    // Generate new encryption key and IV for this QR code
    // Encrypt sensitive data with new key
    const encryptedData = encryptionService.encryptAES(JSON.stringify(packageData));
    
    // Generate new QR code
    const qrCodeDataUrl = await qrCodeService.generateQRCode(encryptedData);
    
    // Create new QR code
    const newQRCode = new QRCode({
      packageId: package._id,
      encryptedData,
      qrCodeDataUrl
    });
    
    await newQRCode.save();
    
    // Update package with new QR code reference
    package.qrCodeId = newQRCode._id;
    await package.save();
    
    // Create log entry
    await TrackingLog.create({
      packageId: package._id,
      status: package.status,
      message: 'QR code invalidated and regenerated for security',
      userId: req.user.id
    });
    
    res.status(200).json({
      success: true,
      message: 'QR code successfully invalidated and regenerated',
      data: {
        qrCodeId: newQRCode._id,
        qrCodeDataUrl
      }
    });
  } catch (error) {
    console.error('Invalidate QR code error:', error);
    res.status(500).json({ success: false, message: 'Server error while invalidating QR code' });
  }
};