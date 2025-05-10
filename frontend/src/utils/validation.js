/**
 * Validation utility functions for Cipher Ship
 * This module provides validation functions for different types of user inputs
 */

/**
 * Validates an email address
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
export const validateEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * Validates a password for security requirements
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with status and message
   */
  export const validatePassword = (password) => {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }
    
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character' };
    }
    
    return { isValid: true, message: 'Password is valid' };
  };
  
  /**
   * Validates phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if phone number is valid
   */
  export const validatePhone = (phone) => {
    if (!phone) return false;
    
    // Remove any non-digit characters for standardization
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Basic validation for international numbers
    // This is a simplified check - adjust based on your requirements
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  };
  
  /**
   * Validates a name (first name or last name)
   * @param {string} name - Name to validate
   * @returns {boolean} True if name is valid
   */
  export const validateName = (name) => {
    if (!name) return false;
    
    // Check if name contains at least 2 characters and only alphabets and spaces
    return name.trim().length >= 2 && /^[A-Za-z\s'-]+$/.test(name);
  };
  
  /**
   * Validates a username
   * @param {string} username - Username to validate
   * @returns {boolean} True if username is valid
   */
  export const validateUsername = (username) => {
    if (!username) return false;
    
    // Username must be 3-20 characters and can only contain alphanumeric characters and underscores
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  };
  
  /**
   * Validates a postal/zip code
   * Note: This is a general validation that should be customized based on country-specific formats
   * @param {string} code - Postal/zip code to validate
   * @returns {boolean} True if postal code is valid
   */
  export const validatePostalCode = (code) => {
    if (!code) return false;
    
    // Simple validation for common formats (US, Canada, UK, etc.)
    // Adjust based on your target countries
    return /^[A-Za-z0-9\s-]{3,10}$/.test(code.trim());
  };
  
  /**
   * Validates a street address
   * @param {string} address - Street address to validate
   * @returns {boolean} True if address is valid
   */
  export const validateAddress = (address) => {
    if (!address) return false;
    
    // Basic validation to ensure address is not too short
    return address.trim().length >= 5;
  };
  
  /**
   * Validates a city name
   * @param {string} city - City name to validate
   * @returns {boolean} True if city is valid
   */
  export const validateCity = (city) => {
    if (!city) return false;
    
    // City should only contain alphabets, spaces, and some special characters
    return city.trim().length >= 2 && /^[A-Za-z\s'.,-]+$/.test(city);
  };
  
  /**
   * Validates a state/province name or code
   * @param {string} state - State/province to validate
   * @returns {boolean} True if state is valid
   */
  export const validateState = (state) => {
    if (!state) return false;
    
    // State should only contain alphabets, spaces, and some special characters
    // Or it could be a 2-letter state code
    return (state.trim().length >= 2 && /^[A-Za-z\s'.,-]+$/.test(state)) || 
           /^[A-Z]{2}$/.test(state.trim());
  };
  
  /**
   * Validates a country name
   * @param {string} country - Country name to validate
   * @returns {boolean} True if country is valid
   */
  export const validateCountry = (country) => {
    if (!country) return false;
    
    // Country should only contain alphabets and spaces
    return country.trim().length >= 2 && /^[A-Za-z\s'.,-]+$/.test(country);
  };
  
  /**
   * Validates a two-factor authentication (2FA) code
   * @param {string} code - 2FA code to validate
   * @returns {boolean} True if 2FA code is valid
   */
  export const validate2FACode = (code) => {
    if (!code) return false;
    
    // 2FA codes are typically 6 digits
    return /^\d{6}$/.test(code.trim());
  };
  
  /**
   * Validates a credit card number using Luhn algorithm
   * @param {string} cardNumber - Credit card number to validate
   * @returns {boolean} True if card number is valid
   */
  export const validateCreditCard = (cardNumber) => {
    if (!cardNumber) return false;
    
    // Remove any non-digit characters
    const digitsOnly = cardNumber.replace(/\D/g, '');
    
    // Check if it's a valid length for most credit cards
    if (digitsOnly.length < 13 || digitsOnly.length > 19) {
      return false;
    }
    
    // Luhn algorithm implementation
    let sum = 0;
    let shouldDouble = false;
    
    // Loop through the digits in reverse order
    for (let i = digitsOnly.length - 1; i >= 0; i--) {
      let digit = parseInt(digitsOnly.charAt(i));
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return sum % 10 === 0;
  };
  
  /**
   * Validates a tracking number format
   * Note: This is a general validation that should be customized based on your system's requirements
   * @param {string} trackingNumber - Tracking number to validate
   * @returns {boolean} True if tracking number is valid
   */
  export const validateTrackingNumber = (trackingNumber) => {
    if (!trackingNumber) return false;
    
    // Tracking numbers are typically alphanumeric and may include hyphens
    // This is a simplified check - adjust based on your system's format
    return /^[A-Za-z0-9-]{6,30}$/.test(trackingNumber.trim());
  };
  
  /**
   * Validates if a string is a valid JSON
   * @param {string} jsonString - String to validate as JSON
   * @returns {boolean} True if string is valid JSON
   */
  export const validateJSON = (jsonString) => {
    if (!jsonString) return false;
    
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  /**
   * Validates a QR code content format
   * @param {string} qrContent - QR code content to validate
   * @returns {boolean} True if QR code content format is valid
   */
  export const validateQRContent = (qrContent) => {
    if (!qrContent) return false;
    
    try {
      const data = JSON.parse(qrContent);
      
      // Check for required fields in QR data
      return (
        typeof data === 'object' &&
        data !== null &&
        typeof data.v === 'number' &&
        typeof data.t === 'number' &&
        typeof data.d === 'string' &&
        typeof data.k === 'string' &&
        typeof data.i === 'string'
      );
    } catch (e) {
      return false;
    }
  };
  
  /**
   * Validates a date string in ISO format
   * @param {string} dateString - Date string to validate
   * @returns {boolean} True if date string is valid
   */
  export const validateDate = (dateString) => {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };
  
  /**
   * Validates if a given value is within a specified range
   * @param {number} value - Value to validate
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @returns {boolean} True if value is within range
   */
  export const validateRange = (value, min, max) => {
    if (value === undefined || value === null) return false;
    
    const numValue = Number(value);
    return !isNaN(numValue) && numValue >= min && numValue <= max;
  };
  
  /**
   * Validates a form field with custom validation logic
   * @param {*} value - Field value to validate
   * @param {Array} validations - Array of validation functions to apply
   * @returns {Object} Validation result with isValid flag and error message
   */
  export const validateField = (value, validations = []) => {
    for (const validation of validations) {
      const result = validation(value);
      if (typeof result === 'object' && !result.isValid) {
        return result;
      } else if (typeof result === 'boolean' && !result) {
        return { isValid: false, message: 'Invalid field value' };
      }
    }
    
    return { isValid: true, message: '' };
  };
  
  /**
   * Validates entire user registration form
   * @param {Object} formData - User registration form data
   * @returns {Object} Validation result with isValid flag and errors object
   */
  export const validateRegistrationForm = (formData) => {
    const errors = {};
    let isValid = true;
    
    // Validate email
    if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Validate password
    const passwordResult = validatePassword(formData.password);
    if (!passwordResult.isValid) {
      errors.password = passwordResult.message;
      isValid = false;
    }
    
    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    // Validate first name
    if (!validateName(formData.firstName)) {
      errors.firstName = 'Please enter a valid first name';
      isValid = false;
    }
    
    // Validate last name
    if (!validateName(formData.lastName)) {
      errors.lastName = 'Please enter a valid last name';
      isValid = false;
    }
    
    // Validate username if provided
    if (formData.username && !validateUsername(formData.username)) {
      errors.username = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
      isValid = false;
    }
    
    // Validate phone if provided
    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
      isValid = false;
    }
    
    return { isValid, errors };
  };
  
  /**
   * Validates an address form
   * @param {Object} addressData - Address form data
   * @returns {Object} Validation result with isValid flag and errors object
   */
  export const validateAddressForm = (addressData) => {
    const errors = {};
    let isValid = true;
    
    // Validate street address
    if (!validateAddress(addressData.street)) {
      errors.street = 'Please enter a valid street address';
      isValid = false;
    }
    
    // Validate city
    if (!validateCity(addressData.city)) {
      errors.city = 'Please enter a valid city';
      isValid = false;
    }
    
    // Validate state/province
    if (!validateState(addressData.state)) {
      errors.state = 'Please enter a valid state or province';
      isValid = false;
    }
    
    // Validate postal/zip code
    if (!validatePostalCode(addressData.postalCode)) {
      errors.postalCode = 'Please enter a valid postal/zip code';
      isValid = false;
    }
    
    // Validate country
    if (!validateCountry(addressData.country)) {
      errors.country = 'Please enter a valid country';
      isValid = false;
    }
    
    return { isValid, errors };
  };
  
  export default {
    validateEmail,
    validatePassword,
    validatePhone,
    validateName,
    validateUsername,
    validatePostalCode,
    validateAddress,
    validateCity,
    validateState,
    validateCountry,
    validate2FACode,
    validateCreditCard,
    validateTrackingNumber,
    validateJSON,
    validateQRContent,
    validateDate,
    validateRange,
    validateField,
    validateRegistrationForm,
    validateAddressForm
  };