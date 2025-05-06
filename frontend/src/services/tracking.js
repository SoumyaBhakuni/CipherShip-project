// frontend/src/services/tracking.js
import api from './api';

export const getPackageByTrackingNumber = async (trackingNumber) => {
  return await api.get(`/tracking/${trackingNumber}`);
};

export const getPackagesByUser = async () => {
  return await api.get('/packages/user');
};

export const getPackageById = async (packageId) => {
  return await api.get(`/packages/${packageId}`);
};

export const createPackage = async (packageData) => {
  return await api.post('/packages', packageData);
};

export const updatePackageStatus = async (packageId, status, details) => {
  return await api.put(`/packages/${packageId}/status`, {
    status,
    details,
  });
};

export const getTrackingHistory = async (packageId) => {
  return await api.get(`/tracking/history/${packageId}`);
};
