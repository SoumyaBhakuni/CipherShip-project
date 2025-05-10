/**
 * Validator utilities for Cipher Ship application
 * Contains reusable validation functions for different data types
 */

const validator = require('validator');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

/**
 * Validates email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email is valid
 */
const isValidEmail = (email) => {
  if (!email) return false;
  return validator.isEmail(email);
};

/**
 * Validates phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if phone number is valid
 */
const isValidPhone = (phone) => {
  if (!phone) return false;
  // Remove spaces, dashes, parentheses and validate
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return validator.isMobilePhone(cleanPhone);
};

/**
 * Validates postal/zip code format
 * @param {string} postalCode - Postal code to validate
 * @param {string} countryCode - ISO country code (default: 'US')
 * @returns {boolean} - True if postal code is valid for the country
 */
const isValidPostalCode = (postalCode, countryCode = 'US') => {
  if (!postalCode) return false;
  return validator.isPostalCode(postalCode, countryCode);
};

/**
 * Validates MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} - True if ID is a valid MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  if (!id) return false;
  return ObjectId.isValid(id);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid flag and message
 */
const validatePasswordStrength = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasUpperCase) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!hasLowerCase) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!hasNumbers) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  if (!hasSpecialChar) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  return { isValid: true, message: 'Password is strong' };
};

/**
 * Validates tracking number format
 * @param {string} trackingNumber - Tracking number to validate
 * @returns {boolean} - True if tracking number has valid format
 */
const isValidTrackingNumber = (trackingNumber) => {
  if (!trackingNumber) return false;
  
  // Cipher Ship tracking format is CS-YYYYMMDD-XXXXX
  // where XXXXX is alphanumeric
  const trackingRegex = /^CS-\d{8}-[A-Z0-9]{5}$/;
  return trackingRegex.test(trackingNumber);
};

/**
 * Sanitizes input text to prevent XSS attacks
 * @param {string} text - Input text to sanitize
 * @returns {string} - Sanitized text
 */
const sanitizeText = (text) => {
  if (!text) return '';
  return validator.escape(text);
};

/**
 * Validates if string is a valid ISO date
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid ISO date
 */
const isValidDate = (dateString) => {
  if (!dateString) return false;
  return validator.isISO8601(dateString);
};

/**
 * Validates address object
 * @param {Object} address - Address object to validate
 * @returns {Object} - Validation results with errors array
 */
const validateAddress = (address) => {
  const errors = [];
  
  if (!address) {
    return { isValid: false, errors: ['Address is required'] };
  }
  
  // Required fields
  if (!address.street) errors.push('Street is required');
  if (!address.city) errors.push('City is required');
  if (!address.state) errors.push('State/Province is required');
  if (!address.postalCode) errors.push('Postal code is required');
  if (!address.country) errors.push('Country is required');
  
  // Format validations
  if (address.postalCode && !isValidPostalCode(address.postalCode, address.country)) {
    errors.push('Invalid postal code format');
  }
  
  // Sanitize all address fields
  if (errors.length === 0) {
    for (const key in address) {
      if (typeof address[key] === 'string') {
        address[key] = sanitizeText(address[key]);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedAddress: errors.length === 0 ? address : null
  };
};

/**
 * Validates package dimensions and weight
 * @param {Object} dimensions - Package dimensions object
 * @returns {Object} - Validation results with errors array
 */
const validatePackageDimensions = (dimensions) => {
  const errors = [];
  
  if (!dimensions) {
    return { isValid: false, errors: ['Dimensions are required'] };
  }
  
  // Check required fields
  if (dimensions.weight === undefined) errors.push('Weight is required');
  if (dimensions.length === undefined) errors.push('Length is required');
  if (dimensions.width === undefined) errors.push('Width is required');
  if (dimensions.height === undefined) errors.push('Height is required');
  
  // Validate each dimension is positive number
  if (dimensions.weight !== undefined && (isNaN(dimensions.weight) || dimensions.weight <= 0)) {
    errors.push('Weight must be a positive number');
  }
  
  if (dimensions.length !== undefined && (isNaN(dimensions.length) || dimensions.length <= 0)) {
    errors.push('Length must be a positive number');
  }
  
  if (dimensions.width !== undefined && (isNaN(dimensions.width) || dimensions.width <= 0)) {
    errors.push('Width must be a positive number');
  }
  
  if (dimensions.height !== undefined && (isNaN(dimensions.height) || dimensions.height <= 0)) {
    errors.push('Height must be a positive number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates 2FA verification code format
 * @param {string} code - 2FA code to validate
 * @returns {boolean} - True if code is valid
 */
const isValidTwoFactorCode = (code) => {
  if (!code) return false;
  
  // 2FA codes are typically 6 digits
  const twoFactorCodeRegex = /^\d{6}$/;
  return twoFactorCodeRegex.test(code);
};

/**
 * Validates QR code data format
 * @param {string} data - QR code data string
 * @returns {boolean} - True if QR code data is valid format
 */
const isValidQRCodeData = (data) => {
  if (!data) return false;
  
  try {
    // QR code data should be valid JSON when decrypted
    const parsed = JSON.parse(data);
    
    // Check for required fields in QR code data
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      parsed.packageId !== undefined &&
      parsed.trackingNumber !== undefined
    );
  } catch (err) {
    return false;
  }
};

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is valid
 */
const isValidUrl = (url) => {
  if (!url) return false;
  return validator.isURL(url, { require_protocol: true });
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidPostalCode,
  isValidObjectId,
  validatePasswordStrength,
  isValidTrackingNumber,
  sanitizeText,
  isValidDate,
  validateAddress,
  validatePackageDimensions,
  isValidTwoFactorCode,
  isValidQRCodeData,
  isValidUrl
};