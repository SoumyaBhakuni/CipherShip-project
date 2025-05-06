// frontend/src/hooks/useQRCode.js
import { useState } from 'react';
import * as qrCodeService from '../services/qrcode';

export const useQRCode = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrCodeData, setQRCodeData] = useState(null);

  const generateQRCode = async (packageId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await qrCodeService.generateQRCode(packageId);
      setQRCodeData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate QR code');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  const verifyQRCode = async (encryptedData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await qrCodeService.verifyQRCode(encryptedData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify QR code');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    qrCodeData,
    generateQRCode,
    verifyQRCode,
  };
};