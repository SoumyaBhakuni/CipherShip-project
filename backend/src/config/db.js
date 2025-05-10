/**
 * MongoDB Database Connection
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { MONGODB_URI } = require('./constants');

/**
 * Connect to MongoDB Atlas
 */
const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        // These options are no longer needed in newer mongoose versions but included for compatibility
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
  
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      
      // Set up error handling after initial connection
      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB connection error: ${err}`);
      });
  
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });
  
      // Handle application termination
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed due to app termination');
        process.exit(0);
      });
      
      return conn;
    } catch (error) {
      logger.error(`Error connecting to MongoDB: ${error.message}`);
      process.exit(1);
    }
  };
  
// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

// Close MongoDB connection on process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed due to app termination');
    process.exit(0);
  } catch (err) {
    logger.error(`Error closing MongoDB connection: ${err}`);
    process.exit(1);
  }
});

module.exports = connectDB;