import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, deleteUser } from '../../services/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users. Please try again later.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setShowModal(true);
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      setShowModal(false);
      setCurrentUser(null);
    } catch (err) {
      setError('Failed to update user role. Please try again.');
      console.error('Error updating user role:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(userId);
        setUsers(users.filter(user => user._id !== userId));
      } catch (err) {
        setError('Failed to delete user. Please try again.');
        console.error('Error deleting user:', err);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) return <div className="flex justify-center items-center h-64">Loading users...</div>;

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">User Management</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <select
            className="border rounded-md p-2"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="delivery_agent">Delivery Agent</option>
            <option value="customer">Customer</option>
          </select>
          <Button onClick={fetchUsers}>Refresh</Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user._id} className="p-0">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{user.name || 'N/A'}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="mt-2">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="flex">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-blue-500 hover:text-blue-700 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <p>Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
                <p>Created: {new Date(user.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No users found matching your criteria.
        </div>
      )}

      {showModal && currentUser && (
        <Modal 
          isOpen={showModal} 
          onClose={() => {
            setShowModal(false);
            setCurrentUser(null);
          }}
          title="Edit User Role"
        >
          <div className="p-4">
            <h3 className="mb-4">User: {currentUser.email}</h3>
            <div className="mb-4">
              <label className="block mb-2">Current Role: {currentUser.role}</label>
              <select
                className="w-full border rounded-md p-2"
                defaultValue={currentUser.role}
                onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
              >
                <option value="admin">Admin</option>
                <option value="delivery_agent">Delivery Agent</option>
                <option value="customer">Customer</option>
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <Button 
                type="button" 
                className="bg-gray-300 hover:bg-gray-400 mr-2"
                onClick={() => {
                  setShowModal(false);
                  setCurrentUser(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => handleUpdateRole(currentUser._id, currentUser.role)}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;