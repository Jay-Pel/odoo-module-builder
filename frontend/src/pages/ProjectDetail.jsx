import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SpecificationEditor from '../components/SpecificationEditor';
import FileTreeViewer from '../components/FileTreeViewer';
import CodeGenerationProgress from '../components/CodeGenerationProgress';
import TestingProgress from '../components/TestingProgress';
import TestResultsViewer from '../components/TestResultsViewer';
import UATInterface from '../components/UATInterface';
import PaymentInterface from '../components/PaymentInterface';
import axios from 'axios';

const ProjectDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isCodeGenerated, setIsCodeGenerated] = useState(false);
  const [isTestingActive, setIsTestingActive] = useState(false);
  const [testingCompleted, setTestingCompleted] = useState(false);
  const [currentTestSessionId, setCurrentTestSessionId] = useState(null);
  const [isUATActive, setIsUATActive] = useState(false);
  const [uatCompleted, setUatCompleted] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [currentUATSessionId, setCurrentUATSessionId] = useState(null);
  const [uatSessionData, setUatSessionData] = useState(null);
  const [pricingData, setPricingData] = useState(null);

  // Fetch project details with auto-refresh during active processes
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await axios.get(`/projects/${id}`);
      return response.data;
    },
    refetchInterval: (data) => {
      // Auto-refresh every 3 seconds if generation is in progress
      const activeStatuses = ['analyzing_specification', 'generating_code', 'creating_zip', 'uploading', 'testing_in_progress', 'uat_in_progress'];
      return data && activeStatuses.includes(data.status) ? 3000 : false;
    },
    refetchIntervalInBackground: true
  });
  
  // Auto-switch to appropriate tab when status changes
  useEffect(() => {
    if (project) {
      if (['analyzing_specification', 'generating_code', 'creating_zip', 'uploading'].includes(project.status) && activeTab !== 'code') {
        setActiveTab('code');
      } else if (['testing_in_progress', 'testing_passed', 'testing_failed'].includes(project.status) && activeTab === 'overview') {
        setActiveTab('testing');
      } else if (['uat_in_progress', 'uat_completed'].includes(project.status) && activeTab === 'overview') {
        setActiveTab('uat');
      }
    }
  }, [project?.status]);

  // Check if code generation is in progress or completed
  const codeGenerationStatuses = ['analyzing_specification', 'generating_code', 'creating_zip', 'uploading'];
  const isCurrentlyGeneratingCode = project && codeGenerationStatuses.includes(project.status);
  const isCurrentlyCodeGenerated = project && project.status === 'code_generated';
  
  // Prevent multiple generations - check both local state and server status
  const canStartGeneration = project && 
    project.status === 'specification_approved' && 
    !isGeneratingCode && 
    !isCurrentlyGeneratingCode && 
    !isCurrentlyCodeGenerated;

  const handleGenerateCode = async () => {
    // Double-check before starting generation
    if (!canStartGeneration) {
      alert('Code generation is not available at this time.');
      return;
    }
    
    try {
      setIsGeneratingCode(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`/coding/generate-module/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        // Progress will be tracked by the CodeGenerationProgress component
        // Switch to show the progress immediately
        setActiveTab('code');
      }
    } catch (error) {
      console.error('Error starting code generation:', error);
      if (error.response?.status === 400) {
        alert(error.response.data.detail || 'Code generation is already in progress or not available.');
      } else {
        alert('Failed to start code generation. Please try again.');
      }
      setIsGeneratingCode(false);
    }
  };

  const handleCodeGenerationComplete = (data) => {
    setIsGeneratingCode(false);
    setIsCodeGenerated(true);
    // Optionally refresh project data
    window.location.reload();
  };

  const handleCodeGenerationError = (error) => {
    setIsGeneratingCode(false);
    console.error('Code generation error:', error);
  };

  // Testing handlers
  const handleStartTesting = async () => {
    try {
      setIsTestingActive(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`/testing/start/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        // Testing progress will be tracked by TestingProgress component
      }
    } catch (error) {
      console.error('Error starting testing:', error);
      alert('Failed to start testing. Please try again.');
      setIsTestingActive(false);
    }
  };

  const handleTestingComplete = (data) => {
    setIsTestingActive(false);
    setTestingCompleted(true);
    setCurrentTestSessionId(data.session_id);
    // Optionally refresh project data
    // window.location.reload();
  };

  const handleTestingError = (error) => {
    setIsTestingActive(false);
    console.error('Testing error:', error);
  };

  const handleRetryTesting = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/testing/retry/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        setIsTestingActive(true);
        setTestingCompleted(false);
        setCurrentTestSessionId(null);
      }
    } catch (error) {
      console.error('Error retrying testing:', error);
      alert('Failed to retry testing. Please try again.');
    }
  };

  // UAT handlers
  const handleStartUAT = async () => {
    try {
      setIsUATActive(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`/uat/start/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        setCurrentUATSessionId(response.data.session_id);
        setUatSessionData(response.data);
      }
    } catch (error) {
      console.error('Error starting UAT:', error);
      alert('Failed to start UAT session. Please try again.');
      setIsUATActive(false);
    }
  };

  const handleUATComplete = (data) => {
    setIsUATActive(false);
    setUatCompleted(true);
    // Fetch pricing data after UAT completion
    fetchPricingData();
  };

  const handleUATError = (error) => {
    setIsUATActive(false);
    console.error('UAT error:', error);
  };

  // Payment handlers
  const fetchPricingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/uat/pricing/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        setPricingData(response.data);
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    }
  };

  const handlePaymentComplete = (data) => {
    setPaymentCompleted(true);
    // Optionally refresh project data
    window.location.reload();
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse w-4 h-4 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading project details...</p>
          <p className="mt-1 text-sm text-gray-400">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="mt-2 text-gray-600">
                Odoo {project.odoo_version} • Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'completed' ? 'bg-green-100 text-green-800' :
                project.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
            </div>
          </div>
          {project.description && (
            <p className="mt-4 text-gray-700">{project.description}</p>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Project Progress</h2>
            <div className="relative">
              {[
                { 
                  key: 'draft', 
                  label: 'Specification', 
                  description: 'Define requirements and approve specification',
                  icon: '📝',
                  statuses: ['draft', 'specification_approved']
                },
                { 
                  key: 'generating', 
                  label: 'Code Generation', 
                  description: 'AI generates complete Odoo module',
                  icon: '⚙️',
                  statuses: ['analyzing_specification', 'generating_code', 'creating_zip', 'uploading', 'code_generated']
                },
                { 
                  key: 'testing', 
                  label: 'Testing', 
                  description: 'Automated testing in Docker environment',
                  icon: '🧪',
                  statuses: ['testing_in_progress', 'testing_passed', 'testing_failed']
                },
                { 
                  key: 'uat', 
                  label: 'User Testing', 
                  description: 'Live testing in Odoo environment',
                  icon: '👤',
                  statuses: ['uat_in_progress', 'uat_completed']
                },
                { 
                  key: 'payment', 
                  label: 'Payment', 
                  description: 'Secure payment and module download',
                  icon: '💳',
                  statuses: ['payment_pending', 'payment_completed']
                },
                { 
                  key: 'completed', 
                  label: 'Complete', 
                  description: 'Module ready for production use',
                  icon: '✅',
                  statuses: ['completed']
                }
              ].map((step, index) => {
                // Determine the single status for this step
                const getStepStatus = () => {
                  const currentStatus = project.status;
                  
                  // Check if this step is currently active (in progress)
                  const isCurrentlyActive = step.statuses.includes(currentStatus) || 
                                          (step.key === 'draft' && ['draft', 'generating_specification'].includes(currentStatus));
                  
                  // Check if this step is completed
                  const isStepCompleted = (() => {
                    if (step.key === 'draft') return ['specification_approved', 'analyzing_specification', 'generating_code', 'creating_zip', 'uploading', 'code_generated', 'testing_in_progress', 'testing_passed', 'uat_in_progress', 'uat_completed', 'payment_pending', 'payment_completed', 'completed'].includes(currentStatus);
                    if (step.key === 'generating') return ['code_generated', 'testing_in_progress', 'testing_passed', 'uat_in_progress', 'uat_completed', 'payment_pending', 'payment_completed', 'completed'].includes(currentStatus);
                    if (step.key === 'testing') return ['testing_passed', 'uat_in_progress', 'uat_completed', 'payment_pending', 'payment_completed', 'completed'].includes(currentStatus);
                    if (step.key === 'uat') return ['uat_completed', 'payment_pending', 'payment_completed', 'completed'].includes(currentStatus);
                    if (step.key === 'payment') return ['payment_completed', 'completed'].includes(currentStatus);
                    return false;
                  })();
                  
                  // Special handling for specification step
                  if (step.key === 'draft') {
                    if (currentStatus === 'draft') {
                      return 'in_progress'; // Working on specification
                    } else if (currentStatus === 'generating_specification') {
                      return 'waiting_approval'; // Ready for user review/approval
                    } else if (currentStatus === 'specification_approved' || isStepCompleted) {
                      return 'done';
                    }
                    return 'ready';
                  }
                  
                  // For other steps: prioritize active over completed to avoid showing both
                  if (isCurrentlyActive) {
                    return 'in_progress';
                  } else if (isStepCompleted) {
                    return 'done';
                  }
                  
                  return 'ready'; // Not started yet
                };
                
                const stepStatus = getStepStatus();
                const isActive = stepStatus === 'in_progress';
                const isCompleted = stepStatus === 'done';
                const isWaitingApproval = stepStatus === 'waiting_approval';

                return (
                  <div key={step.key} className="relative flex items-start pb-8 last:pb-0">
                    {/* Vertical line */}
                    {index < 5 && (
                      <div className={`absolute left-5 top-12 w-0.5 h-full ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}></div>
                    )}
                    
                    {/* Step circle */}
                    <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive 
                        ? 'bg-blue-500 border-blue-500 text-white animate-pulse' 
                        : isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : isWaitingApproval
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {stepStatus === 'done' ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : stepStatus === 'waiting_approval' ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-sm">{step.icon}</span>
                      )}
                    </div>
                    
                    {/* Step content */}
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <h3 className={`text-sm font-medium ${
                          isActive ? 'text-blue-600' : 
                          isCompleted ? 'text-green-600' : 
                          isWaitingApproval ? 'text-orange-600' : 
                          'text-gray-500'
                        }`}>
                          {step.label}
                        </h3>
                        {/* Show animation at the right end of text for active steps */}
                        {stepStatus === 'in_progress' && (
                          <div className="ml-2 flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              In Progress
                            </span>
                          </div>
                        )}
                        {stepStatus === 'waiting_approval' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Waiting For Approval
                          </span>
                        )}
                        {stepStatus === 'done' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Done
                          </span>
                        )}
                        {stepStatus === 'ready' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Ready
                          </span>
                        )}
                      </div>
                      <p className={`mt-1 text-xs ${
                        isActive ? 'text-blue-500' : 
                        isCompleted ? 'text-green-500' : 
                        isWaitingApproval ? 'text-orange-500' : 
                        'text-gray-400'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview', icon: '📊', available: true },
                { key: 'specification', label: 'Specification', icon: '📝', available: true },
                { key: 'code', label: 'Code', icon: '⚙️', available: ['specification_approved', 'analyzing_specification', 'generating_code', 'creating_zip', 'uploading', 'code_generated'].includes(project?.status) || isCurrentlyGeneratingCode },
                { key: 'testing', label: 'Testing', icon: '🧪', available: ['code_generated', 'testing_in_progress', 'testing_passed', 'testing_failed'].includes(project?.status) },
                { key: 'uat', label: 'UAT', icon: '👤', available: ['testing_passed', 'uat_in_progress', 'uat_completed'].includes(project?.status) },
                { key: 'payment', label: 'Payment', icon: '💳', available: ['uat_completed', 'payment_pending', 'payment_completed', 'completed'].includes(project?.status) }
              ].map((tab) => {
                const isDisabled = !tab.available;
                return (
                  <button
                    key={tab.key}
                    onClick={() => tab.available && setActiveTab(tab.key)}
                    disabled={isDisabled}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : isDisabled
                        ? 'border-transparent text-gray-300 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className={isDisabled ? 'opacity-50' : ''}>{tab.icon}</span> {tab.label}
                    {!tab.available && activeTab !== tab.key && (
                      <svg className="inline w-3 h-3 ml-1 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Project Information</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Module Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{project.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Odoo Version</dt>
                      <dd className="mt-1 text-sm text-gray-900">Odoo {project.odoo_version}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === 'completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(project.created_at).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                {project.description && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                    <p className="text-gray-700">{project.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Next Steps</h3>
                  <div className={`border rounded-lg p-4 ${
                    ['analyzing_specification', 'generating_code', 'creating_zip', 'uploading'].includes(project.status)
                      ? 'bg-blue-50 border-blue-200'
                      : project.status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex">
                      <div className={`mr-3 ${
                        ['analyzing_specification', 'generating_code', 'creating_zip', 'uploading'].includes(project.status)
                          ? 'text-blue-400'
                          : project.status === 'completed'
                          ? 'text-green-400'
                          : 'text-blue-400'
                      }`}>
                        {['analyzing_specification', 'generating_code', 'creating_zip', 'uploading'].includes(project.status) 
                          ? '⚡' 
                          : project.status === 'completed' 
                          ? '🎉' 
                          : '💡'
                        }
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${
                          ['analyzing_specification', 'generating_code', 'creating_zip', 'uploading'].includes(project.status)
                            ? 'text-blue-800'
                            : project.status === 'completed'
                            ? 'text-green-800'
                            : 'text-blue-800'
                        }`}>
                          {['analyzing_specification', 'generating_code', 'creating_zip', 'uploading'].includes(project.status)
                            ? 'AI is working on your module...'
                            : project.status === 'completed'
                            ? 'Congratulations! Your module is complete'
                            : 'What\'s next?'
                          }
                        </h4>
                        <div className={`mt-2 text-sm ${
                          ['analyzing_specification', 'generating_code', 'creating_zip', 'uploading'].includes(project.status)
                            ? 'text-blue-700'
                            : project.status === 'completed'
                            ? 'text-green-700'
                            : 'text-blue-700'
                        }`}>
                          {project.status === 'draft' && (
                            <div>
                              <p className="mb-2">Your specification needs to be reviewed and approved before code generation can begin.</p>
                              <button 
                                onClick={() => setActiveTab('specification')}
                                className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                              >
                                Review Specification →
                              </button>
                            </div>
                          )}
                          {project.status === 'generating_specification' && (
                            <p>AI is analyzing your requirements and generating a detailed specification. This usually takes 1-2 minutes.</p>
                          )}
                          {project.status === 'specification_approved' && (
                            <div>
                              <p className="mb-2">Your specification has been approved! Ready to generate your complete Odoo module.</p>
                              <button 
                                onClick={() => setActiveTab('code')}
                                className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                              >
                                Start Code Generation →
                              </button>
                            </div>
                          )}
                          {['analyzing_specification', 'generating_code', 'creating_zip', 'uploading'].includes(project.status) && (
                            <div>
                              <p className="mb-2">Please wait while AI generates your module. This process typically takes 3-5 minutes.</p>
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                <span className="text-xs">Generation in progress...</span>
                              </div>
                            </div>
                          )}
                          {project.status === 'code_generated' && (
                            <div>
                              <p className="mb-2">Your module code has been generated! Start automated testing to validate functionality.</p>
                              <button 
                                onClick={() => setActiveTab('testing')}
                                className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                              >
                                Start Testing →
                              </button>
                            </div>
                          )}
                          {project.status === 'testing_passed' && (
                            <div>
                              <p className="mb-2">Automated tests passed! Begin User Acceptance Testing in a live Odoo environment.</p>
                              <button 
                                onClick={() => setActiveTab('uat')}
                                className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                              >
                                Start UAT Session →
                              </button>
                            </div>
                          )}
                          {project.status === 'uat_completed' && (
                            <div>
                              <p className="mb-2">User testing completed successfully! Complete payment to download your module.</p>
                              <button 
                                onClick={() => setActiveTab('payment')}
                                className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                              >
                                Complete Payment →
                              </button>
                            </div>
                          )}
                          {project.status === 'completed' && (
                            <p>Your custom Odoo module is ready for production use! You can download it anytime from the payment section.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Specification Tab */}
            {activeTab === 'specification' && (
              <SpecificationEditor 
                projectId={project.id} 
                onApprove={() => {
                  // Switch to Code tab and refresh project data when specification is approved
                  setActiveTab('code');
                  queryClient.invalidateQueries(['project', id]);
                }}
              />
            )}

            {/* Code Tab */}
            {activeTab === 'code' && (
              <div className="space-y-6">
                {/* Code Generation Controls */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Module Code Generation</h3>
                    {canStartGeneration && (
                      <button
                        onClick={handleGenerateCode}
                        disabled={isGeneratingCode}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isGeneratingCode ? 'Starting Generation...' : 'Generate Code'}
                      </button>
                    )}
                    {isCurrentlyGeneratingCode && (
                      <div className="flex items-center text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Generation in Progress
                      </div>
                    )}
                    {isCurrentlyCodeGenerated && (
                      <div className="flex items-center text-green-600">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Code Generated
                      </div>
                    )}
                  </div>
                  
                  {canStartGeneration && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="text-blue-400 mr-3 mt-1">🚀</div>
                        <div>
                          <h4 className="text-blue-800 font-medium">Ready for Code Generation</h4>
                          <p className="text-blue-700 text-sm mt-1">
                            Your specification is approved! Click "Generate Code" to create your complete Odoo module with AI.
                          </p>
                          <div className="mt-3 text-xs text-blue-600">
                            <p>• Python models and business logic</p>
                            <p>• XML views and menus</p>
                            <p>• Security rules and permissions</p>
                            <p>• Complete module structure</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!canStartGeneration && !isCurrentlyGeneratingCode && !isCurrentlyCodeGenerated && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="text-gray-400 mr-3 mt-1">⏳</div>
                        <div>
                          <h4 className="text-gray-700 font-medium">Waiting for Approved Specification</h4>
                          <p className="text-gray-600 text-sm mt-1">
                            Complete and approve your specification first to enable code generation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Tracking */}
                {(isCurrentlyGeneratingCode || isGeneratingCode) && (
                  <CodeGenerationProgress
                    projectId={id}
                    onComplete={handleCodeGenerationComplete}
                    onError={handleCodeGenerationError}
                  />
                )}

                {/* File Tree */}
                {isCurrentlyCodeGenerated && (
                  <FileTreeViewer projectId={id} />
                )}

                {/* Module Versions */}
                {isCurrentlyCodeGenerated && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Module Versions</h3>
                    <div className="text-gray-600">
                      <p>Version management and history will be available in the next update.</p>
                      <p className="text-sm mt-2">Currently showing: Version 1.0</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Testing Tab */}
            {activeTab === 'testing' && (
              <div className="space-y-6">
                {/* Testing Controls */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Automated Testing</h3>
                    {project.status === 'code_generated' && !isTestingActive && !testingCompleted && (
                      <button
                        onClick={handleStartTesting}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                      >
                        Start Testing
                      </button>
                    )}
                  </div>
                  
                  {project.status === 'code_generated' && !isTestingActive && !testingCompleted && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="text-green-400 mr-3 mt-1">🧪</div>
                        <div>
                          <h4 className="text-green-800 font-medium">Ready for Testing</h4>
                          <p className="text-green-700 text-sm mt-1">
                            Your module code is ready! Click "Start Testing" to run comprehensive automated tests.
                          </p>
                          <div className="mt-3 text-xs text-green-600">
                            <p>• Docker environment setup</p>
                            <p>• Module installation testing</p>
                            <p>• AI-generated Playwright test scripts</p>
                            <p>• UI and functionality validation</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {project.status !== 'code_generated' && !isTestingActive && !testingCompleted && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="text-gray-400 mr-3 mt-1">⏳</div>
                        <div>
                          <h4 className="text-gray-700 font-medium">Waiting for Generated Code</h4>
                          <p className="text-gray-600 text-sm mt-1">
                            Complete code generation first to enable automated testing.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Testing Progress */}
                {isTestingActive && (
                  <TestingProgress
                    projectId={id}
                    isActive={isTestingActive}
                    onComplete={handleTestingComplete}
                    onError={handleTestingError}
                  />
                )}

                {/* Test Results */}
                {testingCompleted && (
                  <TestResultsViewer
                    projectId={id}
                    sessionId={currentTestSessionId}
                    onRetryTest={handleRetryTesting}
                  />
                )}

                {/* Testing History */}
                {(testingCompleted || project.status === 'testing_passed' || project.status === 'testing_failed') && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Testing History</h3>
                    <div className="text-gray-600">
                      <p>View all previous test sessions and results for this project.</p>
                      <div className="mt-4">
                        <button
                          onClick={() => window.location.href = `/projects/${id}/testing/history`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View Testing History →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* UAT Tab */}
            {activeTab === 'uat' && (
              <div className="space-y-6">
                {/* UAT Controls */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">User Acceptance Testing</h3>
                    {(project.status === 'testing_passed' || testingCompleted) && !isUATActive && !uatCompleted && (
                      <button
                        onClick={handleStartUAT}
                        className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                      >
                        Start UAT Session
                      </button>
                    )}
                  </div>
                  
                  {(project.status === 'testing_passed' || testingCompleted) && !isUATActive && !uatCompleted && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="text-purple-400 mr-3 mt-1">👤</div>
                        <div>
                          <h4 className="text-purple-800 font-medium">Ready for User Acceptance Testing</h4>
                          <p className="text-purple-700 text-sm mt-1">
                            Your module has passed automated testing! Start a UAT session to test it in a live Odoo environment.
                          </p>
                          <div className="mt-3 text-xs text-purple-600">
                            <p>• Live Odoo environment with your module installed</p>
                            <p>• 1-hour testing session (extendable)</p>
                            <p>• Request adjustments and improvements</p>
                            <p>• Complete testing before payment</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {project.status !== 'testing_passed' && !testingCompleted && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="text-gray-400 mr-3 mt-1">⏳</div>
                        <div>
                          <h4 className="text-gray-700 font-medium">Waiting for Testing Completion</h4>
                          <p className="text-gray-600 text-sm mt-1">
                            Complete automated testing first to enable User Acceptance Testing.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* UAT Interface */}
                {(isUATActive || uatCompleted) && (
                  <UATInterface
                    projectId={id}
                    sessionId={currentUATSessionId}
                    sessionData={uatSessionData}
                    isActive={isUATActive}
                    onComplete={handleUATComplete}
                    onError={handleUATError}
                  />
                )}

                {/* UAT History */}
                {uatCompleted && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">UAT Session History</h3>
                    <div className="text-gray-600">
                      <p>View all previous UAT sessions and adjustment requests for this project.</p>
                      <div className="mt-4">
                        <button
                          onClick={() => window.location.href = `/projects/${id}/uat/history`}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          View UAT History →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Tab */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                {/* Payment Controls */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Module Payment & Download</h3>
                  </div>
                  
                  {uatCompleted && !paymentCompleted && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="text-green-400 mr-3 mt-1">💳</div>
                        <div>
                          <h4 className="text-green-800 font-medium">Ready for Payment</h4>
                          <p className="text-green-700 text-sm mt-1">
                            Your module has been tested and is ready for purchase. Complete payment to download your module.
                          </p>
                          <div className="mt-3 text-xs text-green-600">
                            <p>• Secure payment processing with Stripe</p>
                            <p>• Instant module download after payment</p>
                            <p>• Complete installation instructions included</p>
                            <p>• 30-day support included</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!uatCompleted && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="text-gray-400 mr-3 mt-1">⏳</div>
                        <div>
                          <h4 className="text-gray-700 font-medium">Waiting for UAT Completion</h4>
                          <p className="text-gray-600 text-sm mt-1">
                            Complete User Acceptance Testing first to proceed with payment.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentCompleted && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="text-blue-400 mr-3 mt-1">✅</div>
                        <div>
                          <h4 className="text-blue-800 font-medium">Payment Completed</h4>
                          <p className="text-blue-700 text-sm mt-1">
                            Thank you for your purchase! Your module has been downloaded and is ready for installation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Interface */}
                {uatCompleted && !paymentCompleted && (
                  <PaymentInterface
                    projectId={id}
                    pricingData={pricingData}
                    onComplete={handlePaymentComplete}
                    onError={handlePaymentError}
                  />
                )}

                {/* Download History */}
                {paymentCompleted && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Download History</h3>
                    <div className="text-gray-600">
                      <p>Access your purchased modules and download history.</p>
                      <div className="mt-4">
                        <button
                          onClick={() => window.location.href = `/projects/${id}/downloads`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View Downloads →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail; 