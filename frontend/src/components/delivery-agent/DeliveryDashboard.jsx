import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDeliveryAgentPackages } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

const DeliveryDashboard = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'assigned', // Default to showing assigned packages
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  const [stats, setStats] = useState({
    assigned: 0,
    inTransit: 0,
    delivered: 0,
    failed: 0,
    total: 0,
  });

  useEffect(() => {
    fetchPackages();
  }, [filters.status]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await getDeliveryAgentPackages(filters);
      setPackages(response.data.packages);
      setStats(response.data.stats);
      setError(null);
    } catch (err) {
      setError('Failed to fetch packages. Please try again later.');
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = () => {
    fetchPackages();
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

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6">Delivery Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <div className="p-4">
            <h3 className="text-lg font-medium text-yellow-800">Assigned</h3>
            <p className="text-3xl font-bold text-yellow-900">{stats.assigned}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="p-4">
            <h3 className="text-lg font-medium text-blue-800">In Transit</h3>
            <p className="text-3xl font-bold text-blue-900">{stats.inTransit}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <div className="p-4">
            <h3 className="text-lg font-medium text-green-800">Delivered</h3>
            <p className="text-3xl font-bold text-green-900">{stats.delivered}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-red-50 to-red-100">
          <div className="p-4">
            <h3 className="text-lg font-medium text-red-800">Failed</h3>
            <p className="text-3xl font-bold text-red-900">{stats.failed}</p>
          </div>
        </Card>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <h3 className="text-lg font-medium mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Package Status</label>
              <select
                className="w-full border rounded-md p-2"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium">Search</label>
              <Input
                type="text"
                placeholder="Search by tracking ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block mb-1 text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>
      
      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Scan QR Code button */}
      <div className="mb-6">
        <Link to="/delivery-agent/scan">
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center w-full sm:w-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H6zM4 4a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V4zm0 6a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" clipRule="evenodd" />
            </svg>
            Scan QR Code
          </Button>
        </Link>
      </div>
      
      {/* Packages List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : packages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <Link 
              to={`/delivery-agent/package/${pkg._id}`} 
              key={pkg._id}
              className="hover:shadow-md transition-shadow duration-200"
            >
              <Card>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{pkg.trackingId}</h3>
                      <p className="text-gray-600 text-sm">
                        Delivery ID: {pkg._id.substring(0, 8)}...
                      </p>
                    </div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(pkg.status)}`}>
                        {formatStatusText(pkg.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm">
                      <span className="font-medium">Destination:</span>{' '}
                      {pkg.deliveryAddress ? `${pkg.deliveryAddress.city}, ${pkg.deliveryAddress.state}` : 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Created:</span> {formatDate(pkg.createdAt)}
                    </p>
                    {pkg.status === 'assigned' && pkg.estimatedDelivery && (
                      <p className="text-sm">
                        <span className="font-medium">Expected Delivery:</span> {formatDate(pkg.estimatedDelivery)}
                      </p>
                    )}
                    {pkg.status === 'delivered' && pkg.deliveredAt && (
                      <p className="text-sm">
                        <span className="font-medium">Delivered At:</span> {formatDate(pkg.deliveredAt)}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <span className="text-blue-600 text-sm">View Details &rarr;</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <div className="p-10 text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <h3 className="text-lg font-medium mb-2">No packages found</h3>
            <p>There are no packages matching your current filters.</p>
            {filters.status !== 'all' && (
              <button
                onClick={() => handleFilterChange('status', 'all')}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                View all packages
              </button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DeliveryDashboard;