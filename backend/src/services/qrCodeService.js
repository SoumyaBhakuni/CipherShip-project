// qrCodeService.js
const QRCode = require('qrcode');
const encryptionService = require('./encryptionService');
const QRCodeModel = require('../models/QRCode');
const TrackingLog = require('../models/TrackingLog');
const { v4: uuidv4 } = require('uuid');

/**
 * Service for generating, storing, and processing QR codes
 */
class QRCodeService {
  /**
   * Generate an encrypted QR code for customer delivery information
   * @param {Object} customerData - Customer information for delivery
   * @param {string} customerData.name - Customer name
   * @param {string} customerData.phone - Customer phone number
   * @param {string} customerData.address - Customer address
   * @param {string} packageId - The ID of the package
   * @param {string} userId - The ID of the user creating the QR code
   * @returns {Promise<Object>} - QR code data and image
   */
  async generateQRCode(customerData, packageId, userId) {
    try {
      // Create a unique ID for this QR code
      const qrCodeId = uuidv4();
      
      // Create payload with customer data and metadata
      const payload = {
        id: qrCodeId,
        packageId,
        customerData,
        timestamp: new Date().toISOString()
      };
      
      // Encrypt the payload
      const encryptedData = encryptionService.encryptAES(JSON.stringify(payload));
      
      // Generate QR code image
      const qrCodeImage = await QRCode.toDataURL(encryptedData);
      
      // Store QR code information in database
      const newQRCode = new QRCodeModel({
        qrCodeId,
        packageId,
        encryptedData,
        createdBy: userId,
        status: 'active'
      });
      
      await newQRCode.save();
      
      return {
        qrCodeId,
        packageId,
        qrCodeImage,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Decode and decrypt a QR code
   * @param {string} encryptedData - The encrypted data from the QR code
   * @param {string} scannerUserId - ID of the user scanning the QR code
   * @returns {Promise<Object>} - Decrypted customer data
   */
  async decodeQRCode(encryptedData, scannerUserId) {
    try {
      // Decrypt the data
      const decryptedData = encryptionService.decryptAES(encryptedData);
      const payload = JSON.parse(decryptedData);
      
      // Retrieve QR code from database to verify it's valid
      const qrCode = await QRCodeModel.findOne({ qrCodeId: payload.id });
      
      if (!qrCode) {
        throw new Error('Invalid QR code');
      }
      
      if (qrCode.status !== 'active') {
        throw new Error('QR code is no longer active');
      }
      
      // Log this scan
      await this.logQRCodeScan(payload.id, scannerUserId, payload.packageId);
      
      return {
        ...payload,
        scannedAt: new Date()
      };
    } catch (error) {
      console.error('QR Code decoding error:', error);
      throw new Error('Failed to decode QR code');
    }
  }
  
  /**
   * Log a QR code scan for security and tracking
   * @param {string} qrCodeId - ID of the QR code
   * @param {string} userId - ID of the user who scanned the code
   * @param {string} packageId - ID of the package
   * @returns {Promise<Object>} - Created log entry
   */
  async logQRCodeScan(qrCodeId, userId, packageId) {
    try {
      const log = new TrackingLog({
        qrCodeId,
        scannedBy: userId,
        packageId,
        action: 'qr-scan',
        timestamp: new Date(),
        metadata: {
          userAgent: 'API request',
          scanType: 'delivery-agent-scan'
        }
      });
      
      return await log.save();
    } catch (error) {
      console.error('QR Code logging error:', error);
      throw new Error('Failed to log QR code scan');
    }
  }
  
  /**
   * Invalidate a QR code after successful delivery or for security reasons
   * @param {string} qrCodeId - ID of the QR code to invalidate
   * @param {string} userId - ID of the user invalidating the code
   * @returns {Promise<Object>} - Updated QR code data
   */
  async invalidateQRCode(qrCodeId, userId) {
    try {
      const qrCode = await QRCodeModel.findOneAndUpdate(
        { qrCodeId },
        { 
          status: 'inactive',
          updatedAt: new Date(),
          updatedBy: userId
        },
        { new: true }
      );
      
      if (!qrCode) {
        throw new Error('QR code not found');
      }
      
      // Log this invalidation
      await this.logQRCodeScan(qrCodeId, userId, qrCode.packageId);
      
      return qrCode;
    } catch (error) {
      console.error('QR Code invalidation error:', error);
      throw new Error('Failed to invalidate QR code');
    }
  }
  
  /**
   * Get scan history for a specific QR code
   * @param {string} qrCodeId - ID of the QR code
   * @returns {Promise<Array>} - List of scan logs
   */
  async getQRCodeScanHistory(qrCodeId) {
    try {
      return await TrackingLog.find({ qrCodeId })
        .sort({ timestamp: -1 })
        .populate('scannedBy', 'name email role');
    } catch (error) {
      console.error('QR Code history error:', error);
      throw new Error('Failed to retrieve QR code scan history');
    }
  }
}

module.exports = new QRCodeService();
