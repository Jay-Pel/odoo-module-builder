import React from 'react';
import { MODULE_STEPS } from '../../stores/moduleSessionStore';

const StepProgress = ({ currentStep }) => {
  const steps = [
    { key: MODULE_STEPS.REQUIREMENTS, label: 'Requirements', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { key: MODULE_STEPS.SPECIFICATION, label: 'Specification', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: MODULE_STEPS.DEVELOPMENT_PLAN, label: 'Development Plan', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { key: MODULE_STEPS.MODULE_OUTPUT, label: 'Module Output', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { key: MODULE_STEPS.ODOO_TESTING, label: 'Odoo Testing', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  ];
  
  // Calculate progress based on current step
  const currentIndex = steps.findIndex(step => step.key === currentStep);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
  
  // Determine completed steps based on current step
  const completedSteps = steps
    .filter((step, index) => index < currentIndex)
    .map(step => step.key);

  return (
    <div className="relative mb-10 mt-2 px-4">
      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex justify-between mt-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.key);
          const isCurrent = currentStep === step.key;
          
          return (
            <div
              key={step.key}
              className="flex flex-col items-center relative group"
            >
              {/* Connecting lines */}
              {index < steps.length - 1 && (
                <div className="absolute h-0.5 bg-gray-200 top-4 left-8 right-0 -translate-y-1/2 -z-10" />
              )}
              
              {/* Step circle with icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={step.icon} />
                  </svg>
                )}
              </div>

              {/* Step label */}
              <span
                className={`mt-2 text-sm font-medium whitespace-nowrap ${
                  isCurrent
                    ? 'text-blue-600'
                    : isCompleted
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
              
              {/* Tooltip for small screens */}
              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded py-1 px-2 pointer-events-none transform -translate-x-1/2 left-1/2 hidden sm:block">
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgress;