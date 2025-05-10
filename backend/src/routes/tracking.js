const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { authenticateJWT } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validateTrackingUpdate } = require('../middleware/validation');

/**
 * @route   GET /api/tracking/:trackingNumber
 * @desc    Get tracking information by tracking number
 * @access  Public (with limited info) or Private (full info)
 */
router.get('/:trackingNumber', trackingController.getTrackingByNumber);

/**
 * @route   POST /api/tracking/:packageId/update
 * @desc    Add a tracking update for a package
 * @access  Private/Admin or Delivery Agent
 */
router.post('/:packageId/update', authenticateJWT, checkRole(['admin', 'delivery_agent']), validateTrackingUpdate, trackingController.addTrackingUpdate);

/**
 * @route   GET /api/tracking/package/:packageId
 * @desc    Get tracking history for a package
 * @access  Private
 */
router.get('/package/:packageId', authenticateJWT, trackingController.getTrackingHistory);

/**
 * @route   GET /api/tracking/logs
 * @desc    Get all tracking logs (admin only)
 * @access  Private/Admin
 */
router.get('/logs', authenticateJWT, checkRole('admin'), trackingController.getAllTrackingLogs);

/**
 * @route   GET /api/tracking/logs/recent
 * @desc    Get recent tracking activities
 * @access  Private/Admin
 */
router.get('/logs/recent', authenticateJWT, checkRole('admin'), trackingController.getRecentTrackingLogs);

/**
 * @route   GET /api/tracking/agent/:agentId
 * @desc    Get tracking updates by delivery agent
 * @access  Private/Admin or Self (if agent)
 */
router.get('/agent/:agentId', authenticateJWT, trackingController.getTrackingByAgent);

/**
 * @route   GET /api/tracking/customer/:customerId
 * @desc    Get tracking updates for a customer's packages
 * @access  Private/Admin or Self (if customer)
 */
router.get('/customer/:customerId', authenticateJWT, trackingController.getTrackingByCustomer);

/**
 * @route   POST /api/tracking/:packageId/delivered
 * @desc    Mark package as delivered with signature/photo confirmation
 * @access  Private/Delivery Agent
 */
router.post('/:packageId/delivered', authenticateJWT, checkRole('delivery_agent'), trackingController.markPackageDelivered);

/**
 * @route   POST /api/tracking/:packageId/failed
 * @desc    Record a failed delivery attempt
 * @access  Private/Delivery Agent
 */
router.post('/:packageId/failed', authenticateJWT, checkRole('delivery_agent'), trackingController.recordFailedDelivery);

module.exports = router;