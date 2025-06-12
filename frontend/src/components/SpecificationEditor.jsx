import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import remarkBreaks from 'remark-breaks';
import axios from 'axios';

// Custom component for better formatting
const SpecificationDisplay = ({ content }) => {
  // Pre-process the content to ensure proper formatting
  const formatSpecification = (text) => {
    if (!text) return '';
    
    // Split by numbered sections and add proper spacing
    let formatted = text
      // Add line breaks before numbered sections
      .replace(/(\d+\.\s+[A-Z][^:]*:)/g, '\n\n## $1\n')
      // Add line breaks before bullet points
      .replace(/(\n|^)([A-Z][^.]*\.)(\s*)([A-Z])/g, '$1$2\n\n$4')
      // Ensure proper spacing around technical terms
      .replace(/(product\.template|product\.client\.info|sale\.order\.line)/g, '`$1`')
      // Add proper spacing after colons in headers
      .replace(/([A-Z][^:]*:)(\s*)([A-Z])/g, '$1\n\n$3')
      // Clean up multiple spaces and line breaks
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return formatted;
  };

  const formattedContent = formatSpecification(content);

  return (
    <div className="prose prose-slate max-w-none prose-headings:text-gray-900 prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-p:text-gray-900 prose-p:leading-relaxed prose-li:text-gray-900 prose-strong:text-gray-900 prose-code:bg-gray-200 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:text-gray-900 prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom paragraph renderer with better spacing and darker text
          p: ({ children }) => (
            <p className="mb-4 text-gray-900 leading-relaxed font-medium">{children}</p>
          ),
          // Custom heading renderer with darker text
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b-2 border-gray-400">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              {children}
            </h3>
          ),
          // Custom list renderer with darker text
          ul: ({ children }) => (
            <ul className="space-y-2 mb-4">{children}</ul>
          ),
          li: ({ children }) => (
            <li className="text-gray-900 leading-relaxed font-medium">{children}</li>
          ),
          // Custom code renderer with better contrast
          code: ({ inline, children }) => (
            inline ? (
              <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono text-gray-900 font-semibold border border-gray-300">
                {children}
              </code>
            ) : (
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto border border-gray-300">
                <code className="text-sm font-mono text-gray-900">{children}</code>
              </pre>
            )
          ),
          // Custom strong/bold renderer with darker text
          strong: ({ children }) => (
            <strong className="font-bold text-gray-900">{children}</strong>
          )
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
};

const SpecificationEditor = ({ projectId, onApprove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [retryRequirements, setRetryRequirements] = useState('');
  const queryClient = useQueryClient();

  // Fetch specification
  const { data: specification, isLoading, error } = useQuery({
    queryKey: ['specification', projectId],
    queryFn: async () => {
      const response = await axios.get(`/specifications/${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (no specification exists yet)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Fetch project status
  const { data: status } = useQuery({
    queryKey: ['specification-status', projectId],
    queryFn: async () => {
      const response = await axios.get(`/specifications/${projectId}/status`);
      return response.data;
    },
    enabled: !!projectId,
    refetchInterval: 3000 // Poll every 3 seconds during generation
  });

  // Generate specification mutation
  const generateSpecMutation = useMutation({
    mutationFn: async (requirements) => {
      const response = await axios.post(`/specifications/generate/${projectId}`, {
        requirements
      });
      return response.data;
    },
    onSuccess: () => {
      setShowRetryModal(false);
      setRetryRequirements('');
      queryClient.invalidateQueries(['specification', projectId]);
      queryClient.invalidateQueries(['specification-status', projectId]);
    }
  });

  // Update specification mutation
  const updateSpecMutation = useMutation({
    mutationFn: async (content) => {
      const response = await axios.put(`/specifications/${projectId}`, {
        content
      });
      return response.data;
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries(['specification', projectId]);
    }
  });

  // Approve specification mutation
  const approveSpecMutation = useMutation({
    mutationFn: async () => {
      const finalContent = isEditing ? editContent : (specification?.content || '');
      
      // First save any edits
      if (isEditing && editContent !== specification?.content) {
        await updateSpecMutation.mutateAsync(finalContent);
      }
      
      // Then approve the specification
      const approveResponse = await axios.post(`/specifications/${projectId}/approve`);
      
      return { approve: approveResponse.data };
    },
    onSuccess: async (data) => {
      console.log('Specification approved successfully:', data);
      
      // Close modal and update UI first
      setShowApprovalModal(false);
      setIsEditing(false);
      queryClient.invalidateQueries(['specification', projectId]);
      queryClient.invalidateQueries(['specification-status', projectId]);
      queryClient.invalidateQueries(['project', projectId]);
      
      // Call the onApprove callback to switch to Code tab
      if (onApprove) {
        onApprove();
      }
      
      // Then try to start code generation (don't block approval on this)
      try {
        console.log('Starting code generation...');
        await axios.post(`/coding/generate-module/${projectId}`);
        console.log('Code generation started successfully');
      } catch (codeGenError) {
        console.error('Code generation failed to start:', codeGenError);
        // Don't prevent approval completion if code generation fails
      }
    },
    onError: (error) => {
      console.error('Approval failed:', error);
      
      // Check if it's actually an approval error or just code generation
      if (error?.response?.status === 400 && error?.response?.data?.detail?.includes('already approved')) {
        // Specification is already approved, just close modal and proceed
        setShowApprovalModal(false);
        setIsEditing(false);
        queryClient.invalidateQueries(['specification', projectId]);
        queryClient.invalidateQueries(['specification-status', projectId]);
        queryClient.invalidateQueries(['project', projectId]);
        if (onApprove) {
          onApprove();
        }
      } else {
        // Show error to user
        alert('Failed to approve specification. Please try again.');
      }
    }
  });

  const handleRetryGeneration = () => {
    if (retryRequirements.trim()) {
      generateSpecMutation.mutate(retryRequirements);
    }
  };

  const handleEdit = () => {
    setEditContent(specification?.content || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    updateSpecMutation.mutate(editContent);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const handleApprove = () => {
    setShowApprovalModal(true);
  };

  const confirmApproval = () => {
    console.log('Starting approval process...');
    
    // Add a timeout fallback to close modal if something goes wrong
    const timeoutId = setTimeout(() => {
      console.log('Approval timeout - forcing modal close');
      setShowApprovalModal(false);
      if (onApprove) {
        onApprove();
      }
    }, 10000); // 10 second fallback
    
    // Clear timeout if mutation completes normally
    approveSpecMutation.mutate(undefined, {
      onSettled: () => {
        clearTimeout(timeoutId);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading specification...</p>
        </div>
      </div>
    );
  }

  if (error && error?.response?.status !== 404) {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">❌</div>
        <p className="text-gray-600">Failed to load specification</p>
        <p className="text-sm text-red-500 mt-2">{error?.response?.data?.detail || error.message}</p>
      </div>
    );
  }

  // Show generation status if generating
  if (status?.project_status === 'generating_specification') {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🔄</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Generating Specification
        </h3>
        <p className="text-gray-600 mb-4">
          Our AI is analyzing your requirements and creating the specification...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  // Show generate button if no specification exists
  if (!specification && status?.project_status === 'draft') {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No specification found
        </h3>
        <p className="text-gray-600 mb-6">
          Generate a specification by providing your module requirements.
        </p>
        <button
          onClick={() => setShowRetryModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Generate Specification
        </button>
      </div>
    );
  }

  // Show retry option if generation failed
  if (status?.project_status === 'specification_failed') {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Specification Generation Failed
        </h3>
        <p className="text-gray-600 mb-6">
          There was an error generating the specification. Would you like to try again?
        </p>
        <button
          onClick={() => setShowRetryModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Retry Generation
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-medium">Module Specification</h3>
        <div className="flex space-x-2">
          {!isEditing ? (
            <>
              <button
                onClick={handleEdit}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                disabled={!specification?.content}
              >
                Approve Specifications
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateSpecMutation.isPending}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {updateSpecMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 p-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-full min-h-[600px] p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm leading-6"
                placeholder="Edit your specification here..."
              />
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <div className="p-6">
              <SpecificationDisplay content={specification?.content} />
            </div>
          </div>
        )}
      </div>

      {/* Retry Generation Modal */}
      {showRetryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-medium mb-4">Generate Specification</h3>
            <p className="text-gray-600 mb-4">
              Please provide your module requirements. Be as detailed as possible.
            </p>
            <textarea
              value={retryRequirements}
              onChange={(e) => setRetryRequirements(e.target.value)}
              className="w-full h-40 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your Odoo module requirements..."
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowRetryModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRetryGeneration}
                disabled={!retryRequirements.trim() || generateSpecMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {generateSpecMutation.isPending ? 'Generating...' : 'Generate Specification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">Approve Specification</h3>
            <p className="text-gray-600 mb-4">
              Are you ready to approve this specification and automatically start code generation? 
              {isEditing && ' Any unsaved changes will be saved automatically.'}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800">
                ✨ After approval, code generation will start immediately and you'll be redirected to the Code tab to monitor progress.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmApproval}
                disabled={approveSpecMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {approveSpecMutation.isPending ? 'Approving...' : 'Approve & Start Coding'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecificationEditor; 