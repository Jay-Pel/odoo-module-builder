import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './styles/index.css';

// Render the app
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);