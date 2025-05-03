import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import SimpleWaveBackground from '../components/Hero/SimpleWaveBackground.jsx';
import { useModuleSession } from '../hooks/useModuleSession.js';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  position: relative;
  min-height: 80vh;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primary.dark};
  position: relative;
  z-index: 5;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  max-width: 600px;
  margin-bottom: 2rem;
  position: relative;
  z-index: 5;
`;

const ButtonContainer = styled.div`
  margin-top: 1rem;
  position: relative;
  z-index: 5;
`;

const LoadingSpinner = styled.div`
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 3px solid white;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin-right: 8px;
  display: inline-block;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  margin-top: 1rem;
  font-size: 0.9rem;
  background-color: ${({ theme }) => theme.colors.error}15;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StyledButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: ${({ theme, disabled }) => 
    disabled ? theme.colors.disabled : theme.colors.primary.main};
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  
  &:hover {
    background-color: ${({ theme, disabled }) => 
      disabled ? theme.colors.disabled : theme.colors.primary.dark};
    transform: ${({ disabled }) => (disabled ? 'none' : 'translateY(-2px)')};
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const FeatureContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: 1000px;
  margin-top: 3rem;
  position: relative;
  z-index: 5;
`;

const FeatureCard = styled.div`
  padding: 1.5rem;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primary.dark};
`;

const FeatureDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.6;
`;

const Home = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { start, setStep } = useModuleSession();

  const handleDirectCreateSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Start a new module session
      start({
        name: '',
        description: '',
        version: '1.0.0.0.1',
        license: 'LGPL-3',
        created: new Date().toISOString()
      });
      
      // Set initial step
      setStep('requirements');
      
      // Navigate to the module creation wizard
      navigate('/create-module');
    } catch (err) {
      setError('Failed to start module creation. Please try again.');
      console.error('Session creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <HomeContainer>
      <SimpleWaveBackground />

      <Title>Build Custom Odoo Modules with Ease</Title>
      <Subtitle>
        Generate, test, and deploy Odoo ERP modules through a guided,
        conversational interface powered by AI.
      </Subtitle>
      
      <ButtonContainer>
        <StyledButton 
          onClick={handleDirectCreateSession}
          disabled={isLoading}
          data-testid="create-module-btn"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              Starting...
            </>
          ) : (
            'Start Building Now'
          )}
        </StyledButton>
        {error && (
          <ErrorMessage>
            <span>⚠️</span>
            {error}
          </ErrorMessage>
        )}
      </ButtonContainer>
      
      <FeatureContainer>
        <FeatureCard>
          <FeatureTitle>Guided Creation</FeatureTitle>
          <FeatureDescription>
            Step-by-step guidance to help you define your module specifications with ease.
          </FeatureDescription>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureTitle>Custom Code Generation</FeatureTitle>
          <FeatureDescription>
            Generate Odoo-compatible code automatically based on your specifications.
          </FeatureDescription>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureTitle>Module Management</FeatureTitle>
          <FeatureDescription>
            Organize, edit, and track all your Odoo modules in one place.
          </FeatureDescription>
        </FeatureCard>
      </FeatureContainer>
    </HomeContainer>
  );
};

export default Home;