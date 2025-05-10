/**
 * Passport.js authentication configuration
 */

const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/User');
const { JWT_SECRET } = require('./constants');
const logger = require('../utils/logger');

/**
 * JWT Strategy Options
 */
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET,
};

/**
 * JWT Strategy for authentication
 */
passport.use(
  new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
    try {
      // Find user by ID from JWT payload
      const user = await User.findById(jwt_payload.id).select('-password -twoFactorSecret');
      
      if (!user) {
        logger.warn(`Authentication failed: User not found for ID ${jwt_payload.id}`);
        return done(null, false, { message: 'User not found' });
      }
      
      // Check if user is active
      if (!user.isActive) {
        logger.warn(`Authentication failed: Account inactive for user ${user._id}`);
        return done(null, false, { message: 'Account is inactive' });
      }
      
      logger.info(`User ${user._id} authenticated successfully`);
      return done(null, user);
    } catch (error) {
      logger.error(`JWT strategy error: ${error.message}`);
      return done(error, false);
    }
  })
);

/**
 * Serialize user for session
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password -twoFactorSecret');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;