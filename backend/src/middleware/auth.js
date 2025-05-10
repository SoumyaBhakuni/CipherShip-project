const jwt = require('jsonwebtoken');
const { AUTH } = require('../config/constants');
const User = require('../models/User');
const { createLogger } = require('../utils/logger');

const logger = createLogger('auth-middleware');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Invalid token format.' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, AUTH.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Your account is inactive.' 
      });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token. Please login again.' 
    });
  }
};

/**
 * Verify refresh token middleware
 * Used for issuing new access tokens
 */
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Refresh token is required.' 
      });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, AUTH.REFRESH_TOKEN_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid refresh token. User not found.' 
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Your account is inactive.' 
      });
    }
    
    if (user.refreshToken !== refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid refresh token. Please login again.' 
      });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error('Refresh token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token expired. Please login again.' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid refresh token. Please login again.' 
    });
  }
};

/**
 * Verify two-factor authentication status
 * Ensures user has completed 2FA if enabled
 */
const verifyTwoFactor = async (req, res, next) => {
  try {
    // Skip if 2FA is not enabled
    if (!req.user.twoFactorEnabled) {
      return next();
    }
    
    // Check if 2FA verification flag is set in session
    const twoFactorVerified = req.session && req.session.twoFactorVerified;
    
    if (!twoFactorVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Two-factor authentication required.',
        requireTwoFactor: true
      });
    }
    
    next();
  } catch (error) {
    logger.error('Two-factor verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during two-factor verification.' 
    });
  }
};

module.exports = {
  authenticate,
  verifyRefreshToken,
  verifyTwoFactor
};