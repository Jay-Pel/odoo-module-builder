import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';

const ProjectCreationModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectId, setProjectId] = useState(null);
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);
  const [showDashboardSuggestion, setShowDashboardSuggestion] = useState(false);
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm();

  // Query to check specification generation status
  const { data: specStatus } = useQuery({
    queryKey: ['specification-status', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await axios.get(`/specifications/${projectId}/status`);
      return response.data;
    },
    enabled: !!projectId && isGeneratingSpec,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Effect to handle specification generation completion
  useEffect(() => {
    if (specStatus && (specStatus.project_status === 'specification_generated' || specStatus.project_status === 'specification_failed')) {
      setIsGeneratingSpec(false);
      setShowDashboardSuggestion(true);
    }
  }, [specStatus]);

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
      setIsGeneratingSpec(true);
      setCurrentStep(3);
    }
  });

  const handleStep1Submit = (data) => {
    createProjectMutation.mutate(data);
  };

  const handleStep2Submit = (data) => {
    // Start specification generation immediately
    generateSpecMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    setCurrentStep(1);
    setProjectId(null);
    setIsGeneratingSpec(false);
    setShowDashboardSuggestion(false);
    onClose();
  };

  const handleGoToProject = () => {
    // Navigate to project detail page
    window.location.href = `/project/${projectId}`;
    handleClose();
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

          {/* Step 3: Success with enhanced dashboard */}
          {currentStep === 3 && (
            <div className="py-8">
              {isGeneratingSpec && !showDashboardSuggestion && (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Project Created Successfully!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your Odoo module specification is being generated by AI. This may take a few moments.
                  </p>
                  
                  {/* Real-time generation status */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                      <span className="text-blue-800 font-medium">
                        {specStatus?.project_status === 'generating_specification' ? 'Analyzing requirements...' : 'Generating specification...'}
                      </span>
                    </div>
                    <div className="text-sm text-blue-700">
                      <p>✨ AI is creating a detailed technical specification</p>
                      <p>📋 Analyzing your requirements for optimal module design</p>
                      <p>🔧 Planning database models, views, and business logic</p>
                    </div>
                  </div>

                  {/* Project suggestions while waiting */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">💡 While you wait, consider:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-md border">
                        <h5 className="font-medium text-gray-900 mb-2">📊 Project Dashboard</h5>
                        <p className="text-sm text-gray-600">Monitor progress, review specifications, and track development stages.</p>
                      </div>
                      <div className="bg-white p-4 rounded-md border">
                        <h5 className="font-medium text-gray-900 mb-2">🔧 Module Library</h5>
                        <p className="text-sm text-gray-600">Explore existing modules for inspiration and integration ideas.</p>
                      </div>
                      <div className="bg-white p-4 rounded-md border">
                        <h5 className="font-medium text-gray-900 mb-2">📚 Documentation</h5>
                        <p className="text-sm text-gray-600">Learn about Odoo development best practices and patterns.</p>
                      </div>
                      <div className="bg-white p-4 rounded-md border">
                        <h5 className="font-medium text-gray-900 mb-2">🚀 Quick Start</h5>
                        <p className="text-sm text-gray-600">Start another project while this one generates.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleGoToProject}
                      className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      View Project Dashboard
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

              {showDashboardSuggestion && (
                <div className="text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Specification Generated!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your module specification is ready for review. You can now proceed to approve and generate code.
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <div className="text-sm text-green-700">
                      <p>✅ Technical specification completed</p>
                      <p>📋 Requirements analyzed and structured</p>
                      <p>🎯 Ready for code generation</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleGoToProject}
                      className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Review & Approve Specification
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

              {!isGeneratingSpec && !showDashboardSuggestion && (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Project Created Successfully!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your Odoo module specification is being generated by AI. This may take a few moments.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={handleGoToProject}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCreationModal; 