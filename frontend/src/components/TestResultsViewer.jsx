import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Play,
  Download,
  RefreshCw,
  Eye,
  Image,
  FileText
} from 'lucide-react';

const TestResultsViewer = ({ projectId, sessionId, onRetryTest }) => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTestCase, setSelectedTestCase] = useState(null);

  useEffect(() => {
    fetchTestResults();
  }, [projectId, sessionId]);

  const fetchTestResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/testing/results/${projectId}${sessionId ? `?session_id=${sessionId}` : ''}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch test results');
      }
      
      const data = await response.json();
      setTestResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'skipped':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'skipped':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (duration) => {
    if (duration < 1) {
      return `${(duration * 1000).toFixed(0)}ms`;
    }
    return `${duration.toFixed(2)}s`;
  };

  const downloadTestReport = async () => {
    try {
      const response = await fetch(`/api/testing/report/${projectId}/${sessionId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-report-${projectId}-${sessionId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
        <span>Loading test results...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Test Results</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchTestResults}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!testResults || !testResults.results) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <h3 className="text-lg font-medium text-gray-700">No Test Results Available</h3>
        <p className="text-gray-500">Test results will appear here once testing is completed.</p>
      </div>
    );
  }

  const { results } = testResults;
  const successRate = results.total_tests > 0 ? (results.passed_tests / results.total_tests * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Test Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Test Results Summary</h2>
          <div className="flex space-x-2">
            <button
              onClick={downloadTestReport}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              Download Report
            </button>
            <button
              onClick={onRetryTest}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry Tests
            </button>
          </div>
        </div>

        {/* Overall Status */}
        <div className={`p-4 rounded-lg border ${results.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center">
            {results.success ? (
              <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500 mr-3" />
            )}
            <div>
              <h3 className={`font-medium ${results.success ? 'text-green-800' : 'text-red-800'}`}>
                {results.success ? 'All Tests Passed' : 'Some Tests Failed'}
              </h3>
              <p className={`text-sm ${results.success ? 'text-green-600' : 'text-red-600'}`}>
                {results.passed_tests} of {results.total_tests} tests passed ({successRate}% success rate)
              </p>
            </div>
          </div>
        </div>

        {/* Test Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-gray-900">{results.total_tests}</div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">{results.passed_tests}</div>
            <div className="text-sm text-gray-600">Passed</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">{results.failed_tests}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded">
            <div className="text-2xl font-bold text-yellow-600">{results.skipped_tests}</div>
            <div className="text-sm text-gray-600">Skipped</div>
          </div>
        </div>

        {/* Duration */}
        <div className="mt-4 text-sm text-gray-600">
          <Clock className="w-4 h-4 inline mr-1" />
          Total duration: {formatDuration(results.total_duration)}
        </div>
      </div>

      {/* Individual Test Cases */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Test Cases</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {results.test_cases && results.test_cases.map((testCase, index) => (
            <div key={index} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(testCase.status)}
                  <div>
                    <h4 className="font-medium text-gray-900">{testCase.name}</h4>
                    <p className="text-sm text-gray-600">
                      Duration: {formatDuration(testCase.duration)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(testCase.status)}`}>
                    {testCase.status.toUpperCase()}
                  </span>
                  
                  {testCase.screenshot_path && (
                    <button
                      onClick={() => setSelectedTestCase(testCase)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="View screenshot"
                    >
                      <Image className="w-4 h-4" />
                    </button>
                  )}
                  
                  {testCase.error_message && (
                    <button
                      onClick={() => setSelectedTestCase(testCase)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {testCase.error_message && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800 font-mono">
                    {testCase.error_message}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Test Case Detail Modal */}
      {selectedTestCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{selectedTestCase.name}</h3>
                <button
                  onClick={() => setSelectedTestCase(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-auto max-h-[70vh]">
              {selectedTestCase.error_message && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Error Details</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {selectedTestCase.error_message}
                  </pre>
                </div>
              )}
              
              {selectedTestCase.screenshot_path && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Screenshot</h4>
                  <img
                    src={`/api/testing/artifacts/${testResults.session_id}/${selectedTestCase.screenshot_path}`}
                    alt="Test screenshot"
                    className="max-w-full border border-gray-200 rounded"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResultsViewer; 