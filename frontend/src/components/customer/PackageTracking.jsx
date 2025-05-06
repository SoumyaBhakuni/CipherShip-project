import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPackagesByUser, getPackageByTrackingNumber, getTrackingHistory } from '../../services/tracking';

const PackageTracking = () => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackingId, setTrackingId] = useState('');
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch customer's packages when component mounts
    fetchPackages();
  }, [currentUser]);
  
  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUser) {
        setError('You must be logged in to view your packages');
        setLoading(false);
        return;
      }
      
      const response = await getPackagesByUser();
      setPackages(response.data);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Failed to load your packages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTrackPackage = async (packageId) => {
    try {
      setLoading(true);
      setError(null);
      
      let packageData;
      let historyData;
      
      // If packageId is provided, get package by ID, otherwise use tracking number
      if (packageId) {
        // Get package history for an existing package
        historyData = await getTrackingHistory(packageId);
        // Find the package in the existing packages array
        packageData = { data: packages.find(pkg => pkg._id === packageId) };
      } else {
        // If using tracking ID from input
        if (!trackingId.trim()) {
          setError('Please enter a tracking ID');
          setLoading(false);
          return;
        }
        
        // Get package by tracking number
        packageData = await getPackageByTrackingNumber(trackingId);
        
        // If found, get its history
        if (packageData.data && packageData.data._id) {
          historyData = await getTrackingHistory(packageData.data._id);
          
          // Add to packages list if not already there
          if (!packages.find(pkg => pkg._id === packageData.data._id)) {
            setPackages(prev => [...prev, packageData.data]);
          }
        }
      }
      
      if (packageData.data) {
        setSelectedPackage(packageData.data);
        setTrackingHistory(historyData?.data || []);
      } else {
        setError('Package not found');
        setSelectedPackage(null);
        setTrackingHistory([]);
      }
    } catch (err) {
      console.error('Error tracking package:', err);
      setError('Failed to track package. Please check the tracking ID and try again.');
      setSelectedPackage(null);
      setTrackingHistory([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewQRCode = (packageId) => {
    navigate(`/customer/qrcode/${packageId}`);
  };
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in transit':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !packages.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Package Tracking</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Track by ID section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Track by ID</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter tracking ID"
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleTrackPackage()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Tracking...' : 'Track Package'}
          </button>
        </div>
      </div>
      
      {/* Your packages section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Your Packages</h2>
        
        {packages.length === 0 ? (
          <p className="text-gray-500">You don't have any packages yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packages.map((pkg) => (
                  <tr key={pkg._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{pkg.trackingId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{pkg.description || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(pkg.status)}`}>
                        {pkg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(pkg.updatedAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleTrackPackage(pkg._id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Track
                      </button>
                      <button
                        onClick={() => handleViewQRCode(pkg._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        View QR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Selected package details */}
      {selectedPackage && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Package Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-md font-medium mb-2">Basic Information</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Tracking ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedPackage.trackingId}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedPackage.status)}`}>
                      {selectedPackage.status}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(selectedPackage.createdAt).toLocaleString()}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(selectedPackage.updatedAt).toLocaleString()}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedPackage.description || 'N/A'}</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Shipping Information</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Shipping Method</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedPackage.shippingMethod || 'Standard'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Estimated Delivery</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedPackage.estimatedDelivery 
                      ? new Date(selectedPackage.estimatedDelivery).toLocaleDateString() 
                      : 'Not available'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Tracking history */}
          <div className="mt-6">
            <h3 className="text-md font-medium mb-4">Tracking History</h3>
            {trackingHistory.length === 0 ? (
              <p className="text-gray-500">No tracking history available.</p>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {trackingHistory.map((event, eventIdx) => (
                    <li key={event._id}>
                      <div className="relative pb-8">
                        {eventIdx !== trackingHistory.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              eventIdx === 0 ? 'bg-blue-500' : 'bg-gray-400'
                            }`}>
                              <svg
                                className="h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {event.status}{' '}
                                <span className="font-medium text-gray-900">{event.details}</span>
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageTracking;