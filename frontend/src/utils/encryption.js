/**
 * Encryption utility functions for Cipher Ship
 * This module provides client-side encryption capabilities for sensitive data
 * using AES and RSA algorithms via the Web Crypto API
 */

// Converts ArrayBuffer to Base64 string
const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };
  
  // Converts Base64 string to ArrayBuffer
  const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };
  
  // Converts string to ArrayBuffer
  const stringToArrayBuffer = (str) => {
    return new TextEncoder().encode(str);
  };
  
  // Converts ArrayBuffer to string
  const arrayBufferToString = (buffer) => {
    return new TextDecoder().decode(buffer);
  };
  
  /**
   * Generate a random encryption key for AES-GCM
   * @returns {Promise<string>} Base64 encoded AES key
   */
  export const generateAESKey = async () => {
    try {
      const key = await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      const exportedKey = await window.crypto.subtle.exportKey('raw', key);
      return arrayBufferToBase64(exportedKey);
    } catch (error) {
      console.error('Error generating AES key:', error);
      throw new Error('Failed to generate encryption key');
    }
  };
  
  /**
   * Encrypt data using AES-GCM
   * @param {string} plaintext - Text to encrypt
   * @param {string} keyBase64 - Base64 encoded AES key
   * @returns {Promise<{ciphertext: string, iv: string}>} Encrypted data and initialization vector
   */
  export const encryptWithAES = async (plaintext, keyBase64) => {
    try {
      // Convert Base64 key to CryptoKey
      const keyData = base64ToArrayBuffer(keyBase64);
      const key = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      // Generate random initialization vector
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the data
      const encodedData = stringToArrayBuffer(plaintext);
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        encodedData
      );
      
      // Return the encrypted data and IV as Base64 strings
      return {
        ciphertext: arrayBufferToBase64(encryptedData),
        iv: arrayBufferToBase64(iv)
      };
    } catch (error) {
      console.error('Error encrypting with AES:', error);
      throw new Error('Failed to encrypt data');
    }
  };
  
  /**
   * Decrypt data using AES-GCM
   * @param {string} ciphertextBase64 - Base64 encoded encrypted data
   * @param {string} ivBase64 - Base64 encoded initialization vector
   * @param {string} keyBase64 - Base64 encoded AES key
   * @returns {Promise<string>} Decrypted plaintext
   */
  export const decryptWithAES = async (ciphertextBase64, ivBase64, keyBase64) => {
    try {
      // Convert Base64 inputs to ArrayBuffers
      const encryptedData = base64ToArrayBuffer(ciphertextBase64);
      const iv = base64ToArrayBuffer(ivBase64);
      const keyData = base64ToArrayBuffer(keyBase64);
      
      // Import the key
      const key = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      // Decrypt the data
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(iv)
        },
        key,
        encryptedData
      );
      
      // Convert ArrayBuffer to string
      return arrayBufferToString(decryptedData);
    } catch (error) {
      console.error('Error decrypting with AES:', error);
      throw new Error('Failed to decrypt data');
    }
  };
  
  /**
   * Generate an RSA key pair
   * @returns {Promise<{publicKey: string, privateKey: string}>} Base64 encoded keys
   */
  export const generateRSAKeyPair = async () => {
    try {
      // Generate RSA key pair
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256'
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Export the keys
      const publicKeyData = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const privateKeyData = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      
      // Return Base64 encoded keys
      return {
        publicKey: arrayBufferToBase64(publicKeyData),
        privateKey: arrayBufferToBase64(privateKeyData)
      };
    } catch (error) {
      console.error('Error generating RSA key pair:', error);
      throw new Error('Failed to generate RSA keys');
    }
  };
  
  /**
   * Encrypt data using RSA-OAEP with recipient's public key
   * @param {string} plaintext - Text to encrypt
   * @param {string} publicKeyBase64 - Base64 encoded recipient's public key
   * @returns {Promise<string>} Base64 encoded encrypted data
   */
  export const encryptWithRSA = async (plaintext, publicKeyBase64) => {
    try {
      // Convert Base64 public key to CryptoKey
      const publicKeyData = base64ToArrayBuffer(publicKeyBase64);
      const publicKey = await window.crypto.subtle.importKey(
        'spki',
        publicKeyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        false,
        ['encrypt']
      );
      
      // Encrypt the data (RSA can only encrypt small amounts of data)
      const encodedData = stringToArrayBuffer(plaintext);
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP'
        },
        publicKey,
        encodedData
      );
      
      // Return the encrypted data as Base64 string
      return arrayBufferToBase64(encryptedData);
    } catch (error) {
      console.error('Error encrypting with RSA:', error);
      throw new Error('Failed to encrypt data with RSA');
    }
  };
  
  /**
   * Decrypt data using RSA-OAEP with your private key
   * @param {string} ciphertextBase64 - Base64 encoded encrypted data
   * @param {string} privateKeyBase64 - Base64 encoded private key
   * @returns {Promise<string>} Decrypted plaintext
   */
  export const decryptWithRSA = async (ciphertextBase64, privateKeyBase64) => {
    try {
      // Convert Base64 inputs to ArrayBuffers
      const encryptedData = base64ToArrayBuffer(ciphertextBase64);
      const privateKeyData = base64ToArrayBuffer(privateKeyBase64);
      
      // Import the private key
      const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        false,
        ['decrypt']
      );
      
      // Decrypt the data
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP'
        },
        privateKey,
        encryptedData
      );
      
      // Convert ArrayBuffer to string
      return arrayBufferToString(decryptedData);
    } catch (error) {
      console.error('Error decrypting with RSA:', error);
      throw new Error('Failed to decrypt data with RSA');
    }
  };
  
  /**
   * Hybrid encryption: Encrypt data with AES, then encrypt the AES key with RSA
   * This allows for encrypting larger data than RSA alone
   * @param {string} plaintext - Text to encrypt
   * @param {string} publicKeyBase64 - Base64 encoded recipient's public key
   * @returns {Promise<{encryptedData: string, encryptedKey: string, iv: string}>} Encrypted package
   */
  export const hybridEncrypt = async (plaintext, publicKeyBase64) => {
    try {
      // Generate a one-time AES key
      const aesKeyBase64 = await generateAESKey();
      
      // Encrypt the data with AES
      const { ciphertext, iv } = await encryptWithAES(plaintext, aesKeyBase64);
      
      // Encrypt the AES key with RSA
      const encryptedKey = await encryptWithRSA(aesKeyBase64, publicKeyBase64);
      
      // Return the encrypted package
      return {
        encryptedData: ciphertext,
        encryptedKey,
        iv
      };
    } catch (error) {
      console.error('Error in hybrid encryption:', error);
      throw new Error('Failed to encrypt data');
    }
  };
  
  /**
   * Hybrid decryption: Decrypt the AES key with RSA, then decrypt the data with AES
   * @param {string} encryptedData - Base64 encoded AES-encrypted data
   * @param {string} encryptedKey - Base64 encoded RSA-encrypted AES key
   * @param {string} iv - Base64 encoded initialization vector
   * @param {string} privateKeyBase64 - Base64 encoded private RSA key
   * @returns {Promise<string>} Decrypted plaintext
   */
  export const hybridDecrypt = async (encryptedData, encryptedKey, iv, privateKeyBase64) => {
    try {
      // Decrypt the AES key with RSA
      const aesKeyBase64 = await decryptWithRSA(encryptedKey, privateKeyBase64);
      
      // Decrypt the data with AES
      const plaintext = await decryptWithAES(encryptedData, iv, aesKeyBase64);
      
      return plaintext;
    } catch (error) {
      console.error('Error in hybrid decryption:', error);
      throw new Error('Failed to decrypt data');
    }
  };
  
  /**
   * Encrypt customer data for QR code
   * @param {Object} customerData - Customer data to encrypt
   * @param {string} publicKeyBase64 - Base64 encoded public key
   * @returns {Promise<string>} JSON string ready for QR code generation
   */
  export const encryptCustomerDataForQR = async (customerData, publicKeyBase64) => {
    try {
      // Convert customer data to string
      const dataString = JSON.stringify(customerData);
      
      // Encrypt the data using hybrid encryption
      const encryptedPackage = await hybridEncrypt(dataString, publicKeyBase64);
      
      // Prepare metadata
      const qrData = {
        v: 1, // Version
        t: Date.now(), // Timestamp
        d: encryptedPackage.encryptedData,
        k: encryptedPackage.encryptedKey,
        i: encryptedPackage.iv
      };
      
      return JSON.stringify(qrData);
    } catch (error) {
      console.error('Error encrypting customer data for QR:', error);
      throw new Error('Failed to prepare encrypted QR data');
    }
  };
  
  /**
   * Decrypt customer data from QR code
   * @param {string} qrContent - Content scanned from QR code
   * @param {string} privateKeyBase64 - Base64 encoded private key
   * @returns {Promise<Object>} Decrypted customer data
   */
  export const decryptCustomerDataFromQR = async (qrContent, privateKeyBase64) => {
    try {
      // Parse QR content
      const qrData = JSON.parse(qrContent);
      
      // Check version
      if (qrData.v !== 1) {
        throw new Error(`Unsupported QR code version: ${qrData.v}`);
      }
      
      // Decrypt the data
      const decryptedData = await hybridDecrypt(
        qrData.d,
        qrData.k,
        qrData.i,
        privateKeyBase64
      );
      
      // Parse the customer data
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Error decrypting QR data:', error);
      throw new Error('Failed to decrypt QR code data');
    }
  };
  
  /**
   * Hash a string using SHA-256
   * @param {string} data - String to hash
   * @returns {Promise<string>} Hex encoded hash
   */
  export const hashData = async (data) => {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      
      // Convert ArrayBuffer to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex;
    } catch (error) {
      console.error('Error hashing data:', error);
      throw new Error('Failed to hash data');
    }
  };
  
  /**
   * Generate a digital signature for data verification
   * Note: This would require a more complete RSA key setup with signing capabilities
   * This is a simplified implementation for demonstration
   * @param {string} data - Data to sign
   * @param {string} privateKeyBase64 - Base64 encoded private key
   * @returns {Promise<string>} Base64 encoded signature
   */
  export const signData = async (data, privateKeyBase64) => {
    // In a real implementation, this would use the Web Crypto API's sign method
    // This is a placeholder to show the concept
    const hash = await hashData(data);
    return `SIGNATURE_${hash}_${Date.now()}`;
  };
  
  /**
   * Verify a digital signature
   * @param {string} data - Original data
   * @param {string} signature - Base64 encoded signature
   * @param {string} publicKeyBase64 - Base64 encoded public key
   * @returns {Promise<boolean>} Whether the signature is valid
   */
  export const verifySignature = async (data, signature, publicKeyBase64) => {
    // In a real implementation, this would use the Web Crypto API's verify method
    // This is a placeholder to show the concept
    const hash = await hashData(data);
    const signatureParts = signature.split('_');
    return signatureParts[1] === hash;
  };
  
  export default {
    generateAESKey,
    encryptWithAES,
    decryptWithAES,
    generateRSAKeyPair,
    encryptWithRSA,
    decryptWithRSA,
    hybridEncrypt,
    hybridDecrypt,
    encryptCustomerDataForQR,
    decryptCustomerDataFromQR,
    hashData,
    signData,
    verifySignature
  };