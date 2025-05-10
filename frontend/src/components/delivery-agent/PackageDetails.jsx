import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPackageDetails, updatePackageStatus, getPackageQRCode } from '../../services/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';

const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQRCodeData] = useState(null);
  const [qrLoading, setQRLoading] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    fetchPackageDetails();
  }, [id]);

  const fetchPackageDetails = async () => {
    try {
      setLoading(true);
      const response = await getPackageDetails(id);
      setPackageData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch package details. Please try again later.');
      console.error('Error fetching package details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status) => {
    setStatusToUpdate(status);
    setShowConfirmModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      setLoading(true);
      await updatePackageStatus(id, statusToUpdate, statusNote);
      fetchPackageDetails(); // Refresh data
      setShowConfirmModal(false);
      setStatusNote('');
    } catch (err) {
      setError(`Failed to update package status: ${err.message}`);
      console.error('Error updating package status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQRCode = async () => {
    try {
      setQRLoading(true);
      const response = await getPackageQRCode(id);
      setQRCodeData(response.data.qrCodeUrl);
      setShowQRModal(true);
    } catch (err) {
      setError('Failed to fetch QR code. Please try again later.');
      console.error('Error fetching QR code:', err);
    } finally {
      setQRLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatStatusText = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading && !packageData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !packageData) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <h3 className="font-bold">Error</h3>
        <p>{error}</p>
        <div className="mt-4">
          <Button onClick={() => navigate('/delivery-agent')} className="mr-2">
            Back to Dashboard
          </Button>
          <Button onClick={fetchPackageDetails}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-bold mb-4">Package Not Found</h3>
        <p className="mb-4">The package you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => navigate('/delivery-agent')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/delivery-agent')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold">Package Details</h2>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Package Status Card */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold">{packageData.trackingId}</h3>
              <p className="text-gray-600">ID: {packageData._id}</p>
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(packageData.status)}`}>
                {formatStatusText(packageData.status)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p>{formatDate(packageData.createdAt)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p>{formatDate(packageData.updatedAt)}</p>
            </div>
            
            {packageData.assignedAt && (
              <div>
                <p className="text-sm text-gray-500">Assigned At</p>
                <p>{formatDate(packageData.assignedAt)}</p>
              </div>
            )}
            
            {packageData.inTransitAt && (
              <div>
                <p className="text-sm text-gray-500">In Transit Since</p>
                <p>{formatDate(packageData.inTransitAt)}</p>
              </div>
            )}
            
            {packageData.deliveredAt && (
              <div>
                <p className="text-sm text-gray-500">Delivered At</p>
                <p>{formatDate(packageData.deliveredAt)}</p>
              </div>
            )}
            
            {packageData.estimatedDelivery && (
              <div>
                <p className="text-sm text-gray-500">Estimated Delivery</p>
                <p>{formatDate(packageData.estimatedDelivery)}</p>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-between">
            <div className="flex flex-wrap gap-3">
              {/* Show different buttons based on current status */}
              {packageData.status === 'assigned' && (
                <Button onClick={() => handleStatusChange('in_transit')} className="bg-blue-600 hover:bg-blue-700">
                  Start Delivery
                </Button>
              )}
              
              {packageData.status === 'in_transit' && (
                <>
                  <Button onClick={() => handleStatusChange('delivered')} className="bg-green-600 hover:bg-green-700">
                    Mark as Delivered
                  </Button>
                  <Button onClick={() => handleStatusChange('failed')} className="bg-red-600 hover:bg-red-700">
                    Mark as Failed
                  </Button>
                </>
              )}
              
              {/* Scan button available for assigned and in_transit statuses */}
              {['assigned', 'in_transit'].includes(packageData.status) && (
                <Link to={`/delivery-agent/scan?packageId=${packageData._id}`}>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Scan QR Code
                  </Button>
                </Link>
              )}
            </div>
            
            <Button 
              onClick={handleViewQRCode} 
              disabled={qrLoading}
              className="bg-gray-600 hover:bg-gray-700"
            >
              {qrLoading ? 'Loading...' : 'View QR Code'}
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Customer Information Card - Only shows encrypted/masked data until QR is scanned */}
      <Card className="mb-6">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">Customer Information</h3>
          
          {packageData.customerInfoDecrypted ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer Name</p>
                <p>{packageData.customerName}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p>{packageData.customerPhone}</p>
              </div>
              
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p>{packageData.deliveryAddress?.street}, {packageData.deliveryAddress?.city}</p>
                <p>{packageData.deliveryAddress?.state}, {packageData.deliveryAddress?.country} {packageData.deliveryAddress?.zipCode}</p>
              </div>
              
              {packageData.additionalInstructions && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Delivery Instructions</p>
                  <p>{packageData.additionalInstructions}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="mb-3">🔒 Customer information is encrypted</p>
              <p className="text-sm text-gray-500 mb-4">Scan the QR code to decrypt customer details for delivery</p>
              
              <Link to={`/delivery-agent/scan?packageId=${packageData._id}`}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Scan QR Code
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
      
      {/* Package History */}
      {packageData.statusHistory && packageData.statusHistory.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4">Package History</h3>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-5 bottom-0 w-0.5 bg-gray-200"></div>
              
              {/* Timeline events */}
              <div className="space-y-6 ml-10">
                {packageData.statusHistory.map((event, index) => (
                  <div key={index} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-10 mt-1.5">
                      <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white"></div>
                    </div>
                    
                    <div>
                      <p className="font-medium">{formatStatusText(event.status)}</p>
                      <p className="text-sm text-gray-500">{formatDate(event.timestamp)}</p>
                      {event.note && <p className="text-sm mt-1">{event.note}</p>}
                      {event.user && <p className="text-xs text-gray-500 mt-1">Updated by: {event.user.name || event.user.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {/* Status Update Confirmation Modal */}
      {showConfirmModal && (
        <Modal 
          isOpen={showConfirmModal} 
          onClose={() => setShowConfirmModal(false)}
          title={`Update Package Status to ${formatStatusText(statusToUpdate)}`}
        >
          <div className="p-4">
            <p className="mb-4">
              Are you sure you want to update the package status from 
              <span className="font-medium"> {formatStatusText(packageData.status)} </span> 
              to <span className="font-medium"> {formatStatusText(statusToUpdate)}?</span>
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Add a note (optional):</label>
              <textarea
                className="w-full border rounded-md p-2"
                rows="3"
                placeholder="Add any relevant details about this status change..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              ></textarea>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                onClick={() => setShowConfirmModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmStatusChange}
                className={`
                  ${statusToUpdate === 'in_transit' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  ${statusToUpdate === 'delivered' ? 'bg-green-600 hover:bg-green-700' : ''}
                  ${statusToUpdate === 'failed' ? 'bg-red-600 hover:bg-red-700' : ''}
                `}
              >
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* QR Code Modal */}
      {showQRModal && qrCodeData && (
        <Modal 
          isOpen={showQRModal} 
          onClose={() => setShowQRModal(false)}
          title="Package QR Code"
        >
          <div className="p-4 text-center">
            <div className="mb-4">
              <img 
                src={qrCodeData} 
                alt="Package QR Code" 
                className="mx-auto max-w-full h-auto"
                style={{maxHeight: '300px'}}
              />
            </div>
            <p className="mb-4 text-sm text-gray-600">
              This QR code contains encrypted delivery information. 
              <br />Only authorized delivery agents can scan and decrypt this data.
            </p>
            <div className="flex justify-center gap-3">
              <Button 
                onClick={() => setShowQRModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800"
              >
                Close
              </Button>
              <Link to={`/delivery-agent/scan?packageId=${packageData._id}`}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Scan QR Code
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PackageDetails;