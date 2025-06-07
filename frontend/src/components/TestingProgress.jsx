import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

const TestingProgress = ({ projectId, isActive, onComplete, onError }) => {
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isActive) {
      pollTestingStatus();
    }
  }, [isActive, projectId]);

  const pollTestingStatus = async () => {
    try {
      const response = await fetch(`/api/testing/status/${projectId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch testing status');
      }
      
      const data = await response.json();
      
      setStatus(data.status);
      setProgress(data.progress || 0);
      setCurrentStep(data.current_step || '');
      
      if (data.started_at && !startTime) {
        setStartTime(new Date(data.started_at));
      }

      // Check if testing is complete
      if (data.status === 'completed') {
        onComplete?.(data);
        return;
      } else if (data.status === 'failed') {
        setError(data.error || 'Testing failed');
        onError?.(data.error || 'Testing failed');
        return;
      }

      // Continue polling if still in progress
      if (['initializing', 'running', 'preparing_environment', 'installing_module', 'generating_tests', 'processing_results'].includes(data.status)) {
        setTimeout(pollTestingStatus, 2000); // Poll every 2 seconds
      }
      
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'initializing':
      case 'running':
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'failed':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'initializing':
      case 'running':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const formatElapsedTime = () => {
    if (!startTime) return '0s';
    
    const now = new Date();
    const elapsed = Math.floor((now - startTime) / 1000);
    
    if (elapsed < 60) {
      return `${elapsed}s`;
    } else if (elapsed < 3600) {
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const getStepDescription = (step) => {
    const stepDescriptions = {
      'Preparing Docker environment': 'Setting up isolated testing environment...',
      'Installing module in Odoo': 'Installing your module in a fresh Odoo instance...',
      'Generating Playwright test scripts': 'AI is creating comprehensive test scenarios...',
      'Executing automated tests': 'Running automated UI and functionality tests...',
      'Processing test results': 'Analyzing test results and generating reports...',
      'Testing completed': 'All tests have been completed successfully!'
    };
    
    return stepDescriptions[step] || step;
  };

  if (!isActive && !status) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Play className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <h3 className="text-lg font-medium text-gray-700">Ready to Test</h3>
        <p className="text-gray-500">Click "Start Testing" to begin automated testing of your module.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Testing Progress</h2>
        {startTime && (
          <div className="text-sm text-gray-500">
            <Clock className="w-4 h-4 inline mr-1" />
            {formatElapsedTime()}
          </div>
        )}
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg border ${getStatusColor()} mb-4`}>
        <div className="flex items-center">
          {getStatusIcon()}
          <div className="ml-3">
            <h3 className="font-medium capitalize">
              {status?.replace('_', ' ') || 'Initializing'}
            </h3>
            <p className="text-sm opacity-90">
              {currentStep ? getStepDescription(currentStep) : 'Starting testing process...'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {status !== 'completed' && status !== 'failed' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <h4 className="font-medium text-red-800">Testing Error</h4>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Testing Steps */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Testing Steps:</h4>
        
        {[
          { key: 'preparing_environment', label: 'Environment Setup', description: 'Docker containers and Odoo installation' },
          { key: 'installing_module', label: 'Module Installation', description: 'Installing your module in Odoo' },
          { key: 'generating_tests', label: 'Test Generation', description: 'AI creating test scenarios' },
          { key: 'running_tests', label: 'Test Execution', description: 'Running Playwright automation' },
          { key: 'processing_results', label: 'Results Processing', description: 'Analyzing and formatting results' }
        ].map((step, index) => {
          const isActive = currentStep?.toLowerCase().includes(step.key.replace('_', ' '));
          const isCompleted = progress > (index + 1) * 20;
          const isPending = !isActive && !isCompleted;
          
          return (
            <div key={step.key} className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isCompleted 
                  ? 'bg-green-100 text-green-600' 
                  : isActive 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="w-2 h-2 bg-current rounded-full" />
                )}
              </div>
              
              <div className="flex-1">
                <div className={`font-medium ${
                  isCompleted 
                    ? 'text-green-700' 
                    : isActive 
                      ? 'text-blue-700' 
                      : 'text-gray-500'
                }`}>
                  {step.label}
                </div>
                <div className="text-sm text-gray-500">{step.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {status === 'completed' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <div>
              <h4 className="font-medium text-green-800">Testing Complete!</h4>
              <p className="text-green-600 text-sm">Your module has been successfully tested. Check the results below.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestingProgress; 