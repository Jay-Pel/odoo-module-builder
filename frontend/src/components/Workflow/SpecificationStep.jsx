import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useModuleSession } from '../../hooks/useModuleSession';
import { MODULE_STEPS } from '../../stores/moduleSessionStore';

const SpecificationStep = () => {
  const { activeSession, update, setStep, completeStep } = useModuleSession();
  const [specification, setSpecification] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  
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
  
  const generateSpecification = async () => {
    setIsGenerating(true);
    
    try {
      // Get requirements data from previous step
      const requirementsData = activeSession?.stepData?.[MODULE_STEPS.REQUIREMENTS];
      
      // Log requirements data for debugging
      console.log('Generating specification with requirements:', requirementsData);
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Make sure we're using the actual values from requirements
      const moduleName = requirementsData?.moduleName || 'New Module';
      const description = requirementsData?.description || 'No description provided.';
      const version = requirementsData?.version || '16.0.1.0.0';
      const category = requirementsData?.category || 'Uncategorized';
      const author = requirementsData?.author || 'Anonymous';
      const website = requirementsData?.website || 'N/A';
      const license = requirementsData?.license || 'LGPL-3';
      const dependencies = requirementsData?.depends || 'base';
      
      // Generate a sample specification based on the requirements
      const generatedSpecification = `# ${moduleName} Specification

## Overview
${description}

## Module Information
- **Version:** ${version}
- **Category:** ${category}
- **Author:** ${author}
- **Website:** ${website}
- **License:** ${license}
- **Dependencies:** ${dependencies}

## Functional Specifications
1. Create module directory structure
2. Implement basic models and views
3. Add security access rules
4. Implement user interface elements
5. Add reporting capabilities

## Technical Specifications
1. Database Models
2. XML Views
3. Security Rules
4. Python Business Logic
5. JavaScript Extensions (if needed)

## Implementation Details
The module will follow Odoo best practices and coding standards. It will be compatible with the specified Odoo version and dependencies.
`;
      
      setSpecification(generatedSpecification);
      
      // Update the step data with the generated specification
      update({
        [MODULE_STEPS.SPECIFICATION]: {
          content: generatedSpecification,
          approved: false,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error generating specification:', error);
    } finally {
      setIsGenerating(false);
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Generating specification based on your requirements...</p>
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
            <pre className="whitespace-pre-wrap font-mono text-sm">{specification}</pre>
          </div>
          
          <div className="flex justify-between">
            <div className="space-x-3">
              <button
                onClick={handleEditClick}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Edit Specification
              </button>
              <button
                onClick={handleRegenerateClick}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Regenerate
              </button>
            </div>
            
            <motion.button
              onClick={handleApprove}
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Approve & Continue
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
};

export default SpecificationStep;
