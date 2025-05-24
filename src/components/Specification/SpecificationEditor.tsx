'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Button } from '@/components/UI/Button'
import { Input } from '@/components/UI/Input'
import { Badge, useToast } from '@/components/UI'
import { 
  Edit3, 
  Eye, 
  Save, 
  Undo, 
  RefreshCw, 
  Download, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Split,
  Maximize,
  MessageSquare,
  Send
} from 'lucide-react'

interface SpecificationData {
  id: string
  markdown: string
  timestamp: string
  version: number
}

interface SpecificationEditorProps {
  specification: SpecificationData
  onSave?: (updatedSpec: SpecificationData) => void
  onApprove?: () => void
  onBack?: () => void
}

type ViewMode = 'edit' | 'preview' | 'split'

export default function SpecificationEditor({ 
  specification, 
  onSave, 
  onApprove, 
  onBack 
}: SpecificationEditorProps) {
  const [currentMarkdown, setCurrentMarkdown] = useState(specification.markdown)
  const [originalMarkdown] = useState(specification.markdown)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [isModifying, setIsModifying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [modificationPrompt, setModificationPrompt] = useState('')
  const [showModificationDialog, setShowModificationDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { showSuccess, showError } = useToast()

  // Check for unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(currentMarkdown !== specification.markdown)
  }, [currentMarkdown, specification.markdown])

  const handleSave = async () => {
    if (!hasUnsavedChanges) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/specification/${specification.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: currentMarkdown
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save specification')
      }

      const result = await response.json()
      
      showSuccess('Your changes have been saved successfully.', 'Specification Saved')

      if (onSave) {
        onSave(result.data)
      }

    } catch (error: any) {
      console.error('Save error:', error)
      showError({
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Failed to save the specification.',
        timestamp: new Date()
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleModificationRequest = async () => {
    if (!modificationPrompt.trim()) {
      showError({
        code: 'VALIDATION_ERROR',
        message: 'Please describe what changes you want to make.',
        timestamp: new Date()
      })
      return
    }

    setIsModifying(true)
    try {
      const response = await fetch('/api/modify-specification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          specificationId: specification.id,
          modificationPrompt: modificationPrompt.trim(),
          currentMarkdown: currentMarkdown
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to modify specification')
      }

      const result = await response.json()
      
      setCurrentMarkdown(result.data.markdown)
      setModificationPrompt('')
      setShowModificationDialog(false)
      
      showSuccess('The AI has updated your specification based on your request.', 'Specification Modified')

      if (onSave) {
        onSave(result.data)
      }

    } catch (error: any) {
      console.error('Modification error:', error)
      showError({
        code: 'GENERATION_ERROR',
        message: error.message || 'Failed to modify the specification.',
        timestamp: new Date()
      })
    } finally {
      setIsModifying(false)
    }
  }

  const handleDiscard = () => {
    setCurrentMarkdown(originalMarkdown)
    showSuccess('Your changes have been reverted.', 'Changes Discarded')
  }

  const handleDownload = () => {
    const blob = new Blob([currentMarkdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${specification.id}_v${specification.version}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showSuccess('Specification downloaded successfully.', 'Downloaded')
  }

  const renderMarkdownPreview = (markdown: string) => {
    // Simple markdown to HTML conversion for preview
    const htmlContent = markdown
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-4 text-white">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-3 text-white/90">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium mb-2 text-white/80">$1</h3>')
      .replace(/^\*\* (.*$)/gm, '<h4 class="text-lg font-medium mb-2 text-white/70">$1</h4>')
      .replace(/^\* (.*$)/gm, '<li class="ml-4 text-white/70">• $1</li>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 text-white/70">• $1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-white/80">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded text-blue-300 text-sm">$1</code>')
      .replace(/\n\n/g, '</p><p class="mb-4 text-white/70">')
      .replace(/^\n/g, '<p class="mb-4 text-white/70">')
      
    return `<div class="prose prose-invert max-w-none"><p class="mb-4 text-white/70">${htmlContent}</p></div>`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Card variant="glass" className="backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Specification Editor</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-white/70 border-white/20">
                      Version {specification.version}
                    </Badge>
                    <Badge variant="outline" className="text-white/70 border-white/20">
                      {new Date(specification.timestamp).toLocaleDateString()}
                    </Badge>
                    {hasUnsavedChanges && (
                      <Badge variant="default" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                        Unsaved Changes
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex bg-white/10 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('edit')}
                      className={`p-2 rounded ${viewMode === 'edit' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('split')}
                      className={`p-2 rounded ${viewMode === 'split' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
                    >
                      <Split className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`p-2 rounded ${viewMode === 'preview' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowModificationDialog(true)}
                    className="text-white/80 hover:text-white"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Request AI Modification
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="text-white/80 hover:text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>

                  {hasUnsavedChanges && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDiscard}
                        className="text-white/80 hover:text-white"
                      >
                        <Undo className="h-4 w-4 mr-2" />
                        Discard
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Editor Content */}
        <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'} h-[calc(100vh-200px)]`}>
          {/* Editor */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <Card variant="glass" className="backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white text-lg">Markdown Editor</CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                <textarea
                  value={currentMarkdown}
                  onChange={(e) => setCurrentMarkdown(e.target.value)}
                  className="w-full h-full p-4 bg-transparent border-0 text-white placeholder:text-white/50 focus:outline-none resize-none font-mono text-sm leading-relaxed"
                  placeholder="Write your specification in markdown..."
                />
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <Card variant="glass" className="backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white text-lg">Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="h-full overflow-auto">
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(currentMarkdown) }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 flex justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-white/80 hover:text-white"
          >
            Back to Requirements
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowModificationDialog(true)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Request Changes
            </Button>
            <Button
              variant="glow"
              onClick={onApprove}
              className="group"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve & Continue
            </Button>
          </div>
        </div>
      </div>

      {/* Modification Dialog */}
      <AnimatePresence>
        {showModificationDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
            >
              <Card variant="glass" className="backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Request AI Modification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-white/80 text-sm block mb-2">
                      Describe the changes you want to make:
                    </label>
                    <textarea
                      value={modificationPrompt}
                      onChange={(e) => setModificationPrompt(e.target.value)}
                      placeholder="e.g., Add more details about user permissions, include mobile app requirements..."
                      rows={4}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowModificationDialog(false)
                        setModificationPrompt('')
                      }}
                      className="text-white/80 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleModificationRequest}
                      disabled={isModifying || !modificationPrompt.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isModifying ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {isModifying ? 'Processing...' : 'Apply Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 