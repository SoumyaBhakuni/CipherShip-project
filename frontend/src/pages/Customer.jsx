import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerDashboard from '../components/customer/CustomerDashboard';
import PackageTracking from '../components/customer/PackageTracking';
import QRCodeView from '../components/customer/QRCodeView';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import { useAuth } from '../hooks/useAuth';
import { getCustomerPackages } from '../services/tracking';

/**
 * Customer page component 
 * Container for customer features including dashboard, package tracking and QR code view
 */
const Customer = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or not a customer
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user && user.role !== 'customer') {
      navigate('/');
      return;
    }

    // Fetch customer packages
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await getCustomerPackages();
        setPackages(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError('Failed to load packages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [isAuthenticated, user, navigate]);

  // Render tabs based on active selection
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CustomerDashboard packages={packages} loading={loading} />;
      case 'tracking':
        return <PackageTracking packages={packages} loading={loading} />;
      case 'qrcode':
        return <QRCodeView packages={packages} loading={loading} />;
      default:
        return <CustomerDashboard packages={packages} loading={loading} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Customer Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 mr-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'dashboard'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`px-4 py-2 mr-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'tracking'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab('tracking')}
          >
            Track Packages
          </button>
          <button
            className={`px-4 py-2 mr-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'qrcode'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab('qrcode')}
          >
            My QR Codes
          </button>
        </div>
        
        {/* Content Area */}
        <div className="bg-white rounded-lg shadow p-6">
          {renderContent()}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Customer;