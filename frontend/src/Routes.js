import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';
import withErrorBoundary from './components/Common/withErrorBoundary.jsx';

// Import pages
import Home from './pages/Home.js';
import CreateModule from './pages/CreateModule.js';
import Dashboard from './pages/Dashboard.js';
import ModuleDetails from './pages/ModuleDetails.js';

// Wrap each page component with error boundary
const SafeHome = withErrorBoundary(Home, 'Failed to load the home page. Please refresh.');
const SafeCreateModule = withErrorBoundary(CreateModule, 'Failed to load the module creation wizard. Please try again.');
const SafeDashboard = withErrorBoundary(Dashboard, 'Failed to load the dashboard. Please refresh.');
const SafeModuleDetails = withErrorBoundary(ModuleDetails, 'Failed to load module details. Please try again.');

const Routes = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<SafeHome />} />
      <Route path="/create-module" element={<SafeCreateModule />} />
      <Route path="/dashboard" element={<SafeDashboard />} />
      <Route path="/module/:id" element={<SafeModuleDetails />} />
    </RouterRoutes>
  );
};

export default Routes; 