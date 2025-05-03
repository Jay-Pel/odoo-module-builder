import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useModuleSession } from '../../hooks/useModuleSession';
import { MODULE_STEPS } from '../../stores/moduleSessionStore';
import RequirementsStep from '../ModuleWizard/RequirementsStep';
import SpecificationStep from './SpecificationStep';
import DevelopmentPlanStep from './DevelopmentPlanStep';
import ModuleOutputStep from './ModuleOutputStep';
import OdooTestingStep from './OdooTestingStep';
import StepProgress from '../ModuleWizard/StepProgress';

// Animation variants for page transitions
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeInOut'
    }
  },
  out: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeInOut'
    }
  }
};

const ModuleGenerationWizard = () => {
  const navigate = useNavigate();
  const {
    activeSession,
    currentStep,
    error,
    isLoading,
    start,
    update,
    setStep,
    completeStep,
    validateStep,
  } = useModuleSession();
  
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (!activeSession) {
      // Start a new session if none exists
      start();
      update({
        name: '',
        description: '',
        createdAt: new Date().toISOString(),
      });
    }
  }, [activeSession, start, update]);

  const saveAndContinueLater = async () => {
    setSaving(true);
    try {
      // Store current progress
      await update({
        lastSaved: new Date().toISOString(),
        savedAt: currentStep,
      });
      
      // Navigate to home
      navigate('/');
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSaving(false);
    }
  };

  // Animation variants for step transitions
  const stepVariants = {
    initial: {
      opacity: 0,
      x: 50
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    },
    exit: {
      opacity: 0,
      x: -50,
      transition: {
        duration: 0.3
      }
    }
  };

  const renderStepComponent = () => {
    switch (currentStep) {
      case MODULE_STEPS.REQUIREMENTS:
        return <RequirementsStep />
      case MODULE_STEPS.SPECIFICATION:
        return <SpecificationStep />
      case MODULE_STEPS.DEVELOPMENT_PLAN:
        return <DevelopmentPlanStep />
      case MODULE_STEPS.MODULE_OUTPUT:
        return <ModuleOutputStep />
      case MODULE_STEPS.ODOO_TESTING:
        return <OdooTestingStep />
      default:
        return <RequirementsStep />
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading your module session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-lg">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Session</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-6 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Create Your Odoo Module</h1>
            <p className="text-gray-600">
              Follow the steps below to generate your custom Odoo module.
            </p>
          </div>

          <StepProgress currentStep={currentStep} />
          
          {/* Step Content */}
          <div className="mt-6 bg-white rounded-lg shadow-md p-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                className="w-full"
              >
                {renderStepComponent()}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Bottom Action Bar */}
          <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={saveAndContinueLater}
              disabled={saving}
              className="px-5 py-2.5 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 shadow-sm font-medium text-sm"
            >
              {saving ? 'Saving...' : 'Save & Continue Later'}
            </button>
            
            <a 
              href="#" 
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Need help with this step?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleGenerationWizard;
