import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Download, Loader2, FileCode, Package, Upload } from 'lucide-react';

const CodeGenerationProgress = ({ projectId, onComplete, onError }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (projectId) {
      pollProgress();
    }
  }, [projectId]);

  const pollProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/coding/progress/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProgress(data);

      // Check if we need to continue polling
      const activeStatuses = [
        'generating_code', 
        'analyzing_specification', 
        'creating_zip', 
        'uploading'
      ];

      if (activeStatuses.includes(data.status)) {
        // Continue polling every 2 seconds
        setTimeout(pollProgress, 2000);
      } else if (data.status === 'code_generated') {
        onComplete && onComplete(data);
      } else if (data.status === 'code_generation_failed') {
        setError('Code generation failed. Please try again.');
        onError && onError('Code generation failed');
      }
      
    } catch (err) {
      console.error('Error polling progress:', err);
      setError('Failed to get generation progress');
      onError && onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    const statusConfig = {
      'analyzing_specification': {
        label: 'Analyzing Specification',
        icon: <FileCode className="w-4 h-4" />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100',
        description: 'AI is reading and understanding your requirements'
      },
      'generating_code': {
        label: 'Generating Code',
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        color: 'text-purple-500',
        bgColor: 'bg-purple-100',
        description: 'Creating Odoo module files with Claude AI'
      },
      'creating_zip': {
        label: 'Creating Package',
        icon: <Package className="w-4 h-4" />,
        color: 'text-orange-500',
        bgColor: 'bg-orange-100',
        description: 'Packaging module files into a downloadable archive'
      },
      'uploading': {
        label: 'Finalizing',
        icon: <Upload className="w-4 h-4" />,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-100',
        description: 'Saving module and calculating pricing'
      },
      'code_generated': {
        label: 'Code Generated Successfully',
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'text-green-500',
        bgColor: 'bg-green-100',
        description: 'Your Odoo module is ready for download'
      },
      'code_generation_failed': {
        label: 'Generation Failed',
        icon: <AlertCircle className="w-4 h-4" />,
        color: 'text-red-500',
        bgColor: 'bg-red-100',
        description: 'Something went wrong. Please try again.'
      }
    };

    return statusConfig[status] || {
      label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: <Clock className="w-4 h-4" />,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
      description: 'Processing...'
    };
  };

  const formatPrice = (priceInCents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };

  const calculateProgress = (status) => {
    const statusOrder = [
      'analyzing_specification',
      'generating_code',
      'creating_zip',
      'uploading',
      'code_generated'
    ];
    
    const currentIndex = statusOrder.indexOf(status);
    if (currentIndex === -1) return 0;
    
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  if (loading && !progress) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading progress...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center p-4 text-gray-500">
        No progress information available
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(progress.status);
  const progressPercentage = calculateProgress(progress.status);
  const isComplete = progress.status === 'code_generated';
  const isFailed = progress.status === 'code_generation_failed';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Code Generation Progress</h3>
        {isComplete && (
          <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
            Complete
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Overall Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isFailed ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Current Status */}
      <div className={`${statusDisplay.bgColor} rounded-lg p-4 mb-6`}>
        <div className="flex items-center">
          <div className={statusDisplay.color}>
            {statusDisplay.icon}
          </div>
          <div className="ml-3 flex-1">
            <h4 className={`font-medium ${statusDisplay.color}`}>
              {statusDisplay.label}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {statusDisplay.description}
            </p>
          </div>
        </div>
      </div>

      {/* Build Details */}
      {progress.current_version > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Build Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Version:</span>
              <span className="ml-2 font-medium">v{progress.current_version}</span>
            </div>
            <div>
              <span className="text-gray-500">Files:</span>
              <span className="ml-2 font-medium">{progress.files_count || 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Size:</span>
              <span className="ml-2 font-medium">
                {progress.build_size ? formatFileSize(progress.build_size) : 'Calculating...'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Price:</span>
              <span className="ml-2 font-medium">
                {progress.final_price ? formatPrice(progress.final_price) : 'Calculating...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isComplete && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Module ready for download and review
            </div>
            <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Download Module
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default CodeGenerationProgress; 