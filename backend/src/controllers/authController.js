const User = require('../models/User');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { asyncHandler } = require('../middleware/asyncHandler');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ success: false, error: 'User already exists' });
  }

  // Create user - only admin can create delivery agents
  const user = await User.create({
    name,
    email,
    password,
    role: role === 'delivery-agent' && req.user?.role !== 'admin' ? 'customer' : role,
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } else {
    res.status(400).json({ success: false, error: 'Invalid user data' });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    return res.status(200).json({
      success: true,
      requiresTwoFactor: true,
      userId: user._id,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    },
  });
});

// @desc    Setup 2FA
// @route   POST /api/auth/2fa/setup
// @access  Private
exports.setupTwoFactor = asyncHandler(async (req, res) => {
  // Generate a secret key
  const secret = speakeasy.generateSecret({
    name: `CipherShip:${req.user.email}`,
  });

  // Save secret to user
  req.user.twoFactorSecret = secret.base32;
  await req.user.save();

  // Generate QR code
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

  res.status(200).json({
    success: true,
    data: {
      qrCodeUrl,
      secret: secret.base32,
    },
  });
});

// @desc    Verify 2FA
// @route   POST /api/auth/2fa/verify
// @access  Private
exports.verifyTwoFactor = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const userId = req.user ? req.user._id : req.body.userId;

  // Get user
  const user = req.user || await User.findById(userId);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  // Verify token
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
  });

  if (!verified) {
    return res.status(400).json({ success: false, error: 'Invalid token' });
  }

  // If this is setup verification, enable 2FA
  if (req.user && !user.twoFactorEnabled) {
    user.twoFactorEnabled = true;
    await user.save();
  }

  // If this is login verification, return user with token
  if (!req.user) {
    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  }

  res.status(200).json({
    success: true,
    message: '2FA verification successful',
    twoFactorEnabled: user.twoFactorEnabled,
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -twoFactorSecret');

  res.status(200).json({
    success: true,
    data: user,
  });
});
