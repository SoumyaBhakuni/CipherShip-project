import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import DeliveryAgent from './pages/DeliveryAgent';
import Customer from './pages/Customer';
import ProtectedRoute from './components/shared/ProtectedRoute';

/**
 * Main application component
 * Sets up routing and context providers
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes with role-based access */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/delivery-agent/*"
              element={
                <ProtectedRoute allowedRoles={['delivery_agent']}>
                  <DeliveryAgent />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/customer/*"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Customer />
                </ProtectedRoute>
              }
            />
            
            {/* Redirect any unmatched routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;