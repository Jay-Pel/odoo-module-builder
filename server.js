const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;
const FLASK_BACKEND_URL = 'http://localhost:5000';

// Enable JSON body parsing
app.use(bodyParser.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Include test script for running scenarios
app.get('/test-scenario.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'test/test-scenario.js'));
});

// Proxy API requests to the Flask backend
app.use('/api', createProxyMiddleware({
  target: FLASK_BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api' // Keep the /api prefix
  },
  logLevel: 'debug',
  // Increase timeout values to handle long-running LLM requests (5 minutes)
  timeout: 300000,
  proxyTimeout: 300000,
  onProxyReq: (proxyReq, req, res) => {
    // Log the proxied request for debugging
    console.log(`Proxying request to: ${req.method} ${FLASK_BACKEND_URL}${req.url}`);
    
    // Add a content-length header for POST requests
    if (req.method === 'POST' && req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({
      error: 'API Gateway Error: The backend service is taking too long to respond or is unavailable.',
      details: err.message,
      retry: true
    });
  }
}));

// For all other non-API requests, send the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Odoo Module Builder server running on http://localhost:${PORT}`);
  console.log(`Proxying API requests to Flask backend at ${FLASK_BACKEND_URL}`);
});
