import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  padding: 2rem;
  margin: 2rem auto;
  max-width: 800px;
  background-color: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 0.5rem;
`;

const ErrorHeading = styled.h2`
  color: #cf1322;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.div`
  margin-bottom: 1rem;
`;

const ErrorStack = styled.pre`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 0.25rem;
  overflow: auto;
  font-size: 0.85rem;
`;

const ResetButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: #096dd9;
  }
`;

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <ErrorContainer role="alert">
      <ErrorHeading>Something went wrong!</ErrorHeading>
      <ErrorMessage>
        <p>The application encountered an error. You can try the following:</p>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
          <li>Refresh the page</li>
          <li>Clear your browser cache</li>
          <li>Check console for more details</li>
        </ul>
      </ErrorMessage>
      <ErrorStack>{error.message}</ErrorStack>
      {error.stack && (
        <details>
          <summary>Stack trace</summary>
          <ErrorStack>{error.stack}</ErrorStack>
        </details>
      )}
      <div style={{ marginTop: '1.5rem' }}>
        <ResetButton onClick={resetErrorBoundary}>Try Again</ResetButton>
      </div>
    </ErrorContainer>
  );
};

const ErrorBoundary = ({ children }) => {
  const handleReset = () => {
    // You can add custom reset logic here if needed
    window.location.href = '/';
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={handleReset}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary; 