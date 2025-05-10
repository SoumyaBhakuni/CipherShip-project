// encryptionService.js
const crypto = require('crypto');
const { AES_KEY, AES_IV, RSA_PRIVATE_KEY, RSA_PUBLIC_KEY } = require('../config/constants');

/**
 * Service for handling encryption and decryption of sensitive data
 */
class EncryptionService {
  /**
   * Encrypt data using AES-256-CBC
   * @param {string} data - The data to encrypt
   * @returns {string} - The encrypted data as base64 string
   */
  encryptAES(data) {
    try {
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(AES_KEY, 'hex'), Buffer.from(AES_IV, 'hex'));
      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      return encrypted;
    } catch (error) {
      console.error('AES Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES-256-CBC
   * @param {string} encryptedData - The encrypted data as base64 string
   * @returns {string} - The decrypted data
   */
  decryptAES(encryptedData) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(AES_KEY, 'hex'), Buffer.from(AES_IV, 'hex'));
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('AES Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt data using RSA
   * @param {string} data - The data to encrypt
   * @returns {string} - The encrypted data as base64 string
   */
  encryptRSA(data) {
    try {
      const encryptedData = crypto.publicEncrypt(
        {
          key: RSA_PUBLIC_KEY,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        Buffer.from(data)
      );
      return encryptedData.toString('base64');
    } catch (error) {
      console.error('RSA Encryption error:', error);
      throw new Error('RSA encryption failed');
    }
  }

  /**
   * Decrypt data using RSA
   * @param {string} encryptedData - The encrypted data as base64 string
   * @returns {string} - The decrypted data
   */
  decryptRSA(encryptedData) {
    try {
      const decryptedData = crypto.privateDecrypt(
        {
          key: RSA_PRIVATE_KEY,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        Buffer.from(encryptedData, 'base64')
      );
      return decryptedData.toString();
    } catch (error) {
      console.error('RSA Decryption error:', error);
      throw new Error('RSA decryption failed');
    }
  }

  /**
   * Hash a password using bcrypt
   * @param {string} password - The password to hash
   * @returns {Promise<string>} - The hashed password
   */
  async hashPassword(password) {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  /**
   * Compare a password with a hash
   * @param {string} password - The password to check
   * @param {string} hash - The hash to compare against
   * @returns {Promise<boolean>} - Whether the password matches
   */
  async comparePassword(password, hash) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate a random string for secure tokens
   * @param {number} length - The length of the token
   * @returns {string} - The generated token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = new EncryptionService();
