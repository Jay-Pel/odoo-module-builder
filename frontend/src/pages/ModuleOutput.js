import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getValue, storeValue } from '../services/sessionService.js';
import styled from 'styled-components';
import {
  FaDownload,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaArrowLeft,
  FaHome,
  FaImage,
  FaFileCode,
  FaClipboardCheck
} from 'react-icons/fa/index.js';

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

const OutputContainer = styled.div`
  background-color: white;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: 2rem;
  margin-bottom: 2rem;
`;

const OdooTestContainer = styled.div`
  background-color: white;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: 2rem;
  margin-bottom: 2rem;
`;

const IframeContainer = styled.div`
  width: 100%;
  height: 600px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  margin: 1.5rem 0;
`;

const OdooIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

const TestControls = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const TestButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  background-color: ${({ theme, primary }) =>
    primary ? theme.colors.primary : 'white'};
  color: ${({ theme, primary }) =>
    primary ? 'white' : theme.colors.secondary};
  border: ${({ theme, primary }) =>
    primary ? 'none' : `1px solid ${theme.colors.border}`};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ theme, primary }) =>
      primary ? theme.colors.primaryDark : theme.colors.light};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.secondary};
    cursor: not-allowed;
  }
`;

const TestStatus = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1rem;
  padding: 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ status, theme }) => {
    switch (status) {
      case 'success':
        return `${theme.colors.success}20`;
      case 'error':
        return `${theme.colors.danger}20`;
      case 'loading':
        return `${theme.colors.warning}20`;
      default:
        return `${theme.colors.secondary}20`;
    }
  }};
`;

const TestStatusIcon = styled.div`
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ status, theme }) => {
    switch (status) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.danger;
      case 'loading':
        return theme.colors.warning;
      default:
        return theme.colors.secondary;
    }
  }};
`;

const TestStatusText = styled.div`
  flex: 1;
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

const GenerationStatus = styled.div`
  margin-bottom: 2rem;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ status, theme }) => {
    switch (status) {
      case 'completed':
        return `${theme.colors.success}20`;
      case 'failed':
        return `${theme.colors.danger}20`;
      case 'in-progress':
        return `${theme.colors.warning}20`;
      default:
        return `${theme.colors.secondary}20`;
    }
  }};
`;

const StatusIcon = styled.div`
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: ${({ status, theme }) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'failed':
        return theme.colors.danger;
      case 'in-progress':
        return theme.colors.warning;
      default:
        return theme.colors.secondary;
    }
  }};
`;

const StatusText = styled.div`
  flex: 1;
`;

const StatusTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
`;

const StatusDescription = styled.p`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 0.9rem;
`;

const SpinnerIcon = styled(FaSpinner)`
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const TestResultsContainer = styled.div`
  margin-top: 2rem;
`;

const TestCategory = styled.div`
  margin-bottom: 2rem;
`;

const TestCategoryTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
`;

const TestCategoryIcon = styled.span`
  margin-right: 0.75rem;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primary};
`;

const TestList = styled.div`
  margin-left: 2rem;
`;

const TestItem = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: ${({ isLast, theme }) => 
    isLast ? 'none' : `1px dashed ${theme.colors.border}`};
`;

const TestIcon = styled.div`
  margin-right: 1rem;
  margin-top: 0.25rem;
  color: ${({ passed, theme }) => 
    passed ? theme.colors.success : theme.colors.danger};
`;

const TestContent = styled.div`
  flex: 1;
`;

const TestName = styled.h4`
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

const TestDescription = styled.p`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const TestError = styled.div`
  background-color: ${({ theme }) => `${theme.colors.danger}10`};
  border-left: 3px solid ${({ theme }) => theme.colors.danger};
  padding: 0.75rem;
  margin-top: 0.5rem;
  font-family: monospace;
  font-size: 0.85rem;
  white-space: pre-wrap;
  overflow-x: auto;
`;

const ScreenshotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const Screenshot = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const ScreenshotImage = styled.div`
  height: 150px;
  background-color: ${({ theme }) => theme.colors.light};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.secondary};
`;

const ScreenshotCaption = styled.div`
  padding: 0.5rem;
  font-size: 0.8rem;
  text-align: center;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const DownloadSection = styled.div`
  margin-top: 2rem;
  text-align: center;
  padding: 2rem;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;

const DownloadTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
`;

const DownloadDescription = styled.p`
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: 1.5rem;
`;

const DownloadButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.success}dd;
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.secondary};
    cursor: not-allowed;
  }
`;

const ButtonIcon = styled.span`
  margin-right: 0.75rem;
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

const HomeButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

// Default empty test results structure
const emptyTestResults = {
  backendTests: [],
  frontendTests: []
};

function ModuleOutput() {
  const [generationStatus, setGenerationStatus] = useState([
    { id: 1, title: "Initializing Module Generation", description: "Setting up the module structure and preparing files.", status: "pending" },
    { id: 2, title: "Generating Models and Business Logic", description: "Creating Python classes and implementing core functionality.", status: "pending" },
    { id: 3, title: "Creating Views and UI Components", description: "Generating XML views and JavaScript components.", status: "pending" },
    { id: 4, title: "Implementing Security and Access Rules", description: "Setting up proper security configurations.", status: "pending" },
    { id: 5, title: "Running Backend Tests", description: "Testing models, business logic, and API endpoints.", status: "pending" },
    { id: 6, title: "Running Frontend Tests", description: "Testing UI rendering and user interactions.", status: "pending" },
    { id: 7, title: "Packaging Module", description: "Creating the final module package for download.", status: "pending" }
  ]);
  
  const [testResults, setTestResults] = useState(null);
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);
  const [odooTestStatus, setOdooTestStatus] = useState(null);
  const [odooTestMessage, setOdooTestMessage] = useState('');
  const [isOdooEnvironmentReady, setIsOdooEnvironmentReady] = useState(false);
  const [isOdooTestRunning, setIsOdooTestRunning] = useState(false);
  const [odooUrl, setOdooUrl] = useState('');
  const [moduleInfo, setModuleInfo] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  
  // Check if we have a plan ID and redirect if not
  useEffect(() => {
    // Use the sessionService to get the planId
    const planId = getValue('planId');
    
    if (!planId) {
      console.error('No plan ID found in storage');
      
      // Generate a temporary plan ID to prevent redirect loops
      const tempPlanId = 'temp-module-output-' + Date.now();
      storeValue('planId', tempPlanId);
      console.log('Generated temporary plan ID:', tempPlanId);
      
      // Only redirect if we're not already in the process of generating a module
      if (!isGenerating) {
        // Redirect to the development plan page
        navigate('/development-plan');
      }
    } else {
      // Ensure planId is available in both storage types
      storeValue('planId', planId);
      console.log('Using plan ID:', planId);
    }
  }, [navigate, isGenerating]);
  
  // Start the actual module generation process
  useEffect(() => {
    const generateModule = async () => {
      setIsGenerating(true);
      try {
        // Get the plan ID from storage using sessionService
        const planId = getValue('planId');
        
        if (!planId) {
          console.error('No plan ID found in storage');
          return;
        }
        
        // Call the API to start the module generation
        const response = await fetch('/api/module-generator/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_id: planId
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to start module generation');
        }
        
        const data = await response.json();
        const generationId = data.generation_id;
        
        // Store the generation ID in both session and local storage
        storeValue('generationId', generationId);
        
        // Set a timeout for the entire generation process (5 minutes)
        const generationTimeout = setTimeout(() => {
          clearInterval(statusInterval);
          setError('Module generation timed out. Please try again.');
          setIsGenerating(false);
        }, 5 * 60 * 1000);
        
        // Poll for generation status updates
        const statusInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/module-generator/status/${generationId}`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              
              // Update the UI with the current status
              if (statusData.progress) {
                setGenerationStatus(statusData.progress);
                
                // Check if any step has failed
                const failedStep = statusData.progress.find(step => step.status === 'failed');
                if (failedStep) {
                  console.warn(`Step "${failedStep.title}" failed, but continuing with the process`);
                }
              }
              
              // If generation is complete, clear the interval and set the test results
              if (statusData.status === 'completed') {
                clearInterval(statusInterval);
                clearTimeout(generationTimeout);
                
                // Get the test results
                const testResultsResponse = await fetch(`/api/module-generator/test-results/${generationId}`);
                if (testResultsResponse.ok) {
                  const testResultsData = await testResultsResponse.json();
                  setTestResults(testResultsData);
                } else {
                  console.error('Failed to fetch test results');
                  setTestResults(emptyTestResults);
                }
                
                // Get module information
                try {
                  const moduleInfoResponse = await fetch(`/api/module-generator/documentation/${generationId}`);
                  if (moduleInfoResponse.ok) {
                    const moduleInfoData = await moduleInfoResponse.json();
                    setModuleInfo(moduleInfoData);
                  }
                } catch (error) {
                  console.error('Error fetching module info:', error);
                }
                
                setIsGenerationComplete(true);
                setIsGenerating(false);
              }
            }
          } catch (error) {
            console.error('Error polling generation status:', error);
          }
        }, 2000);
        
        // Cleanup function to clear the interval and timeout
        return () => {
          clearInterval(statusInterval);
          clearTimeout(generationTimeout);
        };
      } catch (error) {
        console.error('Error generating module:', error);
        setIsGenerating(false);
      }
    };
    
    generateModule();
  }, []);
  
  // Handle starting the Odoo Docker environment
  const handleStartOdooEnvironment = async () => {
    setOdooTestStatus('loading');
    setOdooTestMessage('Starting Odoo environment in Docker...');
    
    try {
      // Get the generation ID from storage
      const generationId = getValue('generationId');
      
      if (!generationId) {
        throw new Error('No generation ID found. Please generate the module first.');
      }
      
      // Call the API to start the Odoo Docker environment
      const response = await fetch('/api/module-generator/start-odoo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generation_id: generationId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start Odoo environment');
      }
      
      const data = await response.json();
      
      // Set the Odoo URL from the response
      if (data.odoo_url) {
        setOdooUrl(data.odoo_url);
      } else {
        // Fallback to localhost if no URL is provided
        setOdooUrl('http://localhost:8069');
      }
      
      setIsOdooEnvironmentReady(true);
      setOdooTestStatus('success');
      setOdooTestMessage('Odoo environment is ready. You can now test your module.');
    } catch (error) {
      console.error('Error starting Odoo environment:', error);
      setOdooTestStatus('error');
      setOdooTestMessage(`Failed to start Odoo environment: ${error.message}`);
    }
  };
  
  // Handle running tests in the Odoo environment
  const handleRunOdooTests = async () => {
    setIsOdooTestRunning(true);
    setOdooTestStatus('loading');
    setOdooTestMessage('Running tests in Odoo environment...');
    
    try {
      // Get the generation ID from session storage
      const generationId = sessionStorage.getItem('generationId');
      
      if (!generationId) {
        throw new Error('No generation ID found. Please generate the module first.');
      }
      
      // Call the API to run tests in the Odoo environment
      const response = await fetch('/api/module-generator/run-odoo-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generation_id: generationId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to run tests in Odoo environment');
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setOdooTestStatus('success');
        setOdooTestMessage(data.message || 'All tests passed successfully in the Odoo environment.');
      } else {
        setOdooTestStatus('error');
        setOdooTestMessage(data.message || 'Tests failed in the Odoo environment.');
      }
      
      setIsOdooTestRunning(false);
    } catch (error) {
      console.error('Error running Odoo tests:', error);
      setOdooTestStatus('error');
      setOdooTestMessage(`Test failed in Odoo environment: ${error.message}`);
      setIsOdooTestRunning(false);
    }
  };
  
  const handleBack = () => {
    navigate('/development-plan');
  };
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  const handleDownload = async () => {
    try {
      // Get the generation ID from storage
      const generationId = getValue('generationId');
      
      if (!generationId) {
        alert('No generation ID found. Please generate the module first.');
        return;
      }
      
      // Create a link to download the module package
      const downloadUrl = `/api/module-generator/download/${generationId}`;
      
      // Create a temporary link element and trigger the download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', ''); // This will use the server's suggested filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading module:', error);
      alert('Failed to download module package. Please try again.');
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheck />;
      case 'failed':
        return <FaTimes />;
      case 'in-progress':
        return <SpinnerIcon />;
      default:
        return null;
    }
  };
  
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Module Generation Output</PageTitle>
        <PageDescription>
          Your Odoo module is being generated and tested. Once complete, you can download 
          the module package and view detailed test results.
        </PageDescription>
      </PageHeader>
      
      <OutputContainer>
        <SectionTitle>
          <SectionIcon><FaFileCode /></SectionIcon>
          Generation Status
        </SectionTitle>
        
        <GenerationStatus>
          {generationStatus.map((item) => (
            <StatusItem key={item.id} status={item.status}>
              <StatusIcon status={item.status}>
                {getStatusIcon(item.status)}
              </StatusIcon>
              <StatusText>
                <StatusTitle>{item.title}</StatusTitle>
                <StatusDescription>{item.description}</StatusDescription>
              </StatusText>
            </StatusItem>
          ))}
        </GenerationStatus>
        
        {testResults && (
          <TestResultsContainer>
            <SectionTitle>
              <SectionIcon><FaClipboardCheck /></SectionIcon>
              Test Results
            </SectionTitle>
            
            <TestCategory>
              <TestCategoryTitle>
                <TestCategoryIcon>
                  <FaFileCode />
                </TestCategoryIcon>
                Backend Tests
              </TestCategoryTitle>
              
              <TestList>
                {testResults.backendTests.map((test, index) => (
                  <TestItem 
                    key={index} 
                    isLast={index === testResults.backendTests.length - 1}
                  >
                    <TestIcon passed={test.passed}>
                      {test.passed ? <FaCheck /> : <FaTimes />}
                    </TestIcon>
                    <TestContent>
                      <TestName>{test.name}</TestName>
                      <TestDescription>{test.description}</TestDescription>
                      {!test.passed && test.error && (
                        <TestError>{test.error}</TestError>
                      )}
                    </TestContent>
                  </TestItem>
                ))}
              </TestList>
            </TestCategory>
            
            <TestCategory>
              <TestCategoryTitle>
                <TestCategoryIcon>
                  <FaImage />
                </TestCategoryIcon>
                Frontend Tests
              </TestCategoryTitle>
              
              <TestList>
                {testResults.frontendTests.map((test, index) => (
                  <TestItem 
                    key={index} 
                    isLast={index === testResults.frontendTests.length - 1}
                  >
                    <TestIcon passed={test.passed}>
                      {test.passed ? <FaCheck /> : <FaTimes />}
                    </TestIcon>
                    <TestContent>
                      <TestName>{test.name}</TestName>
                      <TestDescription>{test.description}</TestDescription>
                      
                      {test.screenshots && test.screenshots.length > 0 && (
                        <ScreenshotGrid>
                          {test.screenshots.map((screenshot) => (
                            <Screenshot key={screenshot.id}>
                              <ScreenshotImage>
                                <FaImage size={32} />
                              </ScreenshotImage>
                              <ScreenshotCaption>
                                {screenshot.name}
                              </ScreenshotCaption>
                            </Screenshot>
                          ))}
                        </ScreenshotGrid>
                      )}
                      
                      {!test.passed && test.error && (
                        <TestError>{test.error}</TestError>
                      )}
                    </TestContent>
                  </TestItem>
                ))}
              </TestList>
            </TestCategory>
          </TestResultsContainer>
        )}
        
        {isGenerationComplete && (
          <>
            <OdooTestContainer>
              <SectionTitle>
                <SectionIcon><FaFileCode /></SectionIcon>
                Test in Odoo Environment
              </SectionTitle>
              
              <TestControls>
                <TestButton
                  primary
                  onClick={handleStartOdooEnvironment}
                  disabled={isOdooEnvironmentReady || isOdooTestRunning}
                >
                  <ButtonIcon><FaFileCode /></ButtonIcon>
                  Start Odoo Environment
                </TestButton>
                
                <TestButton
                  onClick={handleRunOdooTests}
                  disabled={!isOdooEnvironmentReady || isOdooTestRunning}
                >
                  <ButtonIcon><FaClipboardCheck /></ButtonIcon>
                  Run Tests
                </TestButton>
              </TestControls>
              
              {odooTestStatus && (
                <TestStatus status={odooTestStatus}>
                  <TestStatusIcon status={odooTestStatus}>
                    {odooTestStatus === 'success' && <FaCheck />}
                    {odooTestStatus === 'error' && <FaTimes />}
                    {odooTestStatus === 'loading' && <SpinnerIcon />}
                  </TestStatusIcon>
                  <TestStatusText>
                    {odooTestMessage}
                  </TestStatusText>
                </TestStatus>
              )}
              
              {isOdooEnvironmentReady && (
                <IframeContainer>
                  <OdooIframe
                    src={odooUrl || "http://localhost:8069"}
                    title="Odoo Environment"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  />
                </IframeContainer>
              )}
            </OdooTestContainer>
            
            <DownloadSection>
              <DownloadTitle>Your Module is Ready!</DownloadTitle>
              <DownloadDescription>
                {moduleInfo && moduleInfo.module_name ?
                  `Your ${moduleInfo.module_name} module has been successfully generated and tested.` :
                  'Your Odoo module has been successfully generated and tested.'}
                You can now download the module package and install it in your Odoo instance.
              </DownloadDescription>
              <DownloadButton onClick={handleDownload}>
                <ButtonIcon><FaDownload /></ButtonIcon>
                Download Module Package
              </DownloadButton>
            </DownloadSection>
          </>
        )}
      </OutputContainer>
      
      <ActionButtons>
        <BackButton onClick={handleBack}>
          <ButtonIcon><FaArrowLeft /></ButtonIcon>
          Back to Development Plan
        </BackButton>
        <HomeButton onClick={handleGoHome}>
          <ButtonIcon><FaHome /></ButtonIcon>
          Return to Home
        </HomeButton>
      </ActionButtons>
    </PageContainer>
  );
}

export default ModuleOutput;