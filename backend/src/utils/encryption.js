/**
 * encryption.js
 * Utility functions for encryption and decryption of sensitive data
 * Implements both AES (symmetric) and RSA (asymmetric) encryption methods
 */

const crypto = require('crypto');

/**
 * Generate a random encryption key of specified length
 * @param {number} length - Length of the key in bytes
 * @returns {string} - Hex encoded key
 */
const generateKey = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate an initialization vector for AES encryption
 * @returns {Buffer} - Initialization vector
 */
const generateIV = () => {
  return crypto.randomBytes(16);
};

/**
 * Generate RSA key pair
 * @param {number} modulusLength - Length of the RSA key in bits (2048 or 4096 recommended)
 * @returns {Object} - Object containing public and private keys in PEM format
 */
const generateRSAKeyPair = (modulusLength = 2048) => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { publicKey, privateKey };
};

/**
 * Encrypt data using AES-256-GCM (Authenticated Encryption)
 * @param {string} data - Data to encrypt
 * @param {string} key - Encryption key (hex string)
 * @param {Buffer} iv - Initialization vector (optional)
 * @returns {Object} - Object containing encrypted data, iv, and authTag
 */
const encryptAES = (data, key, iv = null) => {
  try {
    // Convert hex key to buffer
    const keyBuffer = Buffer.from(key, 'hex');
    
    // Generate IV if not provided
    if (!iv) {
      iv = generateIV();
    }
    
    // Create cipher using AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    
    // Encrypt data
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag().toString('base64');
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('base64'),
      authTag
    };
  } catch (error) {
    throw new Error(`AES encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} key - Encryption key (hex string)
 * @param {string} iv - Base64 encoded initialization vector
 * @param {string} authTag - Base64 encoded authentication tag
 * @returns {string} - Decrypted data
 */
const decryptAES = (encryptedData, key, iv, authTag) => {
  try {
    // Convert inputs to buffers
    const keyBuffer = Buffer.from(key, 'hex');
    const ivBuffer = Buffer.from(iv, 'base64');
    const authTagBuffer = Buffer.from(authTag, 'base64');
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
    decipher.setAuthTag(authTagBuffer);
    
    // Decrypt data
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`AES decryption failed: ${error.message}`);
  }
};

/**
 * Encrypt data using RSA public key
 * @param {string} data - Data to encrypt
 * @param {string} publicKey - RSA public key in PEM format
 * @returns {string} - Base64 encoded encrypted data
 */
const encryptRSA = (data, publicKey) => {
  try {
    const encryptedData = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      Buffer.from(data)
    );
    
    return encryptedData.toString('base64');
  } catch (error) {
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt data using RSA private key
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} privateKey - RSA private key in PEM format
 * @returns {string} - Decrypted data
 */
const decryptRSA = (encryptedData, privateKey) => {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    
    const decryptedData = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      buffer
    );
    
    return decryptedData.toString('utf8');
  } catch (error) {
    throw new Error(`RSA decryption failed: ${error.message}`);
  }
};

/**
 * Create HMAC signature for data verification
 * @param {string} data - Data to sign
 * @param {string} key - Secret key for HMAC
 * @returns {string} - Hex encoded HMAC signature
 */
const createHMAC = (data, key) => {
  return crypto
    .createHmac('sha256', key)
    .update(data)
    .digest('hex');
};

/**
 * Verify HMAC signature
 * @param {string} data - Original data
 * @param {string} key - Secret key for HMAC
 * @param {string} hmac - HMAC to verify
 * @returns {boolean} - True if HMAC is valid
 */
const verifyHMAC = (data, key, hmac) => {
  const calculatedHmac = createHMAC(data, key);
  return crypto.timingSafeEqual(
    Buffer.from(calculatedHmac, 'hex'),
    Buffer.from(hmac, 'hex')
  );
};

/**
 * Hash password with salt using PBKDF2
 * @param {string} password - Plain text password
 * @param {string} salt - Optional salt, will generate if not provided
 * @returns {Object} - Object containing hash and salt
 */
const hashPassword = (password, salt = null) => {
  // Generate salt if not provided
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  
  // Hash password with PBKDF2
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    10000, // iterations
    64,    // key length
    'sha512'
  ).toString('hex');
  
  return { hash, salt };
};

/**
 * Verify password against stored hash
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Stored password hash
 * @param {string} salt - Salt used for hashing
 * @returns {boolean} - True if password matches
 */
const verifyPassword = (password, hash, salt) => {
  const { hash: calculatedHash } = hashPassword(password, salt);
  return calculatedHash === hash;
};

/**
 * Generate a secure random token
 * @param {number} length - Length of token in bytes
 * @returns {string} - Random token encoded as base64
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('base64');
};

/**
 * Encrypt entire customer data object for QR code
 * @param {Object} customerData - Customer data object
 * @param {string} encryptionKey - Key for symmetric encryption
 * @returns {Object} - Encrypted customer data object with IV and authTag
 */
const encryptCustomerData = (customerData, encryptionKey) => {
  // Convert customer data to JSON string
  const dataString = JSON.stringify(customerData);
  
  // Encrypt the data
  return encryptAES(dataString, encryptionKey);
};

/**
 * Decrypt customer data from QR code
 * @param {Object} encryptedData - Object with encryptedData, iv, and authTag
 * @param {string} encryptionKey - Key for symmetric decryption
 * @returns {Object} - Decrypted customer data object
 */
const decryptCustomerData = (encryptedData, encryptionKey) => {
  const { encryptedData: data, iv, authTag } = encryptedData;
  
  // Decrypt the data
  const decryptedString = decryptAES(data, encryptionKey, iv, authTag);
  
  // Parse JSON string back to object
  return JSON.parse(decryptedString);
};

module.exports = {
  generateKey,
  generateIV,
  generateRSAKeyPair,
  encryptAES,
  decryptAES,
  encryptRSA,
  decryptRSA,
  createHMAC,
  verifyHMAC,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  encryptCustomerData,
  decryptCustomerData
};