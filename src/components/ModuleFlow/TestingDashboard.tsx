'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Monitor,
  MessageSquare,
  Upload,
  Send
} from 'lucide-react'
import { TestingResponse, UserTestingResponse } from '@/services/n8nService'

interface TestingDashboardProps {
  testingResponse?: TestingResponse
  userTestingResponse?: UserTestingResponse
  onRunAutomatedTests: () => void
  onInitializeUserTesting: () => void
  onSubmitUserFeedback: (feedback: string, images?: File[]) => void
  loading?: boolean
}

export default function TestingDashboard({
  testingResponse,
  userTestingResponse,
  onRunAutomatedTests,
  onInitializeUserTesting,
  onSubmitUserFeedback,
  loading = false
}: TestingDashboardProps) {
  const [userFeedback, setUserFeedback] = useState('')
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedImages(prev => [...prev, ...files])
  }

  const handleSubmitFeedback = async () => {
    if (!userFeedback.trim()) return
    
    setSubmittingFeedback(true)
    await onSubmitUserFeedback(userFeedback, uploadedImages)
    setSubmittingFeedback(false)
    setUserFeedback('')
    setUploadedImages([])
  }

  const getTestStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-5 w-5 text-green-400" />
    ) : (
      <XCircle className="h-5 w-5 text-red-400" />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Module Testing
            </h1>
            <p className="text-xl text-white/70">
              Run automated tests and perform manual testing on your generated module
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Automated Testing */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TestTube className="mr-2 h-5 w-5" />
                  Automated Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!testingResponse ? (
                  <div className="text-center py-8">
                    <TestTube className="h-12 w-12 text-white/50 mx-auto mb-4" />
                    <p className="text-white/70 mb-4">
                      Run automated tests to verify module functionality
                    </p>
                    <Button
                      variant="glow"
                      onClick={onRunAutomatedTests}
                      loading={loading}
                      className="w-full"
                    >
                      Run Automated Tests
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Test Results Summary */}
                    <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTestStatusIcon(testingResponse.testResults.passed)}
                        <span className="text-white font-medium">
                          {testingResponse.testResults.passed ? 'All Tests Passed' : 'Tests Failed'}
                        </span>
                      </div>
                      <span className="text-white/70 text-sm">{testingResponse.status}</span>
                    </div>

                    {/* Errors */}
                    {testingResponse.testResults.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-white font-medium flex items-center">
                          <AlertTriangle className="mr-2 h-4 w-4 text-yellow-400" />
                          Errors Found
                        </h4>
                        <div className="space-y-2">
                          {testingResponse.testResults.errors.map((error, index) => (
                            <div key={index} className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                              <p className="text-red-300 text-sm">{error}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fixes Applied */}
                    {testingResponse.testResults.fixes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-white font-medium flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                          Fixes Applied
                        </h4>
                        <div className="space-y-2">
                          {testingResponse.testResults.fixes.map((fix, index) => (
                            <div key={index} className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                              <p className="text-green-300 text-sm">{fix}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Screenshots */}
                    {testingResponse.screenshots.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-white font-medium">Test Screenshots</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {testingResponse.screenshots.map((screenshot, index) => (
                            <img
                              key={index}
                              src={screenshot}
                              alt={`Test screenshot ${index + 1}`}
                              className="rounded-lg border border-white/20"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      onClick={onRunAutomatedTests}
                      className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Re-run Tests
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Testing */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Monitor className="mr-2 h-5 w-5" />
                  Manual Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!userTestingResponse ? (
                  <div className="text-center py-8">
                    <Monitor className="h-12 w-12 text-white/50 mx-auto mb-4" />
                    <p className="text-white/70 mb-4">
                      Test your module in a live Odoo environment
                    </p>
                    <Button
                      variant="glow"
                      onClick={onInitializeUserTesting}
                      className="w-full"
                    >
                      Start Manual Testing
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Odoo Instance Iframe */}
                    <div className="aspect-video bg-black/30 rounded-lg overflow-hidden">
                      <iframe
                        src={userTestingResponse.iframeUrl}
                        className="w-full h-full border-0"
                        title="Odoo Testing Environment"
                      />
                    </div>

                    {/* Feedback Form */}
                    <div className="space-y-4">
                      <h4 className="text-white font-medium flex items-center">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Provide Feedback
                      </h4>
                      
                      <textarea
                        value={userFeedback}
                        onChange={(e) => setUserFeedback(e.target.value)}
                        placeholder="Describe any issues or improvements you noticed during testing..."
                        rows={4}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />

                      {/* Image Upload */}
                      <div className="space-y-2">
                        <label className="block text-white/80 text-sm font-medium">
                          Upload Screenshots (optional)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
                          >
                            <Upload className="h-4 w-4 text-white" />
                            <span className="text-white text-sm">Choose Images</span>
                          </label>
                          {uploadedImages.length > 0 && (
                            <span className="text-white/70 text-sm">
                              {uploadedImages.length} image(s) selected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Uploaded Images Preview */}
                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {uploadedImages.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-16 object-cover rounded border border-white/20"
                              />
                              <button
                                onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                                className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        variant="glow"
                        onClick={handleSubmitFeedback}
                        disabled={!userFeedback.trim()}
                        loading={submittingFeedback}
                        className="w-full"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Submit Feedback
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <Card variant="glass" className="mt-6">
            <CardContent className="p-6">
              <h3 className="text-white font-medium mb-4">Testing Guidelines</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/70 text-sm">
                <div>
                  <h4 className="text-white font-medium mb-2">Automated Testing</h4>
                  <ul className="space-y-1">
                    <li>• Backend functionality verification</li>
                    <li>• Database model validation</li>
                    <li>• View rendering checks</li>
                    <li>• Security and permissions testing</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">Manual Testing</h4>
                  <ul className="space-y-1">
                    <li>• Test all user workflows</li>
                    <li>• Verify UI components and layouts</li>
                    <li>• Check data input and validation</li>
                    <li>• Test edge cases and error handling</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 