const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticateJWT } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validatePackage } = require('../middleware/validation');

/**
 * @route   POST /api/packages
 * @desc    Create a new package
 * @access  Private/Admin
 */
router.post('/', authenticateJWT, checkRole('admin'), validatePackage, packageController.createPackage);

/**
 * @route   GET /api/packages
 * @desc    Get all packages (filtered by role)
 * @access  Private
 */
router.get('/', authenticateJWT, packageController.getAllPackages);

/**
 * @route   GET /api/packages/:id
 * @desc    Get package by ID
 * @access  Private
 */
router.get('/:id', authenticateJWT, packageController.getPackageById);

/**
 * @route   PUT /api/packages/:id
 * @desc    Update package
 * @access  Private/Admin
 */
router.put('/:id', authenticateJWT, checkRole('admin'), validatePackage, packageController.updatePackage);

/**
 * @route   DELETE /api/packages/:id
 * @desc    Delete package
 * @access  Private/Admin
 */
router.delete('/:id', authenticateJWT, checkRole('admin'), packageController.deletePackage);

/**
 * @route   POST /api/packages/:id/status
 * @desc    Update package status
 * @access  Private/Admin or Delivery Agent
 */
router.post('/:id/status', authenticateJWT, checkRole(['admin', 'delivery_agent']), packageController.updatePackageStatus);

/**
 * @route   GET /api/packages/customer/:customerId
 * @desc    Get packages by customer ID
 * @access  Private/Admin or Self
 */
router.get('/customer/:customerId', authenticateJWT, packageController.getPackagesByCustomer);

/**
 * @route   GET /api/packages/agent/:agentId
 * @desc    Get packages assigned to a delivery agent
 * @access  Private/Admin or Self (if agent)
 */
router.get('/agent/:agentId', authenticateJWT, packageController.getPackagesByAgent);

/**
 * @route   POST /api/packages/:id/assign
 * @desc    Assign package to delivery agent
 * @access  Private/Admin
 */
router.post('/:id/assign', authenticateJWT, checkRole('admin'), packageController.assignPackageToAgent);

module.exports = router;