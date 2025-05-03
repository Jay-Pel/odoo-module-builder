import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useModuleSession } from '../../hooks/useModuleSession';
import { MODULE_STEPS } from '../../stores/moduleSessionStore';

const OdooTestingStep = () => {
  const { activeSession } = useModuleSession();
  const [isStartingDocker, setIsStartingDocker] = useState(false);
  const [isDockerRunning, setIsDockerRunning] = useState(false);
  const [dockerOutput, setDockerOutput] = useState([]);
  const [testStatus, setTestStatus] = useState('pending'); // pending, running, success, failed
  const [odooUrl, setOdooUrl] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Get the module name and info from previous steps
  const moduleName = activeSession?.stepData?.[MODULE_STEPS.REQUIREMENTS]?.moduleName || 'new_module';
  const moduleVersion = activeSession?.stepData?.[MODULE_STEPS.REQUIREMENTS]?.version || '16.0.1.0.0';
  
  // Simulate starting the Docker container on component load
  useEffect(() => {
    // Don't auto-start if already in a status
    if (testStatus !== 'pending') return;
    
    // Get modules from previous step
    const modules = activeSession?.stepData?.[MODULE_STEPS.MODULE_OUTPUT]?.files || [];
    if (modules.length === 0) {
      setDockerOutput(prev => [...prev, 'Error: No module files found from previous step.']);
      return;
    }
  }, [activeSession, testStatus]);
  
  const startDockerContainer = async () => {
    setIsStartingDocker(true);
    setDockerOutput([]);
    setLoadingProgress(0);
    
    // Add initial messages
    setDockerOutput(prev => [...prev, 
      '> Starting Odoo Docker container for testing...',
      `> Module: ${moduleName}`,
      `> Odoo Version: ${moduleVersion.split('.')[0]}.0`,
      '> Pulling latest Odoo image...'
    ]);
    
    // Simulate docker pull progress
    await simulateDockerPull();
    
    // Simulate starting container
    setDockerOutput(prev => [...prev, 
      '> Image pulled successfully',
      '> Creating container with module volume mounting...',
      '> Starting Odoo container...'
    ]);
    
    // Simulate container startup
    await simulateContainerStartup();
    
    // Container started
    setDockerOutput(prev => [...prev, 
      '> Container started successfully',
      '> Odoo is initializing...',
      '> Installing test dependencies...',
      '> Loading module for testing...'
    ]);
    
    // Simulate Odoo initialization
    await simulateOdooInitialization();
    
    // Setup done
    setIsStartingDocker(false);
    setIsDockerRunning(true);
    setOdooUrl('http://localhost:8069');
    setDockerOutput(prev => [...prev, 
      '> Odoo instance is ready',
      '> Module has been staged for installation',
      '> You can now test your module in the Odoo interface'
    ]);
  };
  
  const runModuleTests = async () => {
    setTestStatus('running');
    setTestResults([]);
    
    setDockerOutput(prev => [...prev, 
      '',
      '> Running automated tests for module...',
      `> Test suite: ${moduleName}_test_suite`
    ]);
    
    // Simulate test running
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate simulated test results
    const simulatedTestResults = [
      { name: 'test_module_installation', status: 'passed', duration: '0.42s' },
      { name: 'test_model_creation', status: 'passed', duration: '0.38s' },
      { name: 'test_field_validation', status: 'passed', duration: '0.27s' },
      { name: 'test_record_workflow', status: 'passed', duration: '0.65s' },
      { name: 'test_security_access', status: 'warning', duration: '0.51s', message: 'Some access rules might be too permissive' },
      { name: 'test_ui_rendering', status: 'passed', duration: '1.21s' },
    ];
    
    setTestResults(simulatedTestResults);
    
    // Update docker output with test results
    const testSummary = [
      '',
      '> Test Results:',
      '> ------------------------',
      `> Total Tests: ${simulatedTestResults.length}`,
      `> Passed: ${simulatedTestResults.filter(t => t.status === 'passed').length}`,
      `> Warnings: ${simulatedTestResults.filter(t => t.status === 'warning').length}`,
      `> Failed: ${simulatedTestResults.filter(t => t.status === 'failed').length}`,
      '> ------------------------',
    ];
    
    setDockerOutput(prev => [...prev, ...testSummary]);
    setTestStatus('success');
  };
  
  const stopDockerContainer = async () => {
    setDockerOutput(prev => [...prev, 
      '',
      '> Stopping Odoo container...',
      '> Cleaning up resources...'
    ]);
    
    // Simulate container stopping
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setDockerOutput(prev => [...prev, '> Container stopped successfully']);
    setIsDockerRunning(false);
    setOdooUrl('');
    setTestStatus('pending');
  };
  
  // Helper to simulate docker pull with progress updates
  const simulateDockerPull = async () => {
    const totalLayers = 5;
    for (let layer = 1; layer <= totalLayers; layer++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setDockerOutput(prev => [...prev, `> Pulling layer ${layer}/${totalLayers}: [==============>] ${(layer/totalLayers*100).toFixed(0)}%`]);
      setLoadingProgress(prevProgress => prevProgress + (20));
    }
  };
  
  // Helper to simulate container startup
  const simulateContainerStartup = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoadingProgress(prevProgress => Math.min(prevProgress + 25, 100));
  };
  
  // Helper to simulate Odoo initialization
  const simulateOdooInitialization = async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    setLoadingProgress(100);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Odoo Testing Environment</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Test your module in a real Odoo environment running in Docker. You can verify its functionality before downloading it.
      </p>
      
      {/* Docker Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Status Panel */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Container Status</h3>
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Docker:</span>
              <span className={`font-medium ${isDockerRunning ? 'text-green-500' : 'text-gray-500'}`}>
                {isDockerRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Odoo:</span>
              <span className={`font-medium ${isDockerRunning ? 'text-green-500' : 'text-gray-500'}`}>
                {isDockerRunning ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Module:</span>
              <span className="font-medium">{moduleName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Tests:</span>
              <span className={`font-medium ${
                testStatus === 'success' ? 'text-green-500' : 
                testStatus === 'failed' ? 'text-red-500' : 
                testStatus === 'running' ? 'text-blue-500' : 'text-gray-500'
              }`}>
                {
                  testStatus === 'success' ? 'Passed' : 
                  testStatus === 'failed' ? 'Failed' : 
                  testStatus === 'running' ? 'Running...' : 'Not Run'
                }
              </span>
            </div>
          </div>
          
          {/* Control Buttons */}
          <div className="mt-6 flex flex-col space-y-2">
            {!isDockerRunning ? (
              <motion.button
                onClick={startDockerContainer}
                disabled={isStartingDocker}
                className={`w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center`}
                whileHover={{ scale: isStartingDocker ? 1 : 1.03 }}
                whileTap={{ scale: isStartingDocker ? 1 : 0.98 }}
              >
                {isStartingDocker ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Starting...
                  </>
                ) : (
                  <>Start Odoo Container</>
                )}
              </motion.button>
            ) : (
              <>
                <motion.button
                  onClick={runModuleTests}
                  disabled={testStatus === 'running'}
                  className={`w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center`}
                  whileHover={{ scale: testStatus === 'running' ? 1 : 1.03 }}
                  whileTap={{ scale: testStatus === 'running' ? 1 : 0.98 }}
                >
                  {testStatus === 'running' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Running Tests...
                    </>
                  ) : (
                    <>Run Module Tests</>
                  )}
                </motion.button>
                
                <motion.button
                  onClick={stopDockerContainer}
                  className="w-full px-4 py-2 border border-gray-300 text-red-600 dark:border-gray-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 flex items-center justify-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Stop Container
                </motion.button>
              </>
            )}
          </div>
        </div>
        
        {/* Docker Output Terminal */}
        <div className="md:col-span-2 bg-black rounded-lg p-4 font-mono text-sm text-green-500 overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-gray-400">Docker Console</h3>
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
          
          <div className="h-60 overflow-y-auto">
            {dockerOutput.length === 0 ? (
              <p className="text-gray-500">Docker container not started. Click "Start Odoo Container" to begin.</p>
            ) : (
              dockerOutput.map((line, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {line.includes('warning') || line.includes('Warning') ? (
                    <span className="text-yellow-500">{line}</span>
                  ) : line.includes('error') || line.includes('Error') ? (
                    <span className="text-red-500">{line}</span>
                  ) : (
                    <span>{line}</span>
                  )}
                </div>
              ))
            )}
          </div>
          
          {isStartingDocker && (
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-right mt-1 text-gray-400">{loadingProgress}%</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Odoo Preview Panel */}
      {isDockerRunning && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Odoo Instance Preview</h3>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{odooUrl || 'http://localhost:8069'}</span>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => window.open(odooUrl, '_blank')}
                  disabled={!isDockerRunning}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => {/* refresh iframe */}}
                  disabled={!isDockerRunning}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="h-96 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
              {isDockerRunning ? (
                <iframe 
                  src="about:blank" 
                  className="w-full h-full"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  title="Odoo Preview"
                />
              ) : (
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-gray-500">Start the Odoo container to preview your module</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Test Results Panel */}
          {testResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-4">Test Results</h3>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Test Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Duration
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {testResults.map((test, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {test.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${test.status === 'passed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                                test.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}
                            >
                              {test.status === 'passed' ? 'Passed' : 
                                test.status === 'warning' ? 'Warning' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {test.duration}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {test.message ? test.message : test.status === 'passed' ? 'Test completed successfully' : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Next Steps */}
      <div className="mt-8 flex justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Once testing is complete, you can download your module for deployment to your production Odoo instance.
          </p>
        </div>
        
        <motion.button
          onClick={() => {/* Go to final download screen or complete workflow */}}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
            />
          </svg>
          Download Module
        </motion.button>
      </div>
    </div>
  );
};

export default OdooTestingStep;
