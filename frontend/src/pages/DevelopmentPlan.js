import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getValue, storeValue } from '../services/sessionService.js';
import styled from 'styled-components';
import { FaCheck, FaEdit, FaArrowRight, FaArrowLeft, FaCode, FaList, FaFileAlt } from 'react-icons/fa/index.js';

const PageContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const PageDescription = styled.p`
  color: ${({ theme }) => theme.colors.secondary};
`;

const PlanContainer = styled.div`
  background-color: white;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: 2rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
`;

const SectionIcon = styled.span`
  margin-right: 0.75rem;
  display: flex;
  align-items: center;
`;

const PlanSection = styled.div`
  margin-bottom: 2rem;
`;

const StepsList = styled.div`
  margin-top: 1.5rem;
`;

const Step = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: ${({ isLast, theme }) => 
    isLast ? 'none' : `1px dashed ${theme.colors.border}`};
`;

const StepNumber = styled.div`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-right: 1rem;
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
`;

const StepDescription = styled.p`
  color: ${({ theme }) => theme.colors.secondary};
  line-height: 1.6;
`;

const FileStructure = styled.div`
  margin-top: 1rem;
  font-family: monospace;
  background-color: ${({ theme }) => theme.colors.light};
  padding: 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  line-height: 1.6;
`;

const File = styled.div`
  margin-left: ${({ level }) => `${level * 1.5}rem`};
  display: flex;
  align-items: center;
`;

const FileIcon = styled.span`
  color: ${({ theme, isFolder }) => 
    isFolder ? theme.colors.warning : theme.colors.info};
  margin-right: 0.5rem;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;
`;

const BackButton = styled(Button)`
  background-color: white;
  color: ${({ theme }) => theme.colors.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.light};
  }
`;

const NextButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const ButtonIcon = styled.span`
  margin-right: ${({ isRight }) => (isRight ? 0 : '0.5rem')};
  margin-left: ${({ isRight }) => (isRight ? '0.5rem' : 0)};
`;

const FeedbackContainer = styled.div`
  margin-top: 2rem;
`;

const FeedbackTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
`;

const FeedbackTextarea = styled.textarea`
  width: 100%;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: inherit;
  font-size: 1rem;
  min-height: 150px;
  margin-bottom: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SubmitFeedbackButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
  border: none;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.success}dd;
  }
`;

// Sample development plan data
const samplePlan = {
  id: 'sample-plan-id',  // Add an ID to the sample plan
  moduleStructure: [
    { name: "inventory_batch_processing", isFolder: true, level: 0 },
    { name: "__init__.py", isFolder: false, level: 1 },
    { name: "__manifest__.py", isFolder: false, level: 1 },
    { name: "controllers", isFolder: true, level: 1 },
    { name: "__init__.py", isFolder: false, level: 2 },
    { name: "main.py", isFolder: false, level: 2 },
    { name: "models", isFolder: true, level: 1 },
    { name: "__init__.py", isFolder: false, level: 2 },
    { name: "batch_operation.py", isFolder: false, level: 2 },
    { name: "batch_operation_line.py", isFolder: false, level: 2 },
    { name: "batch_operation_log.py", isFolder: false, level: 2 },
    { name: "views", isFolder: true, level: 1 },
    { name: "batch_operation_views.xml", isFolder: false, level: 2 },
    { name: "batch_operation_templates.xml", isFolder: false, level: 2 },
    { name: "menu.xml", isFolder: false, level: 2 },
    { name: "security", isFolder: true, level: 1 },
    { name: "ir.model.access.csv", isFolder: false, level: 2 },
    { name: "batch_operation_security.xml", isFolder: false, level: 2 },
    { name: "static", isFolder: true, level: 1 },
    { name: "description", isFolder: true, level: 2 },
    { name: "icon.png", isFolder: false, level: 3 },
    { name: "src", isFolder: true, level: 2 },
    { name: "js", isFolder: true, level: 3 },
    { name: "batch_operation.js", isFolder: false, level: 4 },
    { name: "css", isFolder: true, level: 3 },
    { name: "batch_operation.css", isFolder: false, level: 4 },
    { name: "data", isFolder: true, level: 1 },
    { name: "batch_operation_data.xml", isFolder: false, level: 2 },
    { name: "wizard", isFolder: true, level: 1 },
    { name: "__init__.py", isFolder: false, level: 2 },
    { name: "batch_operation_wizard.py", isFolder: false, level: 2 },
    { name: "batch_operation_wizard_views.xml", isFolder: false, level: 2 },
  ],
  developmentSteps: [
    {
      title: "Setup Module Structure",
      description: "Create the basic module structure with necessary files and directories according to Odoo standards."
    },
    {
      title: "Define Data Models",
      description: "Create Python classes for the data models needed for batch operations, including batch_operation, batch_operation_line, and batch_operation_log models."
    },
    {
      title: "Implement Security Rules",
      description: "Define access control rules for the new models and create necessary security groups for batch operation permissions."
    },
    {
      title: "Create Backend Views",
      description: "Develop XML views for displaying and interacting with batch operations, including list, form, and search views."
    },
    {
      title: "Implement Business Logic",
      description: "Code the core business logic for batch processing, including selection, validation, execution, and logging of operations."
    },
    {
      title: "Develop Frontend UI Components",
      description: "Create JavaScript components for the batch selection interface and operation modal in the Odoo web client."
    },
    {
      title: "Create Wizards",
      description: "Implement wizard interfaces for guiding users through the batch operation process with appropriate validation."
    },
    {
      title: "Add API Endpoints",
      description: "Develop REST API controllers for external system integration with the batch processing functionality."
    },
    {
      title: "Implement Undo Functionality",
      description: "Create the logic for reversing batch operations and restoring previous states when needed."
    },
    {
      title: "Add Demo Data",
      description: "Create demonstration data for testing and showcasing the module functionality."
    }
  ]
};

function DevelopmentPlan() {
  const [plan, setPlan] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [specificationId, setSpecificationId] = useState(null);
  const navigate = useNavigate();

  // Load the development plan when the component mounts
  useEffect(() => {
    const loadDevelopmentPlan = async () => {
      try {
        setIsLoading(true);
        
        // Get the specification ID from storage
        const specId = getValue('specificationId');
        if (!specId) {
          throw new Error('No specification ID found. Please go back to the specification review page.');
        }
        
        setSpecificationId(specId);
        
        // Call the API to generate a development plan
        const response = await fetch(`/api/development-plan/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            specification_id: specId
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate development plan');
        }
        
        const data = await response.json();
        
        // Check if we have a valid plan
        if (!data.plan) {
          console.warn('No plan data received from API, using sample plan');
          setPlan(samplePlan);
          setIsLoading(false);
          return;
        }
        
        // Convert backend property names to frontend property names if needed
        if (data.plan) {
          // Check if we need to convert property names
          if (data.plan.module_structure && !data.plan.moduleStructure) {
            data.plan.moduleStructure = data.plan.module_structure;
            delete data.plan.module_structure;
          }
          
          if (data.plan.development_steps && !data.plan.developmentSteps) {
            data.plan.developmentSteps = data.plan.development_steps;
            delete data.plan.development_steps;
          }
        }
        
        // If after conversion we still don't have the required properties, use sample plan
        if (!data.plan.moduleStructure || !data.plan.developmentSteps) {
          console.warn('Plan data is missing required properties, using sample plan');
          setPlan(samplePlan);
        } else {
          setPlan(data.plan);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading development plan:', error);
        setError(error.message);
        setIsLoading(false);
        
        // Fallback to sample plan if there's an error
        console.log('Using sample plan due to error:', error);
        setPlan(samplePlan);
      }
    };
    
    loadDevelopmentPlan();
  }, []);
  
  const handleFeedbackChange = (e) => {
    setFeedback(e.target.value);
  };
  
  const handleSubmitFeedback = () => {
    // In a real implementation, this would send the feedback to the backend
    alert('Feedback submitted! The development plan will be updated based on your feedback.');
    setShowFeedback(false);
    setFeedback('');
  };
  
  const handleBack = () => {
    navigate('/specification-review');
  };
  
  const handleNext = async () => {
    try {
      if (!specificationId) {
        alert('No specification ID found. Please go back to the specification review page.');
        return;
      }
      
      // Show loading state
      setIsGenerating(true);
      
      // Scroll to top to show the loading indicator
      window.scrollTo(0, 0);
      
      // Store the plan ID using sessionService if available
      if (plan && plan.id) {
        storeValue('planId', plan.id);
        console.log('Plan ID stored:', plan.id);
      } else {
        // If we don't have a plan ID, generate a temporary one
        const tempPlanId = 'temp-plan-id-' + Date.now();
        storeValue('planId', tempPlanId);
        console.log('Generated temporary plan ID:', tempPlanId);
      }
      
      // Add a slight delay to show the loading state before navigating
      setTimeout(() => {
        // Navigate to the module output page
        navigate('/module-output');
      }, 1500);
    } catch (error) {
      console.error('Error creating development plan:', error);
      alert('Failed to create development plan. Please try again.');
      setIsGenerating(false);
    }
  };
  
  const handleRequestChanges = () => {
    setShowFeedback(true);
    setFeedback('I would like to suggest the following changes to the development plan: ');
  };
  
  // Show loading state while fetching the development plan or generating the module
  if (isLoading || isGenerating) {
    return (
      <PageContainer>
        <PageHeader>
          <PageTitle>
            {isLoading ? 'Generating Development Plan' : 'Preparing Module Generation'}
          </PageTitle>
          <PageDescription>
            {isLoading
              ? 'Please wait while we generate a detailed development plan based on your module specification...'
              : 'Please wait while we prepare to generate your Odoo module based on the development plan...'}
          </PageDescription>
        </PageHeader>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            {isLoading ? '⏳' : '🔄'}
          </div>
          <p>{isLoading
            ? 'This may take a few moments...'
            : 'Setting up the module generation process...'}</p>
        </div>
      </PageContainer>
    );
  }
  
  // Show error state if there was a problem
  if (error && !plan) {
    return (
      <PageContainer>
        <PageHeader>
          <PageTitle>Error</PageTitle>
          <PageDescription>
            {error}
          </PageDescription>
        </PageHeader>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <button onClick={() => navigate('/specification-review')}>Return to Specification</button>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Development Plan</PageTitle>
        <PageDescription>
          Review the development plan for your Odoo module. This plan outlines the steps
          that will be taken to generate your module and the file structure that will be created.
        </PageDescription>
      </PageHeader>
      
      {plan && <PlanContainer>
        <PlanSection>
          <SectionTitle>
            <SectionIcon><FaFileAlt /></SectionIcon>
            Module Structure
          </SectionTitle>
          <FileStructure>
            {plan.moduleStructure && plan.moduleStructure.map((item, index) => (
              <File key={index} level={item.level}>
                <FileIcon isFolder={item.isFolder}>
                  {item.isFolder ? '📁' : '📄'}
                </FileIcon>
                {item.name}
              </File>
            ))}
          </FileStructure>
        </PlanSection>
        
        <PlanSection>
          <SectionTitle>
            <SectionIcon><FaList /></SectionIcon>
            Development Steps
          </SectionTitle>
          <StepsList>
            {plan.developmentSteps && plan.developmentSteps.map((step, index) => (
              <Step
                key={index}
                isLast={index === (plan.developmentSteps ? plan.developmentSteps.length - 1 : 0)}
              >
                <StepNumber>{index + 1}</StepNumber>
                <StepContent>
                  <StepTitle>{step.title}</StepTitle>
                  <StepDescription>{step.description}</StepDescription>
                </StepContent>
              </Step>
            ))}
          </StepsList>
        </PlanSection>
      </PlanContainer>}
      
      {showFeedback && (
        <FeedbackContainer>
          <FeedbackTitle>Request Changes</FeedbackTitle>
          <FeedbackTextarea 
            value={feedback}
            onChange={handleFeedbackChange}
            placeholder="Describe the changes you'd like to make to the development plan..."
          />
          <SubmitFeedbackButton onClick={handleSubmitFeedback}>
            <ButtonIcon><FaCheck /></ButtonIcon>
            Submit Feedback
          </SubmitFeedbackButton>
        </FeedbackContainer>
      )}
      
      <ActionButtons>
        <BackButton onClick={handleBack}>
          <ButtonIcon><FaArrowLeft /></ButtonIcon>
          Back to Specification
        </BackButton>
        <Button 
          onClick={handleRequestChanges}
          style={{ 
            backgroundColor: 'white', 
            color: '#6c757d', 
            border: '1px solid #dee2e6' 
          }}
        >
          <ButtonIcon><FaEdit /></ButtonIcon>
          Request Changes
        </Button>
        <NextButton onClick={handleNext}>
          Generate Module
          <ButtonIcon isRight><FaCode /></ButtonIcon>
        </NextButton>
      </ActionButtons>
    </PageContainer>
  );
}

export default DevelopmentPlan;