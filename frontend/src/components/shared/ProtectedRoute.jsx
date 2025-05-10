import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Protected Route component
 * Wraps routes that require authentication and specific user roles
 * 
 * @param {Object} props
 * @param {Array} props.allowedRoles - Array of roles that are allowed to access the route
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string} [props.redirectTo='/login'] - Where to redirect if unauthorized
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({ allowedRoles, children, redirectTo = '/login' }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check if user has the required role
  const hasRequiredRole = allowedRoles.includes(user.role);
  
  // Redirect to home if authenticated but not authorized for this route
  if (!hasRequiredRole) {
    return <Navigate to="/" replace />;
  }

  // Render the protected component if user has access
  return children;
};

export default ProtectedRoute;