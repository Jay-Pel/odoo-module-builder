import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const ProjectCreationModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectId, setProjectId] = useState(null);
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm();

  const createProjectMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/projects/', {
        name: data.name,
        odoo_version: parseInt(data.odoo_version),
        description: data.description
      });
      return response.data;
    },
    onSuccess: (data) => {
      setProjectId(data.id);
      setCurrentStep(2);
    }
  });

  const generateSpecMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(`/specifications/generate/${projectId}`, {
        requirements: data.requirements
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      setCurrentStep(3);
    }
  });

  const handleStep1Submit = (data) => {
    createProjectMutation.mutate(data);
  };

  const handleStep2Submit = (data) => {
    generateSpecMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    setCurrentStep(1);
    setProjectId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Create New Odoo Module Project
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[
                { step: 1, title: 'Project Details', icon: '📝' },
                { step: 2, title: 'Requirements', icon: '⚙️' },
                { step: 3, title: 'Generation', icon: '🚀' }
              ].map((item) => (
                <div key={item.step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= item.step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <span className="text-sm">{item.icon}</span>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">{item.title}</span>
                  {item.step < 3 && (
                    <div className={`ml-4 w-16 h-1 ${
                      currentStep > item.step ? 'bg-primary-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Project Details */}
          {currentStep === 1 && (
            <form onSubmit={handleSubmit(handleStep1Submit)} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Module Name *
                </label>
                <input
                  {...register('name', {
                    required: 'Module name is required',
                    minLength: { value: 3, message: 'Name must be at least 3 characters' },
                    maxLength: { value: 50, message: 'Name must be less than 50 characters' }
                  })}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Custom Inventory Management"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="odoo_version" className="block text-sm font-medium text-gray-700">
                  Odoo Version *
                </label>
                <select
                  {...register('odoo_version', { required: 'Please select an Odoo version' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Odoo Version</option>
                  <option value="17">Odoo 17 (Latest)</option>
                  <option value="16">Odoo 16</option>
                  <option value="15">Odoo 15</option>
                  <option value="14">Odoo 14</option>
                </select>
                {errors.odoo_version && (
                  <p className="mt-1 text-sm text-red-600">{errors.odoo_version.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Brief Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Brief description of what this module should do..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  {createProjectMutation.isPending ? 'Creating...' : 'Next'}
                </button>
              </div>

              {createProjectMutation.error && (
                <div className="text-red-600 text-sm">
                  Error: {createProjectMutation.error.response?.data?.detail || 'Failed to create project'}
                </div>
              )}
            </form>
          )}

          {/* Step 2: Requirements */}
          {currentStep === 2 && (
            <form onSubmit={handleSubmit(handleStep2Submit)} className="space-y-6">
              <div>
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                  Detailed Requirements *
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Describe what your module should do. Be as specific as possible about features, workflows, and business logic.
                </p>
                <textarea
                  {...register('requirements', {
                    required: 'Requirements are required',
                    minLength: { value: 50, message: 'Please provide more detailed requirements (at least 50 characters)' }
                  })}
                  rows={8}
                  className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Example: I need a module that manages rental equipment with the following features:
- Track rental items with availability status
- Create rental contracts with customers
- Calculate rental pricing based on duration
- Send automatic reminders for returns
- Generate rental reports and analytics
- Integration with existing inventory and accounting modules"
                />
                {errors.requirements && (
                  <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="text-blue-400 mr-3">💡</div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Tips for better results:</h4>
                    <ul className="mt-1 text-sm text-blue-700 list-disc list-inside space-y-1">
                      <li>Mention specific field types and relationships</li>
                      <li>Describe user roles and permissions</li>
                      <li>Include workflow steps and automation rules</li>
                      <li>Specify integration with existing Odoo modules</li>
                      <li>Mention any custom views or reports needed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <div className="space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generateSpecMutation.isPending}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                  >
                    {generateSpecMutation.isPending ? 'Generating...' : 'Generate Specification'}
                  </button>
                </div>
              </div>

              {generateSpecMutation.error && (
                <div className="text-red-600 text-sm">
                  Error: {generateSpecMutation.error.response?.data?.detail || 'Failed to generate specification'}
                </div>
              )}
            </form>
          )}

          {/* Step 3: Success */}
          {currentStep === 3 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Project Created Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your Odoo module specification is being generated by AI. This may take a few moments.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Go to Project Dashboard
                </button>
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Create Another Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCreationModal; 