import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ContentCard from '../../components/ContentCard';
import FormComponent from '../../components/FormComponent';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminService } from '../../services/adminService';

/**
 * UserManagement component for adding and managing users
 * 
 * @param {Object} props
 * @param {Function} props.addToContentRefs - Function to add elements to content refs for animation
 */
const UserManagement = ({ addToContentRefs }) => {
  const [users, setUsers] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Fetch users, faculties, and roles data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get auth token
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');
        
        // Fetch users with pagination
        const response = await adminService.getUsers(token, currentPage, itemsPerPage, searchQuery);
        console.log('Users response:', response);
        
        if (response && response.users) {
          setUsers(response.users);
          setTotalPages(Math.ceil(response.total / itemsPerPage) || 1);
        } else {
          console.warn('Unexpected users response format:', response);
          setUsers([]);
          setTotalPages(1);
        }
        
        // Fetch faculties for dropdown
        const facultyResponse = await adminService.getFaculties(token);
        console.log('Faculties response:', facultyResponse);
        setFaculties(Array.isArray(facultyResponse) ? facultyResponse : []);
        
        // Fetch roles for dropdown
        const roleResponse = await adminService.getRoles(token);
        console.log('Roles response:', roleResponse);
        setRoles(Array.isArray(roleResponse) ? roleResponse : []);
        
        // Log activity for analytics
        try {
          await adminService.logActivity(token, 'View', 'Accessed user management page');
        } catch (logError) {
          console.error('Error logging activity:', logError);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setFormError('Failed to load users. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentPage, searchQuery, itemsPerPage, lastRefresh]);

  // Handle search input change
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Convert roles to options format for FormComponent
  const roleOptions = roles.map(role => ({
    value: role.role_id,
    label: role.role_name || `Role ${role.role_id}`
  }));

  // Convert faculties to options format for FormComponent
  const facultyOptions = faculties.map(faculty => ({
    value: faculty.faculty_id,
    label: faculty.faculty_name
  }));

  // Form fields for adding/editing users
  const getUserFields = () => [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      placeholder: 'Enter first name',
      required: true,
      value: editingUser?.first_name || ''
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Enter last name',
      required: true,
      value: editingUser?.last_name || ''
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'Enter university email',
      required: true,
      value: editingUser?.email || '',
      validate: (value) => {
        if (!value.includes('@')) {
          return 'Please enter a valid email address';
        }
        return null;
      }
    },
    {
      name: 'faculty',
      label: 'Faculty',
      type: 'select',
      required: true,
      value: editingUser?.faculty_id || '',
      options: [
        { value: '', label: 'Select a faculty' },
        ...facultyOptions
      ]
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      value: editingUser?.role_id || '',
      options: [
        { value: '', label: 'Select a role' },
        ...roleOptions
      ],
      helpText: 'Select user role (Administrator, Marketing Manager, Faculty Coordinator, Student)'
    },
    {
      name: 'password',
      label: editingUser ? 'New Password (leave blank to keep current)' : 'Password',
      type: 'password',
      placeholder: editingUser ? 'Leave blank to keep current password' : 'Enter password',
      required: !editingUser,
      minLength: 8,
      helpText: 'Must be at least 8 characters'
    }
  ];

  // Handle form submission for adding/editing users
  const handleUserSubmit = async (formValues) => {
    try {
      setIsLoading(true);
      setFormError('');
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      console.log('Submitting user form with values:', {
        ...formValues,
        password: formValues.password ? '[REDACTED]' : undefined
      });
      
      const userData = {
        first_name: formValues.firstName,
        last_name: formValues.lastName,
        email: formValues.email.toLowerCase().trim(),
        faculty_id: formValues.faculty,
        role_id: formValues.role,
        password: formValues.password || undefined // Only include if provided
      };
      
      let response;
      
      if (editingUser) {
        // Update existing user
        response = await adminService.updateUser(token, editingUser.user_id, userData);
        console.log('User update response:', response);
        
        setSuccessMessage(`User ${userData.first_name} ${userData.last_name} updated successfully!`);
        
        // Log activity for analytics
        try {
          await adminService.logActivity(
            token, 
            'Update', 
            `Updated user: ${userData.first_name} ${userData.last_name} (${userData.email})`
          );
        } catch (logError) {
          console.error('Error logging activity:', logError);
        }
      } else {
        // Add new user
        response = await adminService.createUser(token, userData);
        console.log('User creation response:', response);
        
        setSuccessMessage(`User ${userData.first_name} ${userData.last_name} created successfully!`);
        
        // Log activity for analytics
        try {
          await adminService.logActivity(
            token, 
            'Create', 
            `Created new user: ${userData.first_name} ${userData.last_name} (${userData.email})`
          );
        } catch (logError) {
          console.error('Error logging activity:', logError);
        }
      }
      
      // Reset form state
      setAddingUser(false);
      setEditingUser(null);
      
      // Refresh the user list
      setLastRefresh(Date.now());
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error saving user:', err);
      setFormError(err.response?.data?.error || 'Failed to save user. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle user edit button click
  const handleEditUser = (user) => {
    console.log('Editing user:', user);
    setEditingUser(user);
    setAddingUser(true);
    setFormError('');
    setSuccessMessage('');
  };

  // Handle user delete button click
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      // Get user details for logging
      const userToDelete = users.find(u => u.user_id === userId);
      
      // Delete user
      console.log('Deleting user:', userId);
      const response = await adminService.deleteUser(token, userId);
      console.log('User deletion response:', response);
      
      // Log activity for analytics
      if (userToDelete) {
        try {
          await adminService.logActivity(
            token, 
            'Delete', 
            `Deleted user: ${userToDelete.first_name} ${userToDelete.last_name} (${userToDelete.email})`
          );
        } catch (logError) {
          console.error('Error logging activity:', logError);
        }
      }
      
      setSuccessMessage('User deleted successfully');
      
      // Refresh the user list
      setLastRefresh(Date.now());
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error deleting user:', err);
      setFormError(err.response?.data?.error || 'Failed to delete user. Please try again.');
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get role name by ID
  const getRoleName = (roleId) => {
    // Handle both numeric and string role IDs
    const role = roles.find(r => 
      r.role_id === roleId || 
      r.role_id === Number(roleId) || 
      String(r.role_id) === String(roleId)
    );
    
    return role ? role.role_name : roleId;
  };

  // Get faculty name by ID
  const getFacultyName = (facultyId) => {
    const faculty = faculties.find(f => f.faculty_id === facultyId);
    return faculty ? faculty.faculty_name : facultyId;
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Get appropriate role color
  const getRoleColor = (roleId) => {
    // Convert roleId to string for comparison
    const role = String(roleId);
    
    if (role === '1' || role === 'ADMIN') return 'bg-purple-700 text-purple-100';
    if (role === '2' || role === 'MNGR') return 'bg-green-700 text-green-100';
    if (role === '3' || role === 'COORD') return 'bg-blue-700 text-blue-100';
    return 'bg-gray-700 text-gray-100';
  };

  if (isLoading && users.length === 0) {
    return <LoadingSpinner label="Loading users..." />;
  }

  return (
    <>
      <motion.h1 
        ref={addToContentRefs}
        className="text-3xl font-bold mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        User Management
      </motion.h1>
      
      {/* Success Message */}
      {successMessage && (
        <div ref={addToContentRefs} className="mb-6">
          <div className="bg-green-700 border border-green-600 text-white px-4 py-3 rounded relative">
            <span className="block sm:inline">{successMessage}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setSuccessMessage('')}
            >
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {formError && (
        <div ref={addToContentRefs} className="mb-6">
          <div className="bg-red-700 border border-red-600 text-white px-4 py-3 rounded relative">
            <span className="block sm:inline">{formError}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setFormError('')}
            >
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* User Form */}
      {addingUser ? (
        <div ref={addToContentRefs} className="mb-6">
          <ContentCard title={editingUser ? "Edit User" : "Add New User"}>
            <FormComponent
              fields={getUserFields()}
              onSubmit={handleUserSubmit}
              submitText={isLoading ? "Saving..." : (editingUser ? "Update User" : "Add User")}
              isSubmitting={isLoading}
              error={formError}
              footer={
                <div className="flex justify-between mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setAddingUser(false);
                      setEditingUser(null);
                      setFormError('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : (editingUser ? "Update User" : "Add User")}
                  </Button>
                </div>
              }
            />
          </ContentCard>
        </div>
      ) : (
        <div ref={addToContentRefs} className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={() => {
                setAddingUser(true);
                setEditingUser(null);
                setFormError('');
              }}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              Add New User
            </Button>
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearch}
                className="px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Users List */}
      <div ref={addToContentRefs}>
        <ContentCard>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Faculty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                            {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-400">
                              Created: {formatDate(user.created_at)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role_id)}`}>
                          {getRoleName(user.role_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {getFacultyName(user.faculty_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(user.last_login)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-400 hover:text-blue-300 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.user_id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      {isLoading ? (
                        <div className="flex justify-center">
                          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        'No users found'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 px-6 py-3 bg-gray-700 rounded-b">
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </ContentCard>
      </div>
    </>
  );
};

export default UserManagement;