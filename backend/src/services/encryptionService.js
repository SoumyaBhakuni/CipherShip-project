const CryptoJS = require('crypto-js');
const NodeRSA = require('node-rsa');

// AES Encryption
exports.encryptAES = (data, secretKey = process.env.AES_SECRET_KEY) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
};

// AES Decryption
exports.decryptAES = (encryptedData, secretKey = process.env.AES_SECRET_KEY) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// RSA Key Generation
exports.generateRSAKeyPair = () => {
  const key = new NodeRSA({b: 2048});
  return {
    publicKey: key.exportKey('public'),
    privateKey: key.exportKey('private')
  };
};

// RSA Encryption
exports.encryptRSA = (data, publicKey) => {
  const key = new NodeRSA(publicKey);
  return key.encrypt(JSON.stringify(data), 'base64');
};

// RSA Decryption
exports.decryptRSA = (encryptedData, privateKey) => {
  const key = new NodeRSA(privateKey);
  return JSON.parse(key.decrypt(encryptedData, 'utf8'));
};