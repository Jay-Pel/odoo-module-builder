import React, { useState, useEffect, useRef } from 'react';
import { Clock, ExternalLink, Settings, MessageSquare, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const UATInterface = ({ 
  projectId, 
  sessionId, 
  sessionData, 
  isActive = false,
  onComplete, 
  onError,
  onAdjustmentRequest 
}) => {
  const [uatSession, setUatSession] = useState(sessionData || null);
  const [sessionStatus, setSessionStatus] = useState(sessionData ? sessionData.status : 'initializing');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [adjustmentText, setAdjustmentText] = useState('');
  const [adjustmentPriority, setAdjustmentPriority] = useState('normal');
  const [adjustmentCount, setAdjustmentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(!sessionData);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (sessionData) {
      setUatSession(sessionData);
      setSessionStatus(sessionData.status);
      if (sessionData.status === 'active') {
        setIsLoading(false);
      } else {
        pollSessionStatus(sessionData.session_id);
      }
    } else if (isActive && projectId) {
      startUATSession();
    }
  }, [projectId, sessionData, isActive]);

  useEffect(() => {
    if (uatSession && sessionStatus === 'active') {
      const interval = setInterval(() => {
        checkSessionStatus();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [uatSession, sessionStatus]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const startUATSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/uat/start/${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start UAT session');
      }

      const data = await response.json();
      setUatSession(data);
      setSessionStatus(data.status);

      // Poll for session readiness
      pollSessionStatus(data.session_id);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      if (onError) {
        onError(err);
      }
    }
  };

  const pollSessionStatus = async (sessionId) => {
    try {
      const response = await fetch(`/api/uat/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get session status');
      }

      const data = await response.json();
      setUatSession(data);
      setSessionStatus(data.status);
      setTimeRemaining(data.time_remaining);

      if (data.status === 'active' && data.tunnel_url) {
        setIsLoading(false);
      } else if (data.status === 'initializing') {
        // Continue polling
        setTimeout(() => pollSessionStatus(sessionId), 5000);
      } else if (data.status === 'expired' || data.status === 'stopped') {
        setIsLoading(false);
        setError('UAT session has expired or been stopped');
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const checkSessionStatus = async () => {
    if (!uatSession) return;

    try {
      const response = await fetch(`/api/uat/session/${uatSession.session_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTimeRemaining(data.time_remaining);
        setSessionStatus(data.status);
      }
    } catch (err) {
      console.error('Error checking session status:', err);
    }
  };

  const extendSession = async () => {
    try {
      const response = await fetch(`/api/uat/extend/${uatSession.session_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        checkSessionStatus();
      }
    } catch (err) {
      console.error('Error extending session:', err);
    }
  };

  const stopSession = async () => {
    try {
      const response = await fetch(`/api/uat/stop/${uatSession.session_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setSessionStatus('stopped');
      }
    } catch (err) {
      console.error('Error stopping session:', err);
    }
  };

  const submitAdjustmentRequest = async () => {
    if (!adjustmentText.trim()) return;

    try {
      const response = await fetch(`/api/uat/request-adjustment/${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          adjustment_description: adjustmentText,
          priority: adjustmentPriority
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAdjustmentCount(prev => prev + 1);
        setAdjustmentText('');
        setShowAdjustmentForm(false);
        
        if (onAdjustmentRequest) {
          onAdjustmentRequest(data);
        }
      }
    } catch (err) {
      console.error('Error submitting adjustment request:', err);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (sessionStatus) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'initializing':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'expired':
      case 'stopped':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your UAT environment...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few minutes</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <XCircle className="w-6 h-6 text-red-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">UAT Session Error</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={startUATSession}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Status Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-medium text-gray-900">UAT Session</h3>
              <p className="text-sm text-gray-500 capitalize">{sessionStatus}</p>
            </div>
          </div>
          
          {sessionStatus === 'active' && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Time Remaining</p>
                <p className={`text-lg font-mono ${timeRemaining < 600 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatTime(timeRemaining)}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={extendSession}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Extend +30min
                </button>
                <button
                  onClick={stopSession}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                >
                  Stop Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Odoo Environment */}
      {sessionStatus === 'active' && uatSession?.tunnel_url && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Your Odoo Environment</h3>
            <div className="flex space-x-2">
              <a
                href={uatSession.tunnel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">Open in New Tab</span>
              </a>
            </div>
          </div>
          
          <div className="relative">
            <iframe
              ref={iframeRef}
              src={uatSession.tunnel_url}
              className="w-full h-96 border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              title="Odoo UAT Environment"
            />
          </div>
        </div>
      )}

      {/* Adjustment Request Section */}
      {sessionStatus === 'active' && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Request Adjustments</h3>
              <p className="text-sm text-gray-500">
                You can request up to 5 adjustments to your module
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Adjustments Used</p>
              <p className="text-lg font-medium text-gray-900">{adjustmentCount}/5</p>
            </div>
          </div>

          {!showAdjustmentForm ? (
            <button
              onClick={() => setShowAdjustmentForm(true)}
              disabled={adjustmentCount >= 5}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                adjustmentCount >= 5
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Request Adjustment</span>
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the changes you need
                </label>
                <textarea
                  value={adjustmentText}
                  onChange={(e) => setAdjustmentText(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Please describe what you'd like to change about the module..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={adjustmentPriority}
                  onChange={(e) => setAdjustmentPriority(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={submitAdjustmentRequest}
                  disabled={!adjustmentText.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Submit Request
                </button>
                <button
                  onClick={() => {
                    setShowAdjustmentForm(false);
                    setAdjustmentText('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete UAT Button */}
      {sessionStatus === 'active' && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Complete Testing</h3>
              <p className="text-sm text-gray-500">
                When you're satisfied with the module, proceed to payment
              </p>
            </div>
            <button
              onClick={onComplete}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              Complete UAT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UATInterface; 