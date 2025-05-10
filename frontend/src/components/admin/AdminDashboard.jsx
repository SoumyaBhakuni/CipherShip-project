import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPackagesByUser } from '../../services/tracking';

// Note: We'll need to create additional admin-specific API functions
// This is a placeholder for that service
const getSystemStats = async () => {
    try {
      // Uncomment and use this line in production
      // return await api.get('/admin/stats');
  
      // Mock data for development/testing
      const mockData = {
        totalUsers: 120,
        totalPackages: 450,
        activeDeliveries: 35,
        totalDeliveryAgents: 25,
        weeklyPackages: [12, 15, 8, 23, 18, 25, 10],
        packageStatusDistribution: {
          processing: 45,
          inTransit: 35,
          delivered: 350,
          cancelled: 20,
        },
      };
  
      return { data: mockData };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return {
        data: null,
        error: 'Failed to fetch system stats',
      };
    }
  };

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentPackages, setRecentPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch system statistics
        const statsResponse = await getSystemStats();
        setStats(statsResponse.data);
        
        // Fetch recent packages (this would be replaced with an admin-specific endpoint)
        // Just using the existing function for now to demonstrate UI
        const packagesResponse = await getPackagesByUser();
        setRecentPackages(packagesResponse.data.slice(0, 5)); // Show only the 5 most recent
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link 
            to="/admin/users" 
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Manage Users
          </Link>
          <Link 
            to="/admin/logs" 
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            System Logs
          </Link>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.totalUsers || 0}</dd>
            </dl>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Total Packages</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.totalPackages || 0}</dd>
            </dl>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Active Deliveries</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.activeDeliveries || 0}</dd>
            </dl>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Delivery Agents</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.totalDeliveryAgents || 0}</dd>
            </dl>
          </div>
        </div>
      </div>
      
      {/* Package status breakdown */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Package Status Distribution</h3>
          
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="text-blue-800 text-2xl font-bold">
                {stats?.packageStatusDistribution?.processing || 0}
              </div>
              <div className="text-blue-600 text-sm">Processing</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-md">
              <div className="text-yellow-800 text-2xl font-bold">
                {stats?.packageStatusDistribution?.inTransit || 0}
              </div>
              <div className="text-yellow-600 text-sm">In Transit</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-md">
              <div className="text-green-800 text-2xl font-bold">
                {stats?.packageStatusDistribution?.delivered || 0}
              </div>
              <div className="text-green-600 text-sm">Delivered</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-md">
              <div className="text-red-800 text-2xl font-bold">
                {stats?.packageStatusDistribution?.cancelled || 0}
              </div>
              <div className="text-red-600 text-sm">Cancelled</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent packages */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Packages</h3>
          
          {recentPackages.length === 0 ? (
            <p className="text-gray-500">No recent packages to display.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentPackages.map((pkg) => (
                    <tr key={pkg._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pkg.trackingId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pkg.customer?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          pkg.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                          pkg.status === 'in transit' ? 'bg-blue-100 text-blue-800' : 
                          pkg.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {pkg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(pkg.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/admin/packages/${pkg._id}`} className="text-indigo-600 hover:text-indigo-900">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-4 text-right">
            <Link 
              to="/admin/packages" 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all packages →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;