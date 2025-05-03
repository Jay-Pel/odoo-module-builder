import React, { useState, useEffect } from 'react';
import { useModuleSession } from '../../hooks/useModuleSession';

const RequirementsStep = () => {
  const { activeSession, update, setStep } = useModuleSession();
  const [formData, setFormData] = useState({
    moduleName: '',
    description: '',
    version: '16.0.1.0.0',
    category: '',
    author: '',
    website: '',
    license: 'LGPL-3',
    depends: '',
  });

  useEffect(() => {
    if (activeSession?.currentModule?.requirements) {
      setFormData(activeSession.currentModule.requirements);
    }
  }, [activeSession]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    update({ requirements: formData });
    setStep('specification');
  };

  const saveAndContinueLater = () => {
    update({ requirements: formData });
    // Save progress and redirect to dashboard or home
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Module Requirements</h2>
      <p className="mb-6 text-gray-600">Follow the steps below to generate your custom Odoo module.</p>
      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Module Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="moduleName"
            value={formData.moduleName}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            placeholder="e.g., sale_custom"
          />
          <p className="mt-2 text-sm text-gray-500 flex items-center">
            <svg className="h-4 w-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
            Use lowercase letters and underscores only
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            placeholder="Describe the main purpose of your module"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Version <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="version"
              value={formData.version}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder="e.g., Sales"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Author
            </label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              License <span className="text-red-500">*</span>
            </label>
            <select
              name="license"
              value={formData.license}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm bg-white"
            >
              <option value="LGPL-3">LGPL-3</option>
              <option value="GPL-3">GPL-3</option>
              <option value="MIT">MIT</option>
              <option value="OPL-1">OPL-1</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dependencies
            </label>
            <input
              type="text"
              name="depends"
              value={formData.depends}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder="base,sale,stock"
            />
            <p className="mt-2 text-sm text-gray-500 flex items-center">
              <svg className="h-4 w-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
              Comma-separated list of module dependencies
            </p>
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
          <button
            type="button"
            onClick={saveAndContinueLater}
            className="px-5 py-2.5 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 shadow-sm font-medium text-sm"
          >
            Save & Continue Later
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm font-medium text-sm flex items-center"
          >
            Next Step
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </form>
      
      <div className="fixed bottom-4 right-4">
        <button className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default RequirementsStep; 