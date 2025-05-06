import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPackageById } from '../../services/tracking';
import QRCodeGenerator from '../shared/QRCodeGenerator';

const QRCodeView = () => {
  const { packageId } = useParams();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    if (!currentUser) {
      navigate('/login', { state: { from: `/customer/qrcode/${packageId}` } });
      return;
    }

    fetchPackageData();
  }, [packageId, currentUser]);

  const fetchPackageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getPackageById(packageId);
      setPackageData(response.data);
    } catch (err) {
      console.error('Error fetching package data:', err);
      setError('Failed to load package data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR code data in the required format for the delivery agent
  const prepareQRData = () => {
    if (!packageData) return null;

    // Create a data object with necessary information
    // This data will be encrypted in a real system before being encoded in the QR code
    const qrData = {
      packageId: packageData._id,
      trackingId: packageData.trackingId,
      customerId: packageData.customerId,
      status: packageData.status,
      // The following would be encrypted in a real system
      recipientDetails: {
        name: packageData.recipientName,
        address: packageData.deliveryAddress,
        phone: packageData.recipientPhone
      },
      // Include a token or signature for verification
      timestamp: Date.now(),
      // This would be an encrypted signature in a real app
      verificationCode: `verify-${packageData._id}-${Date.now()}`
    };

    // In a real app, this data would be encrypted here or via an API call
    return qrData;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/customer/tracking')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Tracking
        </button>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Package not found
        </div>
        <button
          onClick={() => navigate('/customer/tracking')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Tracking
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/customer/tracking')}
          className="mr-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tracking
        </button>
        <h1 className="text-2xl font-bold">Package QR Code</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-medium mb-4">QR Code</h2>
            <p className="mb-4 text-gray-600">
              This QR code contains encrypted information about your package. The delivery agent will scan this
              QR code to verify the delivery information.
            </p>
            <div className="flex justify-center">
              <QRCodeGenerator 
                data={prepareQRData()} 
                encrypted={false} 
                size={250} 
              />
            </div>
            <div className="mt-6 text-sm text-gray-500 text-center">
              <p>Tracking ID: {packageData.trackingId}</p>
              <p className="mt-1">
                Status: <span className="font-medium">{packageData.status}</span>
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-4">Package Details</h2>
            <dl className="divide-y divide-gray-200">
              <div className="py-4 flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Created On</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(packageData.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="py-4 flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(packageData.updatedAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="py-4 flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Estimated Delivery</dt>
                <dd className="text-sm text-gray-900">
                  {packageData.estimatedDelivery 
                    ? new Date(packageData.estimatedDelivery).toLocaleDateString() 
                    : 'Not available'}
                </dd>
              </div>
              <div className="py-4 flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="text-sm text-gray-900">{packageData.description || 'N/A'}</dd>
              </div>
              <div className="py-4 flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Shipping Method</dt>
                <dd className="text-sm text-gray-900">{packageData.shippingMethod || 'Standard'}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <h3 className="text-md font-medium mb-2">Instructions</h3>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                <li>Show this QR code to the delivery agent when they arrive</li>
                <li>The QR code contains encrypted delivery information</li>
                <li>Only authorized delivery agents can scan and decrypt this code</li>
                <li>Each scan is logged for security purposes</li>
                <li>For any issues, contact customer support with your tracking ID</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeView;