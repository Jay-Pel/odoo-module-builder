import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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

  // Check if code generation is in progress or completed
  const codeGenerationStatuses = ['generating_code', 'analyzing_specification', 'creating_zip', 'uploading', 'code_generated'];
  const isCurrentlyGeneratingCode = project && codeGenerationStatuses.includes(project.status);
  const isCurrentlyCodeGenerated = project && project.status === 'code_generated';

  const handleGenerateCode = async () => {
    try {
      setIsGeneratingCode(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`/coding/generate-module/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        // Progress will be tracked by the CodeGenerationProgress component
      }
    } catch (error) {
      console.error('Error starting code generation:', error);
      alert('Failed to start code generation. Please try again.');
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

  // Fetch project details
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await axios.get(`/projects/${id}`);
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project details...</p>
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
            <h2 className="text-lg font-medium text-gray-900 mb-4">Project Progress</h2>
            <div className="flex items-center justify-between">
              {[
                { key: 'draft', label: 'Draft', icon: '📝' },
                { key: 'generating', label: 'Generating', icon: '⚙️' },
                { key: 'testing', label: 'Testing', icon: '🧪' },
                { key: 'uat', label: 'UAT', icon: '👤' },
                { key: 'payment', label: 'Payment', icon: '💳' },
                { key: 'completed', label: 'Completed', icon: '✅' }
              ].map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    project.status === step.key ? 'bg-primary-600 text-white' :
                    ['draft', 'generating', 'testing', 'uat', 'payment', 'completed'].indexOf(project.status) > index ? 'bg-green-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    <span className="text-sm">{step.icon}</span>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">{step.label}</span>
                  {index < 5 && (
                    <div className={`ml-4 w-16 h-1 ${
                      ['draft', 'generating', 'testing', 'uat', 'payment', 'completed'].indexOf(project.status) > index ? 'bg-green-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview', icon: '📊' },
                { key: 'specification', label: 'Specification', icon: '📝' },
                { key: 'code', label: 'Code', icon: '⚙️' },
                { key: 'testing', label: 'Testing', icon: '🧪' },
                { key: 'uat', label: 'UAT', icon: '👤' },
                { key: 'payment', label: 'Payment', icon: '💳' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
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
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <div className="text-blue-400 mr-3">💡</div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">What's next?</h4>
                        <ul className="mt-1 text-sm text-blue-700 list-disc list-inside space-y-1">
                          {project.status === 'draft' && (
                            <li>Review and approve the generated specification</li>
                          )}
                          {project.status === 'generating_specification' && (
                            <li>AI is generating your specification - check back in a few moments</li>
                          )}
                          {project.status === 'specification_approved' && (
                            <li>Generate your module code using AI</li>
                          )}
                          {project.status === 'code_generated' && (
                            <li>Start automated testing to validate your module</li>
                          )}
                          {project.status === 'testing_passed' && (
                            <li>Begin User Acceptance Testing in a live Odoo environment</li>
                          )}
                          {project.status === 'uat_completed' && (
                            <li>Complete payment to download your module</li>
                          )}
                          {project.status === 'completed' && (
                            <li>Your module is ready! Download and install in your Odoo instance</li>
                          )}
                        </ul>
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
                  // Refresh project data when specification is approved
                  window.location.reload();
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
                    {project.status === 'specification_approved' && !isCurrentlyGeneratingCode && !isCurrentlyCodeGenerated && (
                      <button
                        onClick={handleGenerateCode}
                        disabled={isGeneratingCode}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isGeneratingCode ? 'Generating...' : 'Generate Code'}
                      </button>
                    )}
                  </div>
                  
                  {project.status === 'specification_approved' && !isCurrentlyGeneratingCode && !isCurrentlyCodeGenerated && (
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

                  {project.status !== 'specification_approved' && !isCurrentlyGeneratingCode && !isCurrentlyCodeGenerated && (
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