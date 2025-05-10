/**
 * Cipher Ship API Server
 * Entry point for the backend application
 */

const app = require('./src/app');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');
const { PORT } = require('./src/config/constants');

// Create HTTP server and attach Socket.IO
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  // Handle client joining a package tracking room
  socket.on('join-package-tracking', (packageId) => {
    logger.info(`Client ${socket.id} joined package tracking for ${packageId}`);
    socket.join(`package-${packageId}`);
  });
  
  // Handle client leaving a package tracking room
  socket.on('leave-package-tracking', (packageId) => {
    logger.info(`Client ${socket.id} left package tracking for ${packageId}`);
    socket.leave(`package-${packageId}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Make io accessible to our routes
app.set('io', io);

// Start the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});
