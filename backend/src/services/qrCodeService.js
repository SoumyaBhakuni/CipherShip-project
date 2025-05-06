const qrcode = require('qrcode');
const { encryptAES, decryptAES } = require('./encryptionService');
const QRCode = require('../models/QRCode');
const Package = require('../models/Package');
const TrackingLog = require('../models/TrackingLog');

// Generate QR code with encrypted data
exports.generateQRCode = async (packageId) => {
  try {
    // Get package details
    const package = await Package.findById(packageId);
    
    if (!package) {
      throw new Error('Package not found');
    }
    
    // Prepare data to encrypt
    const dataToEncrypt = {
      trackingNumber: package.trackingNumber,
      recipientName: package.recipient.name,
      recipientAddress: package.recipient.address,
      recipientPhone: package.recipient.phone,
      recipientEmail: package.recipient.email,
      packageId: package._id.toString(),
    };
    
    // Encrypt data
    const encryptedData = encryptAES(dataToEncrypt);
    
    // Calculate expiry (e.g., 30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Create QR code record
    const qrCodeRecord = await QRCode.create({
      packageId,
      encryptedData,
      expiresAt,
      isActive: true,
    });
    
    // Generate QR code image
    const qrCodeImage = await qrcode.toDataURL(encryptedData);
    
    // Log the creation
    await TrackingLog.create({
      packageId,
      action: 'created',
      details: 'QR code generated',
    });
    
    return {
      qrCodeId: qrCodeRecord._id,
      qrCodeImage,
      expiresAt,
    };
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

// Decode and verify QR code
exports.decodeQRCode = async (encryptedData, userId) => {
  try {
    // Find QR code in database
    const qrCode = await QRCode.findOne({ encryptedData });
    
    if (!qrCode) {
      throw new Error('Invalid QR code');
    }
    
    if (!qrCode.isActive) {
      throw new Error('QR code is no longer active');
    }
    
    if (new Date() > qrCode.expiresAt) {
      throw new Error('QR code has expired');
    }
    
    // Decrypt data
    const decryptedData = decryptAES(encryptedData);
    
    // Log the scan
    await TrackingLog.create({
      packageId: qrCode.packageId,
      scannedBy: userId,
      action: 'scanned',
      details: 'QR code scanned',
    });
    
    return {
      success: true,
      data: decryptedData,
    };
  } catch (error) {
    throw new Error(`Failed to decode QR code: ${error.message}`);
  }
};