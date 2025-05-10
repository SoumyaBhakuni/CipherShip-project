// notificationService.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');

/**
 * Service for handling real-time notifications via WebSockets
 */
class NotificationService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }
  
  /**
   * Initialize the Socket.IO server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    
    // Set up authentication middleware for socket connections
    this.io.use((socket, next) => {
      if (socket.handshake.query && socket.handshake.query.token) {
        jwt.verify(socket.handshake.query.token, JWT_SECRET, (err, decoded) => {
          if (err) return next(new Error('Authentication error'));
          socket.decoded = decoded;
          next();
        });
      } else {
        next(new Error('Authentication error'));
      }
    });
    
    this.io.on('connection', (socket) => {
      const userId = socket.decoded.id;
      
      // Store user connection
      this.connectedUsers.set(userId, socket.id);
      
      console.log(`User connected: ${userId}`);
      
      // Listen for user-specific channel subscription
      socket.on('subscribe', (data) => {
        if (data.channel === 'admin' && socket.decoded.role === 'admin') {
          socket.join('admin');
        }
        
        if (data.channel === 'deliveryAgent' && socket.decoded.role === 'delivery-agent') {
          socket.join('deliveryAgent');
        }
        
        // All users can subscribe to their personal channel
        socket.join(`user-${userId}`);
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedUsers.delete(userId);
        console.log(`User disconnected: ${userId}`);
      });
    });
    
    console.log('Socket.IO server initialized');
  }
  
  /**
   * Send a notification to a specific user
   * @param {string} userId - Target user ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   */
  sendToUser(userId, type, data) {
    try {
      this.io.to(`user-${userId}`).emit('notification', {
        type,
        data,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Notification service error:', error);
    }
  }
  
  /**
   * Send a notification to all users with a specific role
   * @param {string} role - Target role (admin, delivery-agent, customer)
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   */
  sendToRole(role, type, data) {
    try {
      let channel = role;
      if (role === 'admin') channel = 'admin';
      if (role === 'delivery-agent') channel = 'deliveryAgent';
      
      this.io.to(channel).emit('notification', {
        type,
        data,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Notification service error:', error);
    }
  }
  
  /**
   * Send a notification to all connected users
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   */
  broadcastToAll(type, data) {
    try {
      this.io.emit('notification', {
        type,
        data,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Notification service error:', error);
    }
  }
  
  /**
   * Send package status update notification
   * @param {string} userId - Package owner user ID
   * @param {string} packageId - Package ID
   * @param {string} status - New package status
   * @param {string} message - Additional message (optional)
   */
  sendPackageStatusUpdate(userId, packageId, status, message = '') {
    this.sendToUser(userId, 'package-status', {
      packageId,
      status,
      message,
      timestamp: new Date()
    });
  }
  
  /**
   * Send QR code scan notification
   * @param {string} userId - Package owner user ID
   * @param {string} packageId - Package ID
   * @param {string} qrCodeId - QR code ID
   * @param {string} scannedBy - User ID of scanner
   * @param {Object} location - Scan location (optional)
   */
  sendQRCodeScanAlert(userId, packageId, qrCodeId, scannedBy, location = null) {
    this.sendToUser(userId, 'qr-scan', {
      packageId,
      qrCodeId,
      scannedBy,
      location,
      timestamp: new Date()
    });
    
    // Also send to admins for monitoring
    this.sendToRole('admin', 'qr-scan-admin', {
      packageId,
      qrCodeId,
      scannedBy,
      owner: userId,
      location,
      timestamp: new Date()
    });
  }
  
  /**
   * Send delivery agent assignment notification
   * @param {string} agentId - Delivery agent user ID
   * @param {string} packageId - Package ID
   * @param {Object} packageDetails - Basic package details
   */
  sendDeliveryAssignment(agentId, packageId, packageDetails) {
    this.sendToUser(agentId, 'delivery-assignment', {
      packageId,
      details: packageDetails,
      timestamp: new Date()
    });
  }
  
  /**
   * Send security alert to admins
   * @param {string} type - Alert type (suspicious-scan, multiple-attempts, etc.)
   * @param {Object} data - Alert details
   */
  sendSecurityAlert(type, data) {
    this.sendToRole('admin', 'security-alert', {
      alertType: type,
      data,
      timestamp: new Date()
    });
  }
  
  /**
   * Check if a user is online
   * @param {string} userId - User ID to check
   * @returns {boolean} - Whether user is connected
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
  
  /**
   * Get count of online users
   * @returns {number} - Count of connected users
   */
  getOnlineUserCount() {
    return this.connectedUsers.size;
  }
}

module.exports = new NotificationService();