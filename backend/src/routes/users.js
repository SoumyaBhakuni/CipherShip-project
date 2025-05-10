const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateJWT } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { validateUserUpdate } = require('../middleware/validation');

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/', authenticateJWT, checkRole('admin'), userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin or Self
 */
router.get('/:id', authenticateJWT, userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private/Admin or Self
 */
router.put('/:id', authenticateJWT, validateUserUpdate, userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/:id', authenticateJWT, checkRole('admin'), userController.deleteUser);

/**
 * @route   POST /api/users/:id/role
 * @desc    Change user role (admin only)
 * @access  Private/Admin
 */
router.post('/:id/role', authenticateJWT, checkRole('admin'), userController.changeUserRole);

/**
 * @route   GET /api/users/delivery-agents
 * @desc    Get all delivery agents (admin only)
 * @access  Private/Admin
 */
router.get('/delivery-agents', authenticateJWT, checkRole('admin'), userController.getDeliveryAgents);

/**
 * @route   GET /api/users/customer/:id
 * @desc    Get customer details (admin or delivery agent)
 * @access  Private/Admin or Delivery Agent
 */
router.get('/customer/:id', authenticateJWT, checkRole(['admin', 'delivery_agent']), userController.getCustomerDetails);

module.exports = router;