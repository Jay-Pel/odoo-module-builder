import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useModuleSession } from '../../hooks/useModuleSession';
import { MODULE_STEPS } from '../../stores/moduleSessionStore';
import { AlertCircle, RefreshCw } from 'lucide-react';

const SpecificationStep = () => {
  const { activeSession, update, setStep, completeStep } = useModuleSession();
  const [specification, setSpecification] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [error, setError] = useState(null);
  const [progressStage, setProgressStage] = useState('initializing'); // initializing, processing, formatting, finalizing
  const [progressPercent, setProgressPercent] = useState(0);
  const [generationStartTime, setGenerationStartTime] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);
  
  useEffect(() => {
    // Load existing specification data if available
    if (activeSession?.stepData?.[MODULE_STEPS.SPECIFICATION]) {
      const { content, approved } = activeSession.stepData[MODULE_STEPS.SPECIFICATION];
      setSpecification(content || '');
      setIsApproved(approved || false);
    } else if (activeSession?.stepData?.[MODULE_STEPS.REQUIREMENTS]) {
      // Generate specification based on requirements if not already present
      generateSpecification();
    }
  }, [activeSession]);
  
  // Debugging function to check available data
  const logActiveSessionData = () => {
    console.log('Active Session Data:', activeSession);
    console.log('Requirements Data:', activeSession?.stepData?.[MODULE_STEPS.REQUIREMENTS]);
    console.log('Specification Data:', activeSession?.stepData?.[MODULE_STEPS.SPECIFICATION]);
  };
  
  // Set up the progress simulation
  useEffect(() => {
    if (isGenerating && !error) {
      simulateProgress();
    } else {
      // Clear any existing timeouts
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isGenerating, error]);
  
  // Function to simulate progress
  const simulateProgress = () => {
    // Reset progress when starting
    if (progressPercent === 0) {
      setGenerationStartTime(Date.now());
      setProgressStage('initializing');
      setProgressPercent(5);
      
      const id = setTimeout(() => {
        setProgressStage('processing');
        setProgressPercent(15);
      }, 2000);
      setTimeoutId(id);
      return;
    }
    
    // Calculate elapsed time
    const elapsed = Date.now() - generationStartTime;
    
    // Different stages based on elapsed time
    if (elapsed > 60000 && progressPercent < 90) { // Over 1 minute
      setProgressStage('finalizing');
      setProgressPercent(prev => Math.min(prev + 1, 90));
    } else if (elapsed > 30000 && progressPercent < 70) { // Over 30 seconds
      setProgressStage('formatting');
      setProgressPercent(prev => Math.min(prev + 1, 70));
    } else if (progressPercent < 50) { // Under 30 seconds
      setProgressPercent(prev => Math.min(prev + 1, 50));
    }
    
    const id = setTimeout(simulateProgress, 1000);
    setTimeoutId(id);
  };

  const generateSpecification = async () => {
    setIsGenerating(true);
    setError(null);
    setProgressPercent(0);
    setProgressStage('initializing');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
    
    try {
      // Get requirements data from previous step
      const requirementsData = activeSession?.stepData?.[MODULE_STEPS.REQUIREMENTS];
      
      // Log requirements data for debugging
      console.log('Generating specification with requirements:', requirementsData);
      
      // Prepare the context for the API call
      const context = {
        module_name: requirementsData?.moduleName || 'New Module',
        requirements: requirementsData?.description || 'No description provided.',
        module_version: requirementsData?.version || '16.0.1.0.0',
        category: requirementsData?.category || 'Uncategorized',
        author: requirementsData?.author || 'Anonymous',
        website: requirementsData?.website || 'N/A',
        license: requirementsData?.license || 'LGPL-3',
        dependencies: requirementsData?.depends || 'base',
        odooVersion: requirementsData?.odooVersion || '16.0',
        odooEdition: requirementsData?.odooEdition || 'community'
      };
      
      console.log('Sending API request with context:', context);
      
      // Make real API call to the backend with signal for timeout handling
      const response = await fetch('/api/specification/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error details:', errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Set the specification from the API response
      const generatedSpecification = data.specification || '';
      
      // Check if specification is HTML and display it correctly
      if (typeof generatedSpecification === 'string') {
        setSpecification(generatedSpecification);
      } else {
        // If it's an object or other format, stringify it for display
        setSpecification(JSON.stringify(generatedSpecification, null, 2));
      }
      
      // Update the step data with the generated specification
      update({
        [MODULE_STEPS.SPECIFICATION]: {
          content: generatedSpecification,
          specification_id: data.specification_id,
          approved: false,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error generating specification:', error);
      
      // Handle abort errors specifically
      if (error.name === 'AbortError') {
        setError('The request was taking too long and was terminated. Please try again.');
      } else if (error.message.includes('API key')) {
        setError('API key error: The Anthropic API key may be invalid or missing. Please check your configuration.');
      } else if (error.message.includes('rate limit')) {
        setError('Rate limit exceeded: The Anthropic API rate limit has been reached. Please try again later.');
      } else {
        setError(`Error: ${error.message}`);
      }
      
      // Set error message in the specification area for visibility if we had a previous specification
      if (!specification) {
        setSpecification(`Error generating specification: ${error.message}\n\nPlease try again or check with support.`);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsGenerating(false);
      setProgressPercent(100); // Ensure progress bar completes
    }
  };
  
  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const handleSaveEdit = () => {
    update({
      [MODULE_STEPS.SPECIFICATION]: {
        ...activeSession?.stepData?.[MODULE_STEPS.SPECIFICATION],
        content: specification,
        editedAt: new Date().toISOString(),
      },
    });
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    // Revert to the last saved specification
    setSpecification(activeSession?.stepData?.[MODULE_STEPS.SPECIFICATION]?.content || '');
    setIsEditing(false);
  };
  
  const handleApprove = () => {
    setIsApproved(true);
    
    // Update the step data with the approved status
    update({
      [MODULE_STEPS.SPECIFICATION]: {
        ...activeSession?.stepData?.[MODULE_STEPS.SPECIFICATION],
        approved: true,
        approvedAt: new Date().toISOString(),
      },
    });
    
    // Complete this step and move to the next
    completeStep(MODULE_STEPS.SPECIFICATION, {
      content: specification,
      approved: true,
      approvedAt: new Date().toISOString(),
    });
    
    // Navigate to the next step
    setStep(MODULE_STEPS.DEVELOPMENT_PLAN);
  };
  
  const handleRegenerateClick = async () => {
    if (window.confirm('Are you sure you want to regenerate the specification? Any edits will be lost.')) {
      await generateSpecification();
    }
  };
  
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        {/* Enhanced progress indicator */}
        <div className="w-full max-w-md mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-2">
            <div 
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">{progressStage.charAt(0).toUpperCase() + progressStage.slice(1)}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{progressPercent}%</span>
          </div>
        </div>
        
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300 mb-2">Generating specification based on your requirements...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
          {progressStage === 'initializing' && "Preparing to analyze your requirements..."}
          {progressStage === 'processing' && "Analyzing requirements and structuring the module specification..."}
          {progressStage === 'formatting' && "Creating detailed functional and technical specifications..."}
          {progressStage === 'finalizing' && "Finalizing specification document. This may take a few more moments..."}
        </p>
        
        {/* Show error if any */}
        {error && (
          <div className="mt-6 p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-md text-red-800 dark:text-red-300 flex items-start gap-3 max-w-md">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
              <button 
                onClick={() => {
                  setError(null);
                  generateSpecification();
                }}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Module Specification</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Review the generated specification for your module. You can edit it if needed.
      </p>
      
      {isEditing ? (
        <>
          <textarea
            value={specification}
            onChange={(e) => setSpecification(e.target.value)}
            className="w-full h-96 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          
          <div className="flex justify-end mt-4 space-x-3">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-5 mb-6">
            {specification && specification.startsWith('<') ? (
              <div 
                className="specification-html" 
                dangerouslySetInnerHTML={{ __html: specification }}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-sm">{specification}</pre>
            )}
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleRegenerateClick}
              className="px-4 py-2 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-900/30 flex items-center gap-2 disabled:opacity-50"
              disabled={isGenerating}
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
            
            <button
              onClick={handleEditClick}
              className="px-4 py-2 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-900/30 disabled:opacity-50"
              disabled={isGenerating}
            >
              Edit
            </button>

            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:hover:bg-green-500"
              disabled={isGenerating || isApproved}
            >
              {isApproved ? 'Approved' : 'Approve & Continue'}
            </button>
          </div>
          
          {/* Error message outside the generation state */}
          {error && !isGenerating && (
            <div className="mt-6 p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-md text-red-800 dark:text-red-300 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error generating specification</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SpecificationStep;
