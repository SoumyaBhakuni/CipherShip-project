import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, logout, userRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Define navigation links based on user role
  const getNavLinks = () => {
    const links = [];
    
    if (!currentUser) {
      links.push(
        { to: '/login', label: 'Login' },
        { to: '/register', label: 'Register' }
      );
    } else {
      // Common links for all logged in users
      links.push({ to: '/', label: 'Home' });

      // Role-specific links
      switch (userRole) {
        case 'admin':
          links.push({ to: '/admin', label: 'Admin Dashboard' });
          break;
        case 'delivery-agent':
          links.push({ to: '/delivery-agent', label: 'Delivery Dashboard' });
          links.push({ to: '/delivery-agent/scan', label: 'Scan QR' });
          break;
        case 'customer':
          links.push({ to: '/customer', label: 'Dashboard' });
          links.push({ to: '/customer/tracking', label: 'Track Packages' });
          break;
        default:
          break;
      }
    }
    
    return links;
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <span className="text-xl font-bold">Cipher Ship</span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navLinks.map((link, index) => (
                  <Link
                    key={index}
                    to={link.to}
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          {currentUser && (
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <span className="mr-4">{currentUser.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
          
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                to={link.to}
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {currentUser && (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;