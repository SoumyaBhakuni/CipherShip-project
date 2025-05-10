const User = require('../models/User');
const encryptionService = require('../services/encryptionService');
const emailService = require('../services/emailService');
const { validateObjectId } = require('../utils/validators');

/**
 * Get all users (admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Include pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Include filters
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password -refreshToken -twoFactorSecret -twoFactorToken -twoFactorExpires -passwordResetToken -passwordResetExpires')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching users' });
  }
};

/**
 * Get user by ID (admin or self)
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Check if user is requesting own profile or is admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this user profile' });
    }

    const user = await User.findById(id)
      .select('-password -refreshToken -twoFactorSecret -twoFactorToken -twoFactorExpires -passwordResetToken -passwordResetExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching user' });
  }
};

/**
 * Update user (self or admin)
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Check if user is updating own profile or is admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this user profile' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fields that can be updated
    const allowedUpdates = ['name', 'phone', 'address'];
    
    // Additional fields for admin
    if (req.user.role === 'admin') {
      allowedUpdates.push('role', 'isActive');
    }

    // Update only allowed fields
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating user' });
  }
};

/**
 * Change password (self only)
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send notification email
    await emailService.sendPasswordChangedEmail(user.email);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error while changing password' });
  }
};

/**
 * Delete user (admin only)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(id);

    // Send notification email
    await emailService.sendAccountDeletedEmail(user.email);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting user' });
  }
};

/**
 * Activate/Deactivate user (admin only)
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Toggle active status
    user.isActive = !user.isActive;
    await user.save();

    // Send notification email
    if (user.isActive) {
      await emailService.sendAccountActivatedEmail(user.email);
    } else {
      await emailService.sendAccountDeactivatedEmail(user.email);
    }

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ success: false, message: 'Server error while toggling user status' });
  }
};

/**
 * Change user role (admin only)
 */
exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    // Validate ObjectId
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Validate role
    const validRoles = ['admin', 'delivery-agent', 'customer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be admin, delivery-agent, or customer' });
    }

    // Prevent changing own role
    if (req.user.id === id) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    await user.save();

    // Send notification email
    await emailService.sendRoleChangedEmail(user.email, role);

    res.status(200).json({
      success: true,
      message: 'User role changed successfully',
      role: user.role
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({ success: false, message: 'Server error while changing user role' });
  }
};

/**
 * Get user stats (admin only)
 */
exports.getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Transform stats to more readable format
    const formattedStats = {};
    stats.forEach(item => {
      formattedStats[item._id] = item.count;
    });

    // Get total user count
    const totalUsers = await User.countDocuments();
    formattedStats.total = totalUsers;

    // Get active and inactive counts
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    formattedStats.active = activeUsers;
    formattedStats.inactive = inactiveUsers;

    // Get users registered in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsers = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } });
    formattedStats.newUsers = newUsers;

    res.status(200).json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching user statistics' });
  }
};