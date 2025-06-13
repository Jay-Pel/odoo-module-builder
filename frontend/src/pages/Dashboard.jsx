import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import ProjectCreationModal from '../components/ProjectCreationModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, project: null });
  const queryClient = useQueryClient();

  // Fetch user projects
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await axios.get('/projects/');
      return response.data;
    }
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId) => {
      const response = await axios.delete(`/projects/${projectId}`);
      return response.data;
    },
    onSuccess: () => {
      // Refresh projects list
      queryClient.invalidateQueries(['projects']);
      // Close modal
      setDeleteModal({ isOpen: false, project: null });
    },
    onError: (error) => {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  });

  const handleDeleteClick = (project) => {
    setDeleteModal({ isOpen: true, project });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.project) {
      deleteProjectMutation.mutate(deleteModal.project.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, project: null });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      generating_specification: 'bg-blue-100 text-blue-800',
      specification_generated: 'bg-blue-100 text-blue-800',
      specification_approved: 'bg-green-100 text-green-800',
      generating: 'bg-blue-100 text-blue-800',
      testing: 'bg-yellow-100 text-yellow-800',
      testing_passed: 'bg-green-100 text-green-800',
      uat: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      specification_failed: 'bg-red-100 text-red-800',
      code_generation_failed: 'bg-red-100 text-red-800'
    };

    const statusLabels = {
      draft: 'Draft',
      generating_specification: 'Generating Spec',
      specification_generated: 'Spec Generated',
      specification_approved: 'Spec Approved',
      generating: 'Generating',
      testing: 'Testing',
      testing_passed: 'Testing Passed',
      uat: 'UAT',
      completed: 'Completed',
      failed: 'Failed',
      specification_failed: 'Spec Failed',
      code_generation_failed: 'Code Gen Failed'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || statusColors.draft}`}>
        {statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.email}
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your Odoo module projects and track their progress.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📊</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Projects
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {projects?.length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">⚡</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      In Progress
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {projects?.filter(p => ['generating_specification', 'specification_generated', 'generating', 'testing', 'testing_passed', 'uat'].includes(p.status)).length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">✅</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {projects?.filter(p => p.status === 'completed').length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">💰</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Spent
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      $0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Your Projects</h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                New Project
              </button>
            </div>
          </div>

          {error && (
            <div className="p-6">
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">
                  Failed to load projects. Please try again.
                </div>
              </div>
            </div>
          )}

          {projects && projects.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No projects yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first Odoo module project to get started.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {projects?.map((project) => (
                <div key={project.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          <Link
                            to={`/project/${project.id}`}
                            className="hover:text-primary-600"
                          >
                            {project.name}
                          </Link>
                        </h3>
                        {getStatusBadge(project.status)}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Odoo {project.odoo_version} • Created {new Date(project.created_at).toLocaleDateString()}
                      </p>
                      {project.description && (
                        <p className="mt-2 text-sm text-gray-600">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/project/${project.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(project)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project Creation Modal */}
      <ProjectCreationModal 
        isOpen={showCreateForm} 
        onClose={() => setShowCreateForm(false)} 
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen} 
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm} 
        itemName={deleteModal.project?.name}
        isLoading={deleteProjectMutation.isPending}
      />
    </div>
  );
};

export default Dashboard; 