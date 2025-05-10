/**
 * Utility functions for formatting data in the Cipher Ship application
 */

/**
 * Format a date in a user-friendly way
 * @param {Date|string} date - The date to format
 * @param {string} [format='medium'] - The format to use (short, medium, full)
 * @returns {string} The formatted date
 */
export const formatDate = (date, format = 'medium') => {
    if (!date) return 'N/A';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const options = {
      short: { month: 'numeric', day: 'numeric', year: '2-digit' },
      medium: { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' },
      full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }
    };
    
    return dateObj.toLocaleString('en-US', options[format] || options.medium);
  };
  
  /**
   * Format a phone number in a standard way (XXX-XXX-XXXX)
   * @param {string} phoneNumber - The phone number to format
   * @returns {string} The formatted phone number
   */
  export const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'N/A';
    
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if the input is valid
    if (cleaned.length !== 10) {
      return phoneNumber; // Return the original if not valid
    }
    
    // Format as XXX-XXX-XXXX
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };
  
  /**
   * Format an address in a standard way
   * @param {object} address - The address object
   * @param {string} address.street - Street address
   * @param {string} address.city - City
   * @param {string} address.state - State
   * @param {string} address.zipCode - ZIP code
   * @returns {string} The formatted address
   */
  export const formatAddress = (address) => {
    if (!address) return 'N/A';
    
    const { street, city, state, zipCode } = address;
    
    if (!street && !city && !state && !zipCode) {
      return 'Address not available';
    }
    
    return `${street || ''}, ${city || ''}, ${state || ''} ${zipCode || ''}`;
  };
  
  /**
   * Format currency values
   * @param {number} amount - The amount to format
   * @param {string} [currency='USD'] - The currency code
   * @returns {string} The formatted currency value
   */
  export const formatCurrency = (amount, currency = 'USD') => {
    if (amount === null || amount === undefined) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  /**
   * Format package status with appropriate styling class
   * @param {string} status - Package status string
   * @returns {object} Object containing formatted status and CSS class
   */
  export const formatPackageStatus = (status) => {
    if (!status) return { text: 'Unknown', class: 'text-gray-500' };
    
    const statusMap = {
      'pending': { text: 'Pending', class: 'text-yellow-500' },
      'in_transit': { text: 'In Transit', class: 'text-blue-500' },
      'delivered': { text: 'Delivered', class: 'text-green-500' },
      'failed': { text: 'Failed Delivery', class: 'text-red-500' },
      'returned': { text: 'Returned', class: 'text-purple-500' }
    };
    
    return statusMap[status.toLowerCase()] || { text: status, class: 'text-gray-500' };
  };
  
  /**
   * Truncate text to a specified length with ellipsis
   * @param {string} text - The text to truncate
   * @param {number} [length=50] - Maximum length before truncation
   * @returns {string} The truncated text
   */
  export const truncateText = (text, length = 50) => {
    if (!text) return '';
    
    if (text.length <= length) {
      return text;
    }
    
    return `${text.substring(0, length)}...`;
  };
  
  /**
   * Format file size in human-readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted file size
   */
  export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  /**
   * Format user role for display
   * @param {string} role - User role
   * @returns {object} Object containing formatted role and CSS class
   */
  export const formatUserRole = (role) => {
    if (!role) return { text: 'Unknown', class: 'text-gray-500' };
    
    const roleMap = {
      'admin': { text: 'Administrator', class: 'text-purple-600 font-semibold' },
      'delivery_agent': { text: 'Delivery Agent', class: 'text-blue-600 font-semibold' },
      'customer': { text: 'Customer', class: 'text-green-600' }
    };
    
    return roleMap[role.toLowerCase()] || { text: role, class: 'text-gray-600' };
  };