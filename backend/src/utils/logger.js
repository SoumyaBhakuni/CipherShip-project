/**
 * Logger utility for Cipher Ship application
 * Provides standardized logging functionality with different log levels
 * and structured logging format for better analysis and debugging
 */

const winston = require('winston');
const { format, transports } = winston;
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for console output with colors
const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.colorize(),
  format.printf(({ timestamp, level, message, ...metadata }) => {
    // Handle objects and errors properly
    let metaStr = '';
    if (metadata.error) {
      if (metadata.error instanceof Error) {
        metaStr = `\n[STACK]: ${metadata.error.stack}`;
      } else {
        metaStr = `\n[ERROR]: ${JSON.stringify(metadata.error)}`;
      }
    } else if (Object.keys(metadata).length > 0) {
      metaStr = `\n[META]: ${JSON.stringify(metadata, null, 2)}`;
    }
    
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Format for file logs (JSON for better parsing)
const fileFormat = format.combine(
  format.timestamp(),
  format.uncolorize(),
  format.json()
);

// Define log levels with custom colors
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  }
};

// Add colors to Winston
winston.addColors(logLevels.colors);

// Create the logger instance
const logger = winston.createLogger({
  levels: logLevels.levels,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'cipher-ship' },
  transports: [
    // Console transport
    new transports.Console({
      format: consoleFormat
    }),
    // File transport for all logs
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Separate file for error logs
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  ],
  // Do not exit on handled exceptions
  exitOnError: false
});

// Create a stream object for Morgan HTTP logger integration
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

/**
 * Logs system events with user context if available
 * 
 * @param {string} level - Log level (error, warn, info, http, debug)
 * @param {string} message - Log message
 * @param {Object} [metadata] - Additional metadata to log
 * @param {Object} [user] - User who performed the action
 */
function logWithUser(level, message, metadata = {}, user = null) {
  // Add user information to metadata if available
  const metaWithUser = { ...metadata };
  
  if (user) {
    metaWithUser.user = {
      id: user._id || user.id,
      email: user.email,
      role: user.role
    };
  }
  
  logger[level](message, metaWithUser);
}

/**
 * Log security events specifically
 * 
 * @param {string} action - Security action type
 * @param {string} message - Description of the security event
 * @param {Object} [metadata] - Additional metadata
 * @param {Object} [user] - User who performed the action
 */
function logSecurity(action, message, metadata = {}, user = null) {
  const securityMeta = {
    ...metadata,
    securityEvent: true,
    action,
    ip: metadata.ip || 'unknown',
    timestamp: new Date().toISOString()
  };
  
  logWithUser('warn', `SECURITY: ${message}`, securityMeta, user);
}

/**
 * Log API requests (can be used in middleware)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} responseTime - Response time in milliseconds
 */
function logApiRequest(req, res, responseTime) {
  const { method, originalUrl, ip, user } = req;
  const statusCode = res.statusCode;
  
  logger.http(`${method} ${originalUrl} ${statusCode} ${responseTime}ms`, {
    method,
    url: originalUrl,
    statusCode,
    responseTime,
    ip,
    userId: user ? user._id : null
  });
}

/**
 * Log database operations
 * 
 * @param {string} operation - Database operation type (query, update, delete, etc.)
 * @param {string} collection - Collection/table name
 * @param {Object} query - Query parameters
 * @param {number} [duration] - Operation duration in milliseconds
 */
function logDbOperation(operation, collection, query, duration) {
  logger.debug(`DB: ${operation} on ${collection}`, {
    db: {
      operation,
      collection,
      query: JSON.stringify(query),
      duration
    }
  });
}

/**
 * Enhanced error logging
 * 
 * @param {Error} error - Error object
 * @param {string} context - Context where the error occurred
 * @param {Object} [metadata] - Additional metadata
 */
function logError(error, context, metadata = {}) {
  logger.error(`[${context}] ${error.message}`, {
    error,
    context,
    ...metadata
  });
}

module.exports = {
  logger,
  logWithUser,
  logSecurity,
  logApiRequest,
  logDbOperation,
  logError
};