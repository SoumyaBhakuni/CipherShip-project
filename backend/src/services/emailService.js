// emailService.js
const nodemailer = require('nodemailer');
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, FROM_EMAIL } = require('../config/constants');

/**
 * Service for handling email notifications
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }

  /**
   * Send welcome email to new users
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {string} verificationToken - Token for email verification (optional)
   * @returns {Promise<Object>} - Email send result
   */
  async sendWelcomeEmail(email, name, verificationToken = null) {
    try {
      const verificationLink = verificationToken 
        ? `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}` 
        : null;
        
      const mailOptions = {
        from: `"Cipher Ship" <${FROM_EMAIL}>`,
        to: email,
        subject: 'Welcome to Cipher Ship - Secure Delivery System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Cipher Ship, ${name}!</h2>
            <p>Thank you for registering with our secure delivery system.</p>
            ${verificationToken ? `
              <p>Please verify your email address by clicking the button below:</p>
              <p>
                <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Verify Email
                </a>
              </p>
              <p>Or copy and paste this link: ${verificationLink}</p>
            ` : ''}
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>The Cipher Ship Team</p>
          </div>
        `
      };

      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email service error:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {string} resetToken - Password reset token
   * @returns {Promise<Object>} - Email send result
   */
  async sendPasswordResetEmail(email, name, resetToken) {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"Cipher Ship" <${FROM_EMAIL}>`,
        to: email,
        subject: 'Password Reset Request - Cipher Ship',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hello ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p>
              <a href="${resetLink}" style="background-color: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p>Or copy and paste this link: ${resetLink}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this change, you can ignore this email and your password will remain the same.</p>
            <p>Best regards,<br>The Cipher Ship Team</p>
          </div>
        `
      };

      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email service error:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send 2FA verification code
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {string} verificationCode - 2FA verification code
   * @returns {Promise<Object>} - Email send result
   */
  async send2FACode(email, name, verificationCode) {
    try {
      const mailOptions = {
        from: `"Cipher Ship" <${FROM_EMAIL}>`,
        to: email,
        subject: 'Your Two-Factor Authentication Code - Cipher Ship',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Two-Factor Authentication Code</h2>
            <p>Hello ${name},</p>
            <p>Your verification code for Cipher Ship login is:</p>
            <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; letter-spacing: 5px; text-align: center; font-weight: bold; margin: 20px 0;">
              ${verificationCode}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please contact our support team immediately as someone may be trying to access your account.</p>
            <p>Best regards,<br>The Cipher Ship Team</p>
          </div>
        `
      };

      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email service error:', error);
      throw new Error('Failed to send 2FA code');
    }
  }

  /**
   * Send delivery confirmation to customer
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {string} packageId - Package ID
   * @param {string} trackingNumber - Tracking number
   * @returns {Promise<Object>} - Email send result
   */
  async sendDeliveryConfirmation(email, name, packageId, trackingNumber) {
    try {
      const trackingLink = `${process.env.FRONTEND_URL}/track-package?id=${trackingNumber}`;
      
      const mailOptions = {
        from: `"Cipher Ship" <${FROM_EMAIL}>`,
        to: email,
        subject: 'Package Delivery Confirmation - Cipher Ship',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Package Delivery Confirmation</h2>
            <p>Hello ${name},</p>
            <p>Your package (ID: ${packageId}) has been successfully delivered.</p>
            <p>You can track the delivery status using the tracking number: <strong>${trackingNumber}</strong></p>
            <p>
              <a href="${trackingLink}" style="background-color: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Track Package
              </a>
            </p>
            <p>Thank you for using our secure delivery service.</p>
            <p>Best regards,<br>The Cipher Ship Team</p>
          </div>
        `
      };

      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email service error:', error);
      throw new Error('Failed to send delivery confirmation');
    }
  }

  /**
   * Send delivery status update to customer
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {string} packageId - Package ID
   * @param {string} trackingNumber - Tracking number
   * @param {string} status - New package status
   * @param {string} message - Additional message (optional)
   * @returns {Promise<Object>} - Email send result
   */
  async sendStatusUpdate(email, name, packageId, trackingNumber, status, message = '') {
    try {
      const trackingLink = `${process.env.FRONTEND_URL}/track-package?id=${trackingNumber}`;
      
      // Convert status to user-friendly text
      const statusText = {
        'processing': 'Processing',
        'shipped': 'Shipped',
        'in-transit': 'In Transit',
        'out-for-delivery': 'Out for Delivery',
        'delivered': 'Delivered',
        'delayed': 'Delayed',
        'exception': 'Delivery Exception'
      }[status] || status;
      
      const mailOptions = {
        from: `"Cipher Ship" <${FROM_EMAIL}>`,
        to: email,
        subject: `Package Status Update: ${statusText} - Cipher Ship`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Package Status Update</h2>
            <p>Hello ${name},</p>
            <p>Your package (ID: ${packageId}) status has been updated to: <strong>${statusText}</strong></p>
            ${message ? `<p>${message}</p>` : ''}
            <p>You can track the delivery status using the tracking number: <strong>${trackingNumber}</strong></p>
            <p>
              <a href="${trackingLink}" style="background-color: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Track Package
              </a>
            </p>
            <p>Thank you for using our secure delivery service.</p>
            <p>Best regards,<br>The Cipher Ship Team</p>
          </div>
        `
      };

      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email service error:', error);
      throw new Error('Failed to send status update');
    }
  }
}

module.exports = new EmailService();
