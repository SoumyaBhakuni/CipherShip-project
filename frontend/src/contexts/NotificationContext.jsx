import { createContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to WebSocket server with auth token
    const socketConnection = io(import.meta.env.VITE_API_URL, {
      auth: {
        token
      }
    });

    socketConnection.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketConnection.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Listen for notifications
    socketConnection.on('notification', (notification) => {
      addNotification(notification);
    });

    // Listen for package updates
    socketConnection.on('package_update', (update) => {
      addNotification({
        id: `package-${update.packageId}-${Date.now()}`,
        title: 'Package Update',
        message: update.message,
        type: update.type || 'info',
        read: false,
        timestamp: new Date().toISOString(),
        data: update
      });
    });

    // Listen for security alerts
    socketConnection.on('security_alert', (alert) => {
      addNotification({
        id: `security-${Date.now()}`,
        title: 'Security Alert',
        message: alert.message,
        type: 'warning',
        read: false,
        timestamp: new Date().toISOString(),
        data: alert
      });
    });

    setSocket(socketConnection);

    // Cleanup socket connection on unmount
    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, []);

  // Load existing notifications on initial mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.notifications.filter(n => !n.read).length);
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();
  }, []);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50 notifications
    setUnreadCount(prev => prev + 1);

    // Show browser notification if user has granted permission
    if (Notification.permission === 'granted' && document.visibilityState !== 'visible') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Optimistically update UI
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Update on server
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Optimistically update UI
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);

      // Update on server
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  // Remove a notification
  const removeNotification = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Optimistically update UI
      const notificationToRemove = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notificationToRemove && !notificationToRemove.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Update on server
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Failed to remove notification:', error);
    }
  }, [notifications]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return { success: false, error: 'Browser does not support notifications' };
    }

    if (Notification.permission === 'granted') {
      return { success: true };
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return { success: permission === 'granted' };
    }

    return { success: false, error: 'Notification permission denied' };
  }, []);

  // Send a custom notification to a specific user or role
  const sendCustomNotification = useCallback((userId, notification) => {
    if (!socket || !isConnected) return false;
    
    socket.emit('send_notification', {
      userId,
      notification: {
        ...notification,
        timestamp: new Date().toISOString()
      }
    });
    
    return true;
  }, [socket, isConnected]);

  const value = {
    notifications,
    unreadCount,
    isConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    requestNotificationPermission,
    sendCustomNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;