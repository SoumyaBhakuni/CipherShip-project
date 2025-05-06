// frontend/src/services/qrcode.js
import api from './api';

export const generateQRCode = async (packageId) => {
  return await api.post('/qrcodes/generate', { packageId });
};

export const verifyQRCode = async (encryptedData) => {
  return await api.post('/qrcodes/verify', { encryptedData });
};

export const getQRCodeByPackageId = async (packageId) => {
  return await api.get(`/qrcodes/package/${packageId}`);
};
