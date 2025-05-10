const { ROLES } = require('../config/constants');
const { createLogger } = require('../utils/logger');

const logger = createLogger('rbac-middleware');

/**
 * Role-Based Access Control (RBAC) middleware
 * 
 * Creates middleware functions that authorize user access based on roles
 */

/**
 * Check if user has one of the allowed roles
 * @param {Array} allowedRoles - Array of roles that are allowed to access the route
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Authentication middleware should run before this, so we should have a user
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required before authorization.'
        });
      }

      // Check if user role is in allowed roles
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }

      // Log unauthorized access attempt
      logger.warn(`Unauthorized access attempt by ${req.user.email} (${req.user.role}) to a resource requiring roles: ${allowedRoles.join(', ')}`);

      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access this resource.'
      });
    } catch (error) {
      logger.error('RBAC authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during authorization check.'
      });
    }
  };
};

// Common middleware for specific roles
const isAdmin = authorize([ROLES.ADMIN]);
const isDeliveryAgent = authorize([ROLES.DELIVERY_AGENT, ROLES.ADMIN]);
const isCustomer = authorize([ROLES.CUSTOMER, ROLES.ADMIN]);
const isAdminOrDeliveryAgent = authorize([ROLES.ADMIN, ROLES.DELIVERY_AGENT]);
const isAdminOrCustomer = authorize([ROLES.ADMIN, ROLES.CUSTOMER]);
const isAnyRole = authorize([ROLES.ADMIN, ROLES.DELIVERY_AGENT, ROLES.CUSTOMER]);

/**
 * Check if user is the owner of the resource or has admin privileges
 * @param {Function} getResourceOwnerId - Function to extract owner ID from request object
 */
const isOwnerOrAdmin = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      // Admin can access any resource
      if (req.user.role === ROLES.ADMIN) {
        return next();
      }

      // Extract owner ID using the provided function
      const ownerId = await getResourceOwnerId(req);
      
      // Allow access if user is the owner
      if (ownerId && ownerId.toString() === req.user._id.toString()) {
        return next();
      }

      // Log unauthorized access attempt
      logger.warn(`Resource ownership check failed for user ${req.user.email} (${req.user._id}) - attempted to access resource owned by ${ownerId}`);

      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the owner of this resource.'
      });
    } catch (error) {
      logger.error('Resource ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during resource ownership check.'
      });
    }
  };
};

/**
 * Check if user is a delivery agent assigned to the package
 * @param {Function} getPackageId - Function to extract package ID from request
 */
const isAssignedAgentOrAdmin = (getPackageId) => {
  return async (req, res, next) => {
    try {
      // Admin can access any package
      if (req.user.role === ROLES.ADMIN) {
        return next();
      }

      // Only delivery agents can be assigned to packages
      if (req.user.role !== ROLES.DELIVERY_AGENT) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only delivery agents can perform this action.'
        });
      }

      const packageId = await getPackageId(req);
      
      // Get package from database (assuming we have a Package model imported)
      const Package = require('../models/Package');
      const packageDoc = await Package.findById(packageId);
      
      if (!packageDoc) {
        return res.status(404).json({
          success: false,
          message: 'Package not found.'
        });
      }

      // Check if the delivery agent is assigned to this package
      if (packageDoc.assignedAgent && 
          packageDoc.assignedAgent.toString() === req.user._id.toString()) {
        return next();
      }

      // Log unauthorized access attempt
      logger.warn(`Package assignment check failed for agent ${req.user.email} (${req.user._id}) - attempted to access package ${packageId}`);

      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to this package.'
      });
    } catch (error) {
      logger.error('Package assignment check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during package assignment check.'
      });
    }
  };
};

module.exports = {
  authorize,
  isAdmin,
  isDeliveryAgent,
  isCustomer,
  isAdminOrDeliveryAgent,
  isAdminOrCustomer,
  isAnyRole,
  isOwnerOrAdmin,
  isAssignedAgentOrAdmin
};