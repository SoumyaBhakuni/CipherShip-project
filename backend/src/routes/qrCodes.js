const express = require('express');
const router = express.Router();
const qrCodeController = require('../controllers/qrCodeController');
const { authenticateJWT } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validateQRGeneration } = require('../middleware/validation');

/**
 * @route   POST /api/qr-codes/generate
 * @desc    Generate QR code for a package
 * @access  Private/Admin
 */
router.post('/generate', authenticateJWT, checkRole('admin'), validateQRGeneration, qrCodeController.generateQRCode);

/**
 * @route   GET /api/qr-codes/:id
 * @desc    Get QR code by ID
 * @access  Private
 */
router.get('/:id', authenticateJWT, qrCodeController.getQRCodeById);

/**
 * @route   GET /api/qr-codes/package/:packageId
 * @desc    Get QR code by package ID
 * @access  Private
 */
router.get('/package/:packageId', authenticateJWT, qrCodeController.getQRCodeByPackage);

/**
 * @route   POST /api/qr-codes/scan
 * @desc    Scan and decrypt QR code
 * @access  Private/Delivery Agent
 */
router.post('/scan', authenticateJWT, checkRole('delivery_agent'), qrCodeController.scanQRCode);

/**
 * @route   POST /api/qr-codes/verify
 * @desc    Verify QR code authenticity
 * @access  Private/Delivery Agent
 */
router.post('/verify', authenticateJWT, checkRole('delivery_agent'), qrCodeController.verifyQRCode);

/**
 * @route   GET /api/qr-codes/logs/:qrCodeId
 * @desc    Get scan logs for a QR code
 * @access  Private/Admin
 */
router.get('/logs/:qrCodeId', authenticateJWT, checkRole('admin'), qrCodeController.getQRCodeLogs);

/**
 * @route   POST /api/qr-codes/:id/regenerate
 * @desc    Regenerate QR code (if compromised)
 * @access  Private/Admin
 */
router.post('/:id/regenerate', authenticateJWT, checkRole('admin'), qrCodeController.regenerateQRCode);

/**
 * @route   POST /api/qr-codes/:id/invalidate
 * @desc    Invalidate QR code
 * @access  Private/Admin
 */
router.post('/:id/invalidate', authenticateJWT, checkRole('admin'), qrCodeController.invalidateQRCode);

module.exports = router;