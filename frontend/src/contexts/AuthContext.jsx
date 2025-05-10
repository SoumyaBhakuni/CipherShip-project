import { createContext, useState, useEffect } from 'react';
import { login, register, logout, verifyToken, setupTwoFactor, verifyTwoFactor } from '../services/auth';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorSetupData, setTwoFactorSetupData] = useState(null);
  const [tempAuthToken, setTempAuthToken] = useState(null);

  useEffect(() => {
    // Check if user is already logged in on initial load
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          setLoading(true);
          const userData = await verifyToken(token);
          setCurrentUser(userData);
          setIsAuthenticated(true);
        } catch (err) {
          // Token might be expired or invalid
          localStorage.removeItem('token');
          setError('Your session has expired. Please log in again.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await login(email, password);
      
      if (response.twoFactorRequired) {
        setTwoFactorRequired(true);
        setTempAuthToken(response.tempToken);
        return { success: false, twoFactorRequired: true };
      }
      
      localStorage.setItem('token', response.token);
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to login');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await register(userData);
      
      if (response.twoFactorSetup) {
        setTwoFactorSetupData(response.twoFactorData);
        setTempAuthToken(response.tempToken);
        return { success: false, twoFactorSetup: true };
      }
      
      localStorage.setItem('token', response.token);
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to register');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Always clear local auth data even if API fails
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setCurrentUser(null);
      setIsAuthenticated(false);
      setTwoFactorRequired(false);
      setTwoFactorSetupData(null);
      setTempAuthToken(null);
    }
  };

  const setupTwoFactorAuth = async (confirmationCode) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await setupTwoFactor(tempAuthToken, confirmationCode);
      
      localStorage.setItem('token', response.token);
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      setTwoFactorSetupData(null);
      setTempAuthToken(null);
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to setup two-factor authentication');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const verifyTwoFactorAuth = async (verificationCode) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await verifyTwoFactor(tempAuthToken, verificationCode);
      
      localStorage.setItem('token', response.token);
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      setTwoFactorRequired(false);
      setTempAuthToken(null);
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to verify two-factor code');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Check if the user has the required role
  const hasRole = (requiredRole) => {
    if (!currentUser || !currentUser.role) return false;
    
    if (requiredRole === 'admin') {
      return currentUser.role === 'admin';
    } else if (requiredRole === 'delivery') {
      return currentUser.role === 'admin' || currentUser.role === 'delivery';
    } else if (requiredRole === 'customer') {
      return true; // All authenticated users can access customer features
    }
    
    return false;
  };

  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated,
    twoFactorRequired,
    twoFactorSetupData,
    handleLogin,
    handleRegister,
    handleLogout,
    setupTwoFactorAuth,
    verifyTwoFactorAuth,
    hasRole,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;