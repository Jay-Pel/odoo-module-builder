import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useModuleSession } from '../../hooks/useModuleSession';
import { MODULE_STEPS } from '../../stores/moduleSessionStore';

const DevelopmentPlanStep = () => {
  const { activeSession, update, setStep, completeStep } = useModuleSession();
  const [developmentPlan, setDevelopmentPlan] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState({});
  
  useEffect(() => {
    // Load existing development plan if available
    if (activeSession?.stepData?.[MODULE_STEPS.DEVELOPMENT_PLAN]) {
      const { content, approved } = activeSession.stepData[MODULE_STEPS.DEVELOPMENT_PLAN];
      setDevelopmentPlan(content || '');
    } else if (activeSession?.stepData?.[MODULE_STEPS.SPECIFICATION]) {
      // Generate development plan based on specification if not already present
      generateDevelopmentPlan();
    }
  }, [activeSession]);
  
  const generateDevelopmentPlan = async () => {
    setIsGenerating(true);
    
    try {
      // This would typically be an API call to generate a development plan
      // based on the specification from the previous step
      const specificationData = activeSession?.stepData?.[MODULE_STEPS.SPECIFICATION];
      const requirementsData = activeSession?.stepData?.[MODULE_STEPS.REQUIREMENTS];
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Generate a sample development plan based on the specification
      const generatedPlan = `# Development Plan for ${requirementsData?.moduleName || 'New Module'}

## Phase 1: Setup & Configuration
1. Create module directory structure
   - Initialize __init__.py files
   - Create __manifest__.py with proper metadata
   - Set up basic directory structure

2. Define data models
   - Create Python model classes
   - Define fields and relationships
   - Implement model constraints and methods

## Phase 2: Business Logic
1. Implement core business logic
   - Create service methods for main functionality
   - Implement validation rules
   - Add computed fields logic

2. Develop workflow logic
   - Define state transitions
   - Implement triggers and handlers
   - Add automated actions

## Phase 3: User Interface
1. Create views
   - Design form views for data entry
   - Implement list views for data display
   - Add search filters and grouping options

2. Enhance UI with widgets
   - Add custom widgets if needed
   - Implement dynamic UI elements
   - Create dashboards if required

## Phase 4: Security & Testing
1. Implement security rules
   - Define access control groups
   - Set up record rules
   - Add field-level access controls

2. Create tests
   - Add unit tests for models
   - Implement integration tests
   - Create test data fixtures

## Phase 5: Deployment & Documentation
1. Prepare for deployment
   - Create demo data
   - Add installation hooks
   - Create update scripts if needed

2. Create documentation
   - Add inline code documentation
   - Create user guides
   - Add technical documentation

## Timeline Estimate
- Phase 1: 1-2 days
- Phase 2: 2-3 days
- Phase 3: 2-3 days
- Phase 4: 1-2 days
- Phase 5: 1 day

Total estimated time: 7-11 days
`;
      
      setDevelopmentPlan(generatedPlan);
      
      // Update the step data with the generated plan
      update({
        [MODULE_STEPS.DEVELOPMENT_PLAN]: {
          content: generatedPlan,
          approved: false,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error generating development plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const handleSaveEdit = () => {
    update({
      [MODULE_STEPS.DEVELOPMENT_PLAN]: {
        ...activeSession?.stepData?.[MODULE_STEPS.DEVELOPMENT_PLAN],
        content: developmentPlan,
        editedAt: new Date().toISOString(),
      },
    });
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    // Revert to the last saved plan
    setDevelopmentPlan(activeSession?.stepData?.[MODULE_STEPS.DEVELOPMENT_PLAN]?.content || '');
    setIsEditing(false);
  };
  
  const handleApprove = () => {
    // Update the step data with the approved status
    update({
      [MODULE_STEPS.DEVELOPMENT_PLAN]: {
        ...activeSession?.stepData?.[MODULE_STEPS.DEVELOPMENT_PLAN],
        approved: true,
        approvedAt: new Date().toISOString(),
      },
    });
    
    // Complete this step and move to the next
    completeStep(MODULE_STEPS.DEVELOPMENT_PLAN, {
      content: developmentPlan,
      approved: true,
      approvedAt: new Date().toISOString(),
    });
    
    // Navigate to the next step
    setStep(MODULE_STEPS.MODULE_OUTPUT);
  };
  
  const handleRegenerateClick = async () => {
    if (window.confirm('Are you sure you want to regenerate the development plan? Any edits will be lost.')) {
      await generateDevelopmentPlan();
    }
  };
  
  const togglePhaseDetails = (phaseId) => {
    console.log('Toggling phase details for:', phaseId);
    setShowDetails(prev => {
      const newDetails = {
        ...prev,
        [phaseId]: !prev[phaseId]
      };
      console.log('Updated showDetails state:', newDetails);
      return newDetails;
    });
  };
  
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Generating development plan based on your specification...</p>
      </div>
    );
  }
  
  // Parser for development plan sections with improved collapsible functionality
  const renderDevelopmentPlan = () => {
    if (!developmentPlan) return null;
    
    // Simple parsing for demonstration purposes
    const sections = developmentPlan.split('\n## ');
    const header = sections.shift(); // Get the title
    
    // Initialize all sections as expanded by default if showDetails is empty
    useEffect(() => {
      if (sections.length > 0 && Object.keys(showDetails).length === 0) {
        const initialDetails = {};
        sections.forEach((_, index) => {
          initialDetails[`phase-${index}`] = true; // Set all sections to expanded by default
        });
        setShowDetails(initialDetails);
        console.log('Initialized section states:', initialDetails);
      }
    }, [developmentPlan, sections.length]);
    
    return (
      <div>
        <div className="text-xl font-bold mb-4">{header.replace('# ', '')}</div>
        
        {sections.map((section, index) => {
          const [title, ...content] = section.split('\n');
          const phaseId = `phase-${index}`;
          const isExpanded = Boolean(showDetails[phaseId]);
          
          console.log(`Rendering section ${phaseId}, expanded:`, isExpanded);
          
          return (
            <motion.div 
              key={phaseId}
              className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div 
                className="bg-gray-100 dark:bg-gray-700 p-3 cursor-pointer flex justify-between items-center"
                onClick={() => togglePhaseDetails(phaseId)}
                data-phase-id={phaseId}
              >
                <h3 className="font-medium">{title}</h3>
                <svg 
                  className={`w-5 h-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {isExpanded && (
                <div className="p-3 bg-white dark:bg-gray-800">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {content.join('\n')}
                  </pre>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Development Plan</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Review the development plan for your module. This outlines the steps that will be taken to create your module.
      </p>
      
      {isEditing ? (
        <>
          <textarea
            value={developmentPlan}
            onChange={(e) => setDevelopmentPlan(e.target.value)}
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
            {renderDevelopmentPlan()}
          </div>
          
          <div className="flex justify-between">
            <div className="space-x-3">
              <button
                onClick={handleEditClick}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Edit Plan
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

export default DevelopmentPlanStep;
