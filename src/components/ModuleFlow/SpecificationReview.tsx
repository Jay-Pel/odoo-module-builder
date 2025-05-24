'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { CheckCircle, Edit3, MessageSquare, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react'
import { SpecificationResponse } from '@/services/specificationAdapter'
import MarkdownEditor from '@/components/Common/MarkdownEditor'
import WaveLoadingAnimation from '@/components/Common/WaveLoadingAnimation'

interface SpecificationReviewProps {
  specification: SpecificationResponse
  loading?: boolean
  onApprove: () => void
  onRequestChanges: (feedback: string, editedSpec?: string) => void
  onBack: () => void
}

export default function SpecificationReview({
  specification,
  loading = false,
  onApprove,
  onRequestChanges,
  onBack
}: SpecificationReviewProps) {
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [editedSpecification, setEditedSpecification] = useState(specification.specification)
  const changeCount = (specification.metadata?.version || 1) - 1
  const maxChanges = 5

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return
    
    setSubmittingFeedback(true)
    await onRequestChanges(feedback, editedSpecification)
    setSubmittingFeedback(false)
    setFeedback('')
    setShowFeedback(false)
  }

  // Update edited specification when props change and reset it fully
  React.useEffect(() => {
    setEditedSpecification(specification.specification)
    console.log('Specification updated, new version:', specification.metadata?.version)
  }, [specification.specification, specification.metadata?.version])

  if (loading || submittingFeedback) {
    const title = submittingFeedback ? "Processing Changes" : "Generating Module Specification"
    const subtitle = submittingFeedback ? "Updating specification based on your feedback..." : "Our AI is analyzing your requirements..."
    
    return <WaveLoadingAnimation title={title} subtitle={subtitle} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-3">
              Review Your Module Specification
            </h1>
            <p className="text-lg text-white/70">
              Please review the generated specification and let us know if any changes are needed
            </p>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Specification Content - Takes up more space */}
            <div className="xl:col-span-3">
              <Card variant="glass" className="h-full">
                <CardContent className="p-4">
                  <MarkdownEditor
                    key={`spec-${specification.specificationId}-v${specification.metadata?.version || 1}`}
                    content={editedSpecification}
                    onChange={setEditedSpecification}
                    readOnly={false}
                    className="h-full"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Actions Panel - Smaller, more compact */}
            <div className="xl:col-span-1 space-y-4">
              {/* Status Card */}
              <Card variant="glass">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white font-medium text-sm">Specification Ready</span>
                  </div>
                  <p className="text-white/70 text-xs">
                    Review the specification and choose to approve or request changes.
                  </p>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card variant="glass">
                <CardContent className="p-4 space-y-3">
                  <Button
                    variant="glow"
                    className="w-full group"
                    onClick={onApprove}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve & Generate Code
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={() => setShowFeedback(true)}
                    disabled={changeCount >= maxChanges}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Request Changes ({changeCount}/{maxChanges})
                  </Button>

                  {changeCount >= maxChanges && (
                    <div className="flex items-start space-x-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                      <AlertTriangle className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-yellow-200 text-xs">
                        You've reached the maximum number of change requests. Please approve the current specification or start over.
                      </p>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full text-white/80 hover:text-white hover:bg-white/10"
                    onClick={onBack}
                  >
                    Back to Requirements
                  </Button>
                </CardContent>
              </Card>

              {/* Feedback Form */}
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">
                        What changes would you like?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Describe the changes you'd like to see in the specification..."
                        rows={4}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="glow"
                          size="sm"
                          onClick={handleSubmitFeedback}
                          disabled={!feedback.trim()}
                          className="flex-1"
                        >
                          Submit Feedback
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowFeedback(false)
                            setFeedback('')
                          }}
                          className="text-white/80 hover:text-white hover:bg-white/10"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Info Card */}
              <Card variant="glass">
                <CardContent className="p-4">
                  <h4 className="text-white font-medium mb-2 text-sm">💡 Review Tips</h4>
                  <ul className="text-white/70 text-xs space-y-1">
                    <li>• Check if all requirements are included</li>
                    <li>• Verify field names and types</li>
                    <li>• Review user stories and workflows</li>
                    <li>• Confirm access rights and permissions</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 