// frontend/src/components/customer/CustomerDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PackageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Alert } from '../shared/Alert';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useAuth } from '../../hooks/useAuth';
import * as trackingService from '../../services/tracking';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewPackageModal, setShowNewPackageModal] = useState(false);
  const [newPackage, setNewPackage] = useState({
    recipientName: '',
    recipientAddress: '',
    recipientPhone: '',
    recipientEmail: '',
    weight: '',
    description: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await trackingService.getPackagesByUser();
        setPackages(response.data.data);
      } catch (err) {
        setError('Failed to load packages. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handleNewPackageChange = (e) => {
    setNewPackage({
      ...newPackage,
      [e.target.name]: e.target.value
    });
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    setFormError('');

    // Basic validation
    if (!newPackage.recipientName || !newPackage.recipientAddress || 
        !newPackage.recipientEmail || !newPackage.recipientPhone) {
      setFormError('Please fill all required fields');
      return;
    }

    try {
      const response = await trackingService.createPackage({
        recipient: {
          name: newPackage.recipientName,
          address: newPackage.recipientAddress,
          phone: newPackage.recipientPhone,
          email: newPackage.recipientEmail
        },
        weight: newPackage.weight ? parseFloat(newPackage.weight) : undefined,
        description: newPackage.description
      });

      // Add new package to the list
      setPackages([...packages, response.data.data]);
      
      // Close modal and reset form
      setShowNewPackageModal(false);
      setNewPackage({
        recipientName: '',
        recipientAddress: '',
        recipientPhone: '',
        recipientEmail: '',
        weight: '',
        description: ''
      });
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create package');
    }
  };

  // Format date to a readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-transit':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your Packages</h1>
        <Button 
          onClick={() => setShowNewPackageModal(true)}
          className="flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Package
        </Button>
      </div>

      {error && <Alert type="error" message={error} className="mb-6" />}

      {packages.length === 0 ? (
        <Card className="text-center py-12">
          <PackageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No packages yet</h3>
          <p className="text-gray-500 mb-6">You haven't created any packages yet</p>
          <Button onClick={() => setShowNewPackageModal(true)}>
            Create your first package
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg._id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <PackageIcon className="w-5 h-5 text-primary-500 mr-2" />
                  <span className="font-medium text-gray-900 truncate max-w-[150px]">
                    {pkg.trackingNumber}
                  </span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(pkg.status)}`}>
                  {pkg.status}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Recipient</p>
                <p className="font-medium truncate">{pkg.recipient.name}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Created</p>
                <p className="font-medium">{formatDate(pkg.createdAt)}</p>
              </div>

              {pkg.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-sm truncate">{pkg.description}</p>
                </div>
              )}

              <div className="flex justify-between mt-4">
                <Link to={`/package/${pkg._id}`}>
                  <Button variant="outline" size="sm">View Details</Button>
                </Link>
                <Link to={`/package/${pkg._id}/qr-code`}>
                  <Button size="sm">View QR Code</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Package Modal */}
      <Modal
        isOpen={showNewPackageModal}
        onClose={() => setShowNewPackageModal(false)}
        title="Create New Package"
        size="lg"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowNewPackageModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="new-package-form">
              Create Package
            </Button>
          </div>
        }
      >
        {formError && <Alert type="error" message={formError} className="mb-4" />}
        
        <form id="new-package-form" onSubmit={handleCreatePackage}>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="recipientName"
                name="recipientName"
                label="Recipient Name *"
                value={newPackage.recipientName}
                onChange={handleNewPackageChange}
                required
              />
              <Input
                id="recipientEmail"
                name="recipientEmail"
                type="email"
                label="Recipient Email *"
                value={newPackage.recipientEmail}
                onChange={handleNewPackageChange}
                required
              />
            </div>
            
            <Input
              id="recipientAddress"
              name="recipientAddress"
              label="Recipient Address *"
              value={newPackage.recipientAddress}
              onChange={handleNewPackageChange}
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="recipientPhone"
                name="recipientPhone"
                label="Recipient Phone *"
                value={newPackage.recipientPhone}
                onChange={handleNewPackageChange}
                required
              />
              <Input
                id="weight"
                name="weight"
                type="number"
                step="0.01"
                label="Weight (kg)"
                value={newPackage.weight}
                onChange={handleNewPackageChange}
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                value={newPackage.description}
                onChange={handleNewPackageChange}
              ></textarea>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerDashboard;