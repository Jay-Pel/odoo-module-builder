import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import axios from 'axios';

const SpecificationEditor = ({ projectId, onApprove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch specification
  const { data: specification, isLoading, error } = useQuery({
    queryKey: ['specification', projectId],
    queryFn: async () => {
      const response = await axios.get(`/specifications/${projectId}`);
      return response.data;
    },
    enabled: !!projectId
  });

  // Fetch specification status
  const { data: status } = useQuery({
    queryKey: ['specification-status', projectId],
    queryFn: async () => {
      const response = await axios.get(`/specifications/${projectId}/status`);
      return response.data;
    },
    enabled: !!projectId,
    refetchInterval: 2000 // Poll every 2 seconds when generating
  });

  // Update specification mutation
  const updateMutation = useMutation({
    mutationFn: async (content) => {
      const response = await axios.put(`/specifications/${projectId}/content`, {
        content
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['specification', projectId]);
      setIsEditing(false);
    }
  });

  // Approve specification mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.put(`/specifications/${projectId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['specification', projectId]);
      queryClient.invalidateQueries(['project', projectId]);
      setShowApprovalModal(false);
      if (onApprove) onApprove();
    }
  });

  // Set edit content when specification loads
  useEffect(() => {
    if (specification?.content) {
      setEditContent(specification.content);
    }
  }, [specification]);

  const handleEdit = () => {
    setEditContent(specification.content || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editContent);
  };

  const handleCancel = () => {
    setEditContent(specification.content || '');
    setIsEditing(false);
  };

  const handleApprove = () => {
    approveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading specification...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">❌</div>
        <p className="text-gray-600">Failed to load specification</p>
      </div>
    );
  }

  // Show generation status
  if (status?.project_status === 'generating_specification') {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          AI is generating your specification...
        </h3>
        <p className="text-gray-600 mb-4">
          This usually takes 30-60 seconds. The page will update automatically.
        </p>
        <div className="animate-pulse bg-gray-200 h-4 rounded w-64 mx-auto"></div>
      </div>
    );
  }

  if (!specification) {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No specification found
        </h3>
        <p className="text-gray-600">
          Generate a specification first by providing your requirements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Module Specification</h2>
          <p className="text-sm text-gray-500">
            {specification.is_approved ? (
              <span className="text-green-600 font-medium">✅ Approved</span>
            ) : (
              <span className="text-yellow-600 font-medium">⏳ Pending approval</span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isEditing && !specification.is_approved && (
            <>
              <button
                onClick={handleEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => setShowApprovalModal(true)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                ✅ Approve
              </button>
            </>
          )}
          
          {isEditing && (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Edit Specification (Markdown)
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              placeholder="Enter your specification in Markdown format..."
            />
          </div>
          
          {updateMutation.error && (
            <div className="text-red-600 text-sm">
              Error: {updateMutation.error.response?.data?.detail || 'Failed to update specification'}
            </div>
          )}
        </div>
      ) : (
        <div className="prose prose-sm max-w-none bg-white border border-gray-200 rounded-lg p-6">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            className="markdown-content"
          >
            {specification.content}
          </ReactMarkdown>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Approve Specification?
              </h3>
              <p className="mt-2 text-sm text-gray-500 mb-6">
                Once approved, this specification will be used to generate your Odoo module code. 
                You can still make changes later if needed.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {approveMutation.isPending ? 'Approving...' : 'Approve'}
                </button>
              </div>
              
              {approveMutation.error && (
                <div className="mt-4 text-red-600 text-sm">
                  Error: {approveMutation.error.response?.data?.detail || 'Failed to approve specification'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecificationEditor; 