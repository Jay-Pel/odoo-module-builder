import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModuleSession } from '../../hooks/useModuleSession';
import { MODULE_STEPS } from '../../stores/moduleSessionStore';
import RequirementsStep from './RequirementsStep';
import StepProgress from './StepProgress';

const ModuleWizardContainer = () => {
  const navigate = useNavigate();
  const {
    activeSession,
    currentStep,
    error,
    isLoading,
    start,
    update,
    setStep
  } = useModuleSession();

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

  const renderCurrentStep = () => {
    switch (currentStep) {
      case MODULE_STEPS.REQUIREMENTS:
        return <RequirementsStep />;
      case MODULE_STEPS.SPECIFICATION:
      case MODULE_STEPS.DEVELOPMENT_PLAN:
      case MODULE_STEPS.MODULE_OUTPUT:
        return <div>This step is under development</div>;
      default:
        return null;
    }
  };

  if (isLoading || (!activeSession && !error)) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <StepProgress
          currentStep={currentStep}
        />
        
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default ModuleWizardContainer; 