import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
// Import the simplified wave background
import SimpleWaveBackground from '../components/Hero/SimpleWaveBackground.jsx';
// Other complex components remain commented out
// import ParticleSphere from '../components/Hero/ParticleSphere.jsx';
// import InteractiveGradientSphere from '../components/Hero/InteractiveGradientSphere.jsx';
// import ShaderButton from '../components/Hero/ShaderButton.jsx';

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

const StyledButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.primary.main};
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary.dark};
    transform: translateY(-2px);
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
  const handleDirectCreateSession = () => {
    // Navigate to chat for starting a new module
    console.log('Starting new module');
  };

  return (
    <HomeContainer>
      {/* Use the simplified wave background */}
      <SimpleWaveBackground />
      {/* Other complex components remain commented out */}
      {/* <ParticleSphere /> */}
      {/* <InteractiveGradientSphere /> */}

      {/* Content */}
      <Title>Build Custom Odoo Modules with Ease</Title>
      <Subtitle>
        Generate, test, and deploy Odoo ERP modules through a guided,
        conversational interface powered by AI.
      </Subtitle>
      
      <ButtonContainer>
        {/* Use the regular styled button */}
        <StyledButton onClick={handleDirectCreateSession}>
          Start Building Now
        </StyledButton>
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