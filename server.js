const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Include test script for running scenarios
app.get('/test-scenario.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'test/test-scenario.js'));
});

// Add a simple API endpoint to simulate module generation
app.get('/api/generate-module', (req, res) => {
  // Simulate processing time
  setTimeout(() => {
    res.json({ success: true, message: 'Module generated successfully' });
  }, 2000);
});

// For all other requests, send the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Odoo Module Builder server running on http://localhost:${PORT}`);
});
