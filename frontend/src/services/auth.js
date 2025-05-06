// frontend/src/services/auth.js
import api from './api';
import jwt_decode from 'jwt-decode';

export const register = async (name, email, password, phone) => {
  const response = await api.post('/auth/register', {
    name,
    email,
    password,
    phone,
  });
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  
  // If login is successful and doesn't require 2FA, store the token
  if (response.data.success && !response.data.requiresTwoFactor) {
    localStorage.setItem('token', response.data.data.token);
  }
  
  return response.data;
};

export const verifyTwoFactor = async (token, userId) => {
  const response = await api.post('/auth/2fa/verify', {
    token,
    userId,
  });
  
  if (response.data.success) {
    localStorage.setItem('token', response.data.data.token);
  }
  
  return response.data;
};

export const setupTwoFactor = async () => {
  const response = await api.post('/auth/2fa/setup');
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data.data;
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return false;
  }
  
  try {
    // Check if token is expired
    const decoded = jwt_decode(token);
    const currentTime = Date.now() / 1000;
    
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const getUserRole = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt_decode(token);
    return decoded.role;
  } catch (error) {
    return null;
  }
};