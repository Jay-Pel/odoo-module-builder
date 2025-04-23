import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaCheck, FaEdit, FaArrowRight, FaArrowLeft } from 'react-icons/fa/index.js';

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

const SpecificationContainer = styled.div`
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
`;

const SpecificationSection = styled.div`
  margin-bottom: 2rem;
`;

const SpecificationItem = styled.div`
  margin-bottom: 1.5rem;
`;

const ItemTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ItemContent = styled.div`
  color: ${({ theme }) => theme.colors.secondary};
  line-height: 1.6;
`;

const EditButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const ButtonIcon = styled.span`
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

// Sample specification data
const sampleSpecification = {
  moduleName: "Inventory Batch Processing",
  moduleDescription: "A module to enable batch processing of inventory operations in Odoo, allowing users to perform actions on multiple inventory items simultaneously.",
  functionalRequirements: [
    "Batch selection of inventory items from list view",
    "Apply operations (transfer, adjust quantity, change location) to multiple items at once",
    "Configurable validation rules for batch operations",
    "Detailed logging of all batch operations",
    "Undo functionality for batch operations"
  ],
  technicalRequirements: [
    "Integration with existing Odoo inventory module",
    "Custom security roles for batch operation permissions",
    "Database optimization for handling large batch operations",
    "REST API endpoints for external system integration"
  ],
  userInterface: [
    "Batch selection interface in inventory list view",
    "Batch operation modal with operation-specific options",
    "Batch operation history and logs view",
    "User-friendly error handling and validation messages"
  ],
  dependencies: [
    "Odoo Inventory Management (stock)",
    "Odoo Accounting (account)",
    "Odoo Contacts (contacts)"
  ]
};

function SpecificationReview() {
  const [specification, setSpecification] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [specificationId, setSpecificationId] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const navigate = useNavigate();
  
  // Load the specification when the component mounts
  useEffect(() => {
    const loadSpecification = async () => {
      try {
        setIsLoading(true);
        
        // Get the module context from session storage
        const moduleContext = JSON.parse(sessionStorage.getItem('moduleContext') || '{}');
        
        // Call the API to generate a specification
        const response = await fetch('/api/specification/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            context: moduleContext
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate specification');
        }
        
        const data = await response.json();
        
        // Format the specification data for display
        const formattedSpec = {
          moduleName: data.specification.module_name,
          moduleDescription: data.specification.module_description,
          functionalRequirements: data.specification.functional_requirements,
          technicalRequirements: data.specification.technical_requirements,
          userInterface: data.specification.user_interface,
          dependencies: data.specification.dependencies
        };
        
        setSpecification(formattedSpec);
        setSpecificationId(data.specification_id);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading specification:', error);
        setError('Failed to load specification. Please try again.');
        setIsLoading(false);
        
        // Fallback to sample specification if there's an error
        setSpecification(sampleSpecification);
      }
    };
    
    loadSpecification();
  }, []);
  
  const handleEditRequest = (section) => {
    setShowFeedback(true);
    setCurrentSection(section);
    setFeedback(`I'd like to make changes to the ${section} section. Specifically, `);
  };
  
  const handleFeedbackChange = (e) => {
    setFeedback(e.target.value);
  };
  
  const handleSubmitFeedback = async () => {
    if (!feedback.trim() || !specificationId) return;
    
    try {
      setIsLoading(true);
      
      // Map the section name to the API's expected format
      const sectionMapping = {
        'module name': 'module_name',
        'module description': 'module_description',
        'functional requirements': 'functional_requirements',
        'technical requirements': 'technical_requirements',
        'user interface': 'user_interface',
        'dependencies': 'dependencies'
      };
      
      const sections = currentSection ? [sectionMapping[currentSection]] : [];
      
      // Call the API to update the specification
      const response = await fetch(`/api/specification/${specificationId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: feedback,
          sections: sections
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update specification');
      }
      
      const data = await response.json();
      
      // Format the updated specification data for display
      const formattedSpec = {
        moduleName: data.specification.module_name,
        moduleDescription: data.specification.module_description,
        functionalRequirements: data.specification.functional_requirements,
        technicalRequirements: data.specification.technical_requirements,
        userInterface: data.specification.user_interface,
        dependencies: data.specification.dependencies
      };
      
      setSpecification(formattedSpec);
      setShowFeedback(false);
      setFeedback('');
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error updating specification:', error);
      alert('There was an error updating the specification. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleBack = () => {
    navigate('/chat');
  };
  
  const handleNext = async () => {
    if (!specificationId) return;
    
    try {
      // Call the API to approve the specification
      const response = await fetch(`/api/specification/${specificationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve specification');
      }
      
      // Store the specification ID in session storage for use in the development plan page
      sessionStorage.setItem('specificationId', specificationId);
      
      // Navigate to the development plan page
      navigate('/development-plan');
    } catch (error) {
      console.error('Error approving specification:', error);
      alert('There was an error approving the specification. Please try again.');
    }
  };
  
  // Show loading state while fetching the specification
  if (isLoading && !specification) {
    return (
      <PageContainer>
        <PageHeader>
          <PageTitle>Generating Your Module Specification</PageTitle>
          <PageDescription>
            Please wait while we generate a detailed specification based on your requirements...
          </PageDescription>
        </PageHeader>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>This may take a few moments...</p>
        </div>
      </PageContainer>
    );
  }
  
  // Show error state if there was a problem
  if (error && !specification) {
    return (
      <PageContainer>
        <PageHeader>
          <PageTitle>Error</PageTitle>
          <PageDescription>
            {error}
          </PageDescription>
        </PageHeader>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <button onClick={() => navigate('/chat')}>Return to Chat</button>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Review Your Module Specification</PageTitle>
        <PageDescription>
          Please review the generated specification for your Odoo module.
          You can request changes to any section before proceeding to the development plan.
        </PageDescription>
      </PageHeader>
      
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '1rem', marginBottom: '1rem' }}>
          <p>Updating specification...</p>
        </div>
      )}
      
      <SpecificationContainer>
        <SpecificationSection>
          <SectionTitle>Module Information</SectionTitle>
          
          <SpecificationItem>
            <ItemTitle>
              Module Name
              <EditButton onClick={() => handleEditRequest('module name')}>
                <ButtonIcon><FaEdit /></ButtonIcon>
                Edit
              </EditButton>
            </ItemTitle>
            <ItemContent>{specification.moduleName}</ItemContent>
          </SpecificationItem>
          
          <SpecificationItem>
            <ItemTitle>
              Module Description
              <EditButton onClick={() => handleEditRequest('module description')}>
                <ButtonIcon><FaEdit /></ButtonIcon>
                Edit
              </EditButton>
            </ItemTitle>
            <ItemContent>{specification.moduleDescription}</ItemContent>
          </SpecificationItem>
        </SpecificationSection>
        
        <SpecificationSection>
          <SectionTitle>Functional Requirements</SectionTitle>
          <SpecificationItem>
            <ItemTitle>
              Features and Capabilities
              <EditButton onClick={() => handleEditRequest('functional requirements')}>
                <ButtonIcon><FaEdit /></ButtonIcon>
                Edit
              </EditButton>
            </ItemTitle>
            <ItemContent>
              <ul>
                {specification.functionalRequirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </ItemContent>
          </SpecificationItem>
        </SpecificationSection>
        
        <SpecificationSection>
          <SectionTitle>Technical Requirements</SectionTitle>
          <SpecificationItem>
            <ItemTitle>
              Technical Specifications
              <EditButton onClick={() => handleEditRequest('technical requirements')}>
                <ButtonIcon><FaEdit /></ButtonIcon>
                Edit
              </EditButton>
            </ItemTitle>
            <ItemContent>
              <ul>
                {specification.technicalRequirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </ItemContent>
          </SpecificationItem>
        </SpecificationSection>
        
        <SpecificationSection>
          <SectionTitle>User Interface</SectionTitle>
          <SpecificationItem>
            <ItemTitle>
              UI Components
              <EditButton onClick={() => handleEditRequest('user interface')}>
                <ButtonIcon><FaEdit /></ButtonIcon>
                Edit
              </EditButton>
            </ItemTitle>
            <ItemContent>
              <ul>
                {specification.userInterface.map((ui, index) => (
                  <li key={index}>{ui}</li>
                ))}
              </ul>
            </ItemContent>
          </SpecificationItem>
        </SpecificationSection>
        
        <SpecificationSection>
          <SectionTitle>Dependencies</SectionTitle>
          <SpecificationItem>
            <ItemTitle>
              Required Modules
              <EditButton onClick={() => handleEditRequest('dependencies')}>
                <ButtonIcon><FaEdit /></ButtonIcon>
                Edit
              </EditButton>
            </ItemTitle>
            <ItemContent>
              <ul>
                {specification.dependencies.map((dep, index) => (
                  <li key={index}>{dep}</li>
                ))}
              </ul>
            </ItemContent>
          </SpecificationItem>
        </SpecificationSection>
      </SpecificationContainer>
      
      {showFeedback && (
        <FeedbackContainer>
          <FeedbackTitle>Request Changes</FeedbackTitle>
          <FeedbackTextarea 
            value={feedback}
            onChange={handleFeedbackChange}
            placeholder="Describe the changes you'd like to make to the specification..."
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
          Back to Chat
        </BackButton>
        <NextButton onClick={handleNext}>
          Approve and Continue
          <ButtonIcon style={{ marginLeft: '0.5rem', marginRight: 0 }}>
            <FaArrowRight />
          </ButtonIcon>
        </NextButton>
      </ActionButtons>
    </PageContainer>
  );
}

export default SpecificationReview;