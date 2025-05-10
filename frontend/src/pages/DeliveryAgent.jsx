import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import DeliveryDashboard from '../components/delivery-agent/DeliveryDashboard';
import ScanQR from '../components/delivery-agent/ScanQR';
import PackageDetails from '../components/delivery-agent/PackageDetails';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Alert from '../components/shared/Alert';

const DeliveryAgent = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Check if user is authenticated and has delivery-agent role
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user.role !== 'delivery-agent') {
      setError('Unauthorized: Delivery agent access only');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [isAuthenticated, user, navigate]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset selected package when changing tabs
    if (tab !== 'package-details') {
      setSelectedPackage(null);
    }
  };

  // Handle package selection
  const handleSelectPackage = (packageData) => {
    setSelectedPackage(packageData);
    setActiveTab('package-details');
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle successful QR scan
  const handleSuccessfulScan = (packageData) => {
    setSelectedPackage(packageData);
    setActiveTab('package-details');
  };

  // If no user or not delivery-agent role, show error
  if (!user || user.role !== 'delivery-agent') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <Alert type="error" message={error || 'Unauthorized access'} />
            <div className="mt-4">
              <Button onClick={() => navigate('/')}>Return to Home</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Delivery Agent Portal</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                Welcome, {user.name}
              </span>
              <Button onClick={handleLogout} variant="outlined">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tab navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => handleTabChange('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`${
                activeTab === 'scan-qr'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => handleTabChange('scan-qr')}
            >
              Scan QR Code
            </button>
            {selectedPackage && (
              <button
                className={`${
                  activeTab === 'package-details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => handleTabChange('package-details')}
              >
                Package Details
              </button>
            )}
          </nav>
        </div>

        {/* Tab content */}
        <div className="py-6">
          {activeTab === 'dashboard' && (
            <DeliveryDashboard onSelectPackage={handleSelectPackage} />
          )}
          {activeTab === 'scan-qr' && (
            <ScanQR onSuccessfulScan={handleSuccessfulScan} />
          )}
          {activeTab === 'package-details' && selectedPackage && (
            <PackageDetails packageData={selectedPackage} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryAgent;