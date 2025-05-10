/**
 * Application Constants
 * This file contains all the constants used throughout the application
 */

// Server Configuration
const SERVER = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    API_PREFIX: '/api/v1',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173', // Vite default port
  };
  
  // User Roles
  const ROLES = {
    ADMIN: 'admin',
    DELIVERY_AGENT: 'delivery_agent',
    CUSTOMER: 'customer',
  };
  
  // Authentication Constants
  const AUTH = {
    JWT_SECRET: process.env.JWT_SECRET || 'cipher-ship-jwt-secret',
    JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'cipher-ship-refresh-token-secret',
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    BCRYPT_SALT_ROUNDS: 10,
    TWO_FACTOR_EXPIRY: 600, // 10 minutes in seconds
  };
  
  // QR Code Constants
  const QR_CODE = {
    ERROR_CORRECTION_LEVEL: 'H', // High - allows up to 30% damage without loss of data
    VERSION: 10, // Version determines size of QR code
    MARGIN: 4, // White space margin around QR code
    EXPIRY: 60 * 60 * 24 * 7, // 7 days in seconds
  };
  
  // Encryption Constants
  const ENCRYPTION = {
    AES_KEY_LENGTH: 256,
    RSA_KEY_LENGTH: 2048,
    IV_LENGTH: 16, // For AES
  };
  
  // Database Constants
  const DATABASE = {
    CONNECTION_STRING: process.env.MONGODB_URI || 'mongodb://localhost:27017/cipher-ship',
    OPTIONS: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  };
  
  // Tracking Constants
  const TRACKING = {
    STATUS: {
      CREATED: 'created',
      IN_TRANSIT: 'in_transit',
      OUT_FOR_DELIVERY: 'out_for_delivery',
      DELIVERED: 'delivered',
      FAILED: 'failed',
      RETURNED: 'returned',
    },
    LOG_LEVEL: {
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
    },
  };
  
  // Email Constants
  const EMAIL = {
    FROM: process.env.EMAIL_FROM || 'noreply@ciphership.com',
    TEMPLATES: {
      WELCOME: 'welcome',
      RESET_PASSWORD: 'reset_password',
      PACKAGE_CREATED: 'package_created',
      PACKAGE_STATUS_UPDATE: 'package_status_update',
      TWO_FACTOR_CODE: 'two_factor_code',
    },
  };
  
  // Rate Limiting Constants
  const RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // per window
    STANDARD_HEADERS: true,
    LEGACY_HEADERS: false,
  };
  
  // Validation Constants
  const VALIDATION = {
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128,
    PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    PHONE_PATTERN: /^\+?[1-9]\d{1,14}$/, // International format
  };
  
  module.exports = {
    SERVER,
    ROLES,
    AUTH,
    QR_CODE,
    ENCRYPTION,
    DATABASE,
    TRACKING,
    EMAIL,
    RATE_LIMIT,
    VALIDATION,
  };