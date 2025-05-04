import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ContentCard from '../../components/ContentCard';
import FormComponent from '../../components/FormComponent';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminService } from '../../services/adminService';

/**
 * FacultyManagement component for managing university faculties
 * 
 * @param {Object} props
 * @param {Function} props.addToContentRefs - Function to add elements to content refs for animation
 */
const FacultyManagement = ({ addToContentRefs }) => {
  const [faculties, setFaculties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [addingFaculty, setAddingFaculty] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [facultyStats, setFacultyStats] = useState([]);

  // Fetch faculties data and statistics
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get auth token
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');
        
        // Fetch faculties
        const facultiesResponse = await adminService.getFaculties(token);
        setFaculties(facultiesResponse);
        
        // Fetch marketing coordinators for dropdown
        const coordResponse = await adminService.getMarketingCoordinators(token);
        setCoordinators(coordResponse);
        
        // Fetch faculty statistics
        const statsResponse = await adminService.getFacultyStats(token);
        setFacultyStats(statsResponse);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching faculty data:', err);
        setFormError('Failed to load faculties. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Convert coordinators to options format for FormComponent
  const coordinatorOptions = coordinators.map(coord => ({
    value: coord.user_id,
    label: `${coord.first_name} ${coord.last_name} (${coord.email})`
  }));

  // Form fields for adding/editing faculties
  const getFacultyFields = () => [
    {
      name: 'facultyId',
      label: 'Faculty ID',
      type: 'text',
      placeholder: 'e.g., ARTS&HUM, BUS, ENG',
      required: true,
      value: editingFaculty?.faculty_id || '',
      disabled: !!editingFaculty, // Disable editing faculty ID for existing faculties
      helpText: 'Unique identifier for the faculty (e.g., ARTS&HUM)',
      validate: (value) => {
        if (value && !/^[A-Za-z0-9&]+$/.test(value)) {
          return 'Faculty ID can only contain letters, numbers, and &';
        }
        return null;
      }
    },
    {
      name: 'facultyName',
      label: 'Faculty Name',
      type: 'text',
      placeholder: 'e.g., Arts & Humanities',
      required: true,
      value: editingFaculty?.faculty_name || ''
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Describe the faculty...',
      value: editingFaculty?.description || '',
      rows: 3
    },
    {
      name: 'coordinatorId',
      label: 'Marketing Coordinator',
      type: 'select',
      value: editingFaculty?.coordinator_id?.toString() || '',
      options: [
        { value: '', label: 'Select a coordinator' },
        ...coordinatorOptions
      ],
      helpText: 'Assign a marketing coordinator to this faculty'
    }
  ];

  // Handle form submission for adding/editing faculties
  const handleFacultySubmit = async (formValues) => {
    try {
      setIsLoading(true);
      setFormError('');
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      const facultyData = {
        faculty_id: formValues.facultyId.toUpperCase(),
        faculty_name: formValues.facultyName,
        description: formValues.description,
        coordinator_id: formValues.coordinatorId || null
      };
      
      if (editingFaculty) {
        // Update existing faculty
        await adminService.updateFaculty(token, editingFaculty.faculty_id, facultyData);
        setSuccessMessage(`Faculty "${facultyData.faculty_name}" updated successfully!`);
      } else {
        // Add new faculty
        await adminService.createFaculty(token, facultyData);
        setSuccessMessage(`Faculty "${facultyData.faculty_name}" created successfully!`);
      }
      
      // Refresh faculty list
      const facultiesResponse = await adminService.getFaculties(token);
      setFaculties(facultiesResponse);
      
      // Reset form state
      setAddingFaculty(false);
      setEditingFaculty(null);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error saving faculty:', err);
      setFormError(err.response?.data?.error || 'Failed to save faculty. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle faculty edit button click
  const handleEditFaculty = (faculty) => {
    setEditingFaculty(faculty);
    setAddingFaculty(true);
    setFormError('');
    setSuccessMessage('');
  };

  // Handle faculty delete button click
  const handleDeleteFaculty = async (facultyId) => {
    if (!window.confirm('Are you sure you want to delete this faculty? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      // Delete faculty
      await adminService.deleteFaculty(token, facultyId);
      
      // Refresh faculty list
      const facultiesResponse = await adminService.getFaculties(token);
      setFaculties(facultiesResponse);
      
      setSuccessMessage('Faculty deleted successfully');
      setIsLoading(false);
    } catch (err) {
      console.error('Error deleting faculty:', err);
      setFormError(err.response?.data?.error || 'Failed to delete faculty. Please try again.');
      setIsLoading(false);
    }
  };

  // Get coordinator name by ID
  const getCoordinatorName = (coordinatorId) => {
    if (!coordinatorId) return 'Not assigned';
    
    const coordinator = coordinators.find(c => c.user_id === parseInt(coordinatorId));
    return coordinator ? `${coordinator.first_name} ${coordinator.last_name}` : 'Unknown';
  };

  // Get faculty statistics
  const getFacultyStatistics = (facultyId) => {
    const stats = facultyStats.find(s => s.faculty_id === facultyId);
    return stats || { submission_count: 0, selected_count: 0, contributor_count: 0 };
  };

  if (isLoading && faculties.length === 0) {
    return <LoadingSpinner label="Loading faculties..." />;
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
        Faculty Management
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
      
      {/* Faculty Form */}
      {addingFaculty ? (
        <div ref={addToContentRefs} className="mb-6">
          <ContentCard title={editingFaculty ? "Edit Faculty" : "Add New Faculty"}>
            <FormComponent
              fields={getFacultyFields()}
              onSubmit={handleFacultySubmit}
              submitText={isLoading ? "Saving..." : (editingFaculty ? "Update Faculty" : "Add Faculty")}
              isSubmitting={isLoading}
              error={formError}
              footer={
                <div className="flex justify-between mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setAddingFaculty(false);
                      setEditingFaculty(null);
                      setFormError('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : (editingFaculty ? "Update Faculty" : "Add Faculty")}
                  </Button>
                </div>
              }
            />
          </ContentCard>
        </div>
      ) : (
        <div ref={addToContentRefs} className="mb-6">
          <Button
            onClick={() => {
              setAddingFaculty(true);
              setEditingFaculty(null);
              setFormError('');
            }}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add New Faculty
          </Button>
        </div>
      )}
      
      {/* Faculty List */}
      <div ref={addToContentRefs}>
        <ContentCard>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Faculty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Coordinator
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Statistics
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {faculties.map((faculty) => {
                  const stats = getFacultyStatistics(faculty.faculty_id);
                  
                  return (
                    <tr key={faculty.faculty_id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {faculty.faculty_id.slice(0, 2)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {faculty.faculty_name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {faculty.faculty_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {faculty.description ? (
                          faculty.description.length > 50 ? 
                            faculty.description.substring(0, 50) + '...' :
                            faculty.description
                        ) : (
                          <span className="text-gray-500 italic">No description</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {getCoordinatorName(faculty.coordinator_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-300">
                            <span className="text-blue-400">{stats.submission_count}</span> Submissions
                          </div>
                          <div className="text-gray-300">
                            <span className="text-green-400">{stats.selected_count}</span> Selected
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditFaculty(faculty)}
                          className="text-blue-400 hover:text-blue-300 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFaculty(faculty.faculty_id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {faculties.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No faculties found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ContentCard>
      </div>
    </>
  );
};

export default FacultyManagement;