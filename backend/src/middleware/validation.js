const { validationResult } = require('express-validator');
const { VALIDATION } = require('../config/constants');
const { createLogger } = require('../utils/logger');
const validators = require('../utils/validators');

const logger = createLogger('validation-middleware');

/**
 * Middleware to validate request data using express-validator
 * @param {Array} validations - Array of express-validator validations
 */
const validate = (validations) => {
  return async (req, res, next) => {
    try {
      // Run all validations
      for (let validation of validations) {
        await validation.run(req);
      }

      // Check for validation errors
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        logger.warn('Validation failed:', { 
          path: req.path, 
          errors: errors.array(),
          body: req.body,
          user: req.user ? req.user._id : 'unauthenticated'
        });
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array().map(err => ({
            field: err.param,
            message: err.msg
          }))
        });
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during validation.'
      });
    }
  };
};

/**
 * Common validation chains for reuse
 */
const commonValidations = {
  // User related validations
  email: validators.validateEmail(),
  password: validators.validatePassword(),
  firstName: validators.validateName('firstName'),
  lastName: validators.validateName('lastName'),
  phone: validators.validatePhone(),
  role: validators.validateRole(),
  userId: validators.validateMongoId('userId'),
  
  // Package related validations
  trackingNumber: validators.validateTrackingNumber(),
  packageId: validators.validateMongoId('packageId'),
  recipientName: validators.validateString('recipient.name', 2, 100),
  recipientEmail: validators.validateEmail('recipient.email'),
  recipientPhone: validators.validatePhone('recipient.phone'),
  
  // Address validations
  street: validators.validateString('deliveryAddress.street', 2, 100),
  city: validators.validateString('deliveryAddress.city', 2, 50),
  state: validators.validateString('deliveryAddress.state', 2, 50),
  zipCode: validators.validateZipCode('deliveryAddress.zipCode'),
  country: validators.validateString('deliveryAddress.country', 2, 50),
  
  // QR code validations
  qrCodeId: validators.validateMongoId('qrCodeId'),
  
  // Two factor authentication
  twoFactorCode: validators.validateTwoFactorCode(),
  
  // Pagination
  page: validators.validatePagination('page'),
  limit: validators.validatePagination('limit'),
  
  // Search
  searchTerm: validators.validateSearchTerm()
};

/**
 * Sanitize user input to prevent injection attacks
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize req.body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          // Basic sanitization - replace script tags and potentially harmful characters
          req.body[key] = req.body[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/[<>"'`=;()]/g, match => `&#${match.charCodeAt(0)};`);
        }
      });
    }
    
    // Sanitize req.params
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        if (typeof req.params[key] === 'string') {
          req.params[key] = req.params[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/[<>"'`=;()]/g, match => `&#${match.charCodeAt(0)};`);
        }
      });
    }
    
    // Sanitize req.query
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = req.query[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/[<>"'`=;()]/g, match => `&#${match.charCodeAt(0)};`);
        }
      });
    }
    
    next();
  } catch (error) {
    logger.error('Sanitization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during input sanitization.'
    });
  }
};

/**
 * Create validation middlewares for common routes
 */

// User validation middleware
const validateCreateUser = validate([
  commonValidations.email,
  commonValidations.password,
  commonValidations.firstName,
  commonValidations.lastName,
  commonValidations.phone,
  commonValidations.role
]);

// Package validation middleware
const validateCreatePackage = validate([
  commonValidations.recipientName,
  commonValidations.recipientEmail,
  commonValidations.recipientPhone,
  commonValidations.street,
  commonValidations.city,
  commonValidations.state,
  commonValidations.zipCode,
  commonValidations.country
]);

// Login validation middleware
const validateLogin = validate([
  commonValidations.email,
  commonValidations.password
]);

// Two-factor validation middleware
const validateTwoFactor = validate([
  commonValidations.twoFactorCode
]);

module.exports = {
  validate,
  commonValidations,
  sanitizeInput,
  validateCreateUser,
  validateCreatePackage,
  validateLogin,
  validateTwoFactor
};