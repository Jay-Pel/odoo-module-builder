import React from 'react';
import ErrorBoundary from './ErrorBoundary';

const withErrorBoundary = (WrappedComponent, fallbackMessage) => {
  return function WithErrorBoundaryWrapper(props) {
    return (
      <ErrorBoundary fallback={fallbackMessage}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
};

export default withErrorBoundary; 