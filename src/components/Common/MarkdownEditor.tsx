'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/UI/Button'
import { Edit3, Eye, Save, X } from 'lucide-react'

interface MarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  readOnly?: boolean
  className?: string
}

export default function MarkdownEditor({
  content,
  onChange,
  readOnly = false,
  className = ''
}: MarkdownEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingContent, setEditingContent] = useState(content)

  // Update editing content when props change
  React.useEffect(() => {
    setEditingContent(content)
  }, [content])

  const handleSave = useCallback(() => {
    onChange(editingContent)
    setIsEditing(false)
  }, [editingContent, onChange])

  const handleCancel = useCallback(() => {
    setEditingContent(content)
    setIsEditing(false)
  }, [content])

  // Simple markdown to HTML conversion
  const formatMarkdown = useMemo(() => {
    let html = content
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-white mb-3 mt-6">$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-white mb-4 mt-8">$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-white mb-6 mt-8">$1</h1>')
    
    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-blue-300">$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-purple-300">$1</em>')
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-green-300 text-sm">$1</code></pre>')
    html = html.replace(/`(.*?)`/g, '<code class="bg-gray-700 px-2 py-1 rounded text-green-300 text-sm">$1</code>')
    
    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li class="text-white/90 mb-2 ml-4">• $1</li>')
    html = html.replace(/^- (.*$)/gim, '<li class="text-white/90 mb-2 ml-4">• $1</li>')
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="text-white/90 mb-2 ml-4 list-decimal">$1</li>')
    
    // Wrap consecutive list items in ul
    html = html.replace(/(<li class="text-white\/90 mb-2 ml-4">.*?<\/li>\s*)+/g, '<ul class="space-y-1 mb-4">$&</ul>')
    
    // Paragraphs
    html = html.replace(/^(?!<[h|u|p|l])(.*$)/gim, '<p class="text-white/80 mb-4 leading-relaxed">$1</p>')
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Clean up empty paragraphs
    html = html.replace(/<p class="text-white\/80 mb-4 leading-relaxed"><\/p>/g, '')
    
    return html
  }, [content])

  if (isEditing) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white flex items-center">
            <Edit3 className="mr-2 h-5 w-5" />
            Editing Specification
          </h4>
          <div className="flex space-x-2">
            <Button
              variant="glow"
              size="sm"
              onClick={handleSave}
              className="flex items-center"
            >
              <Save className="mr-1 h-4 w-4" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            className="w-full p-4 rounded-lg bg-gray-800/50 border border-gray-600 text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your markdown content..."
            spellCheck={false}
            style={{
              minHeight: '500px',
              maxHeight: '70vh'
            }}
          />
          <p className="text-xs text-white/60 mt-2">
            You can use markdown syntax: **bold**, *italic*, `code`, ### headers, - lists, etc.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white flex items-center">
          <Eye className="mr-2 h-5 w-5" />
          Module Specification
        </h4>
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Edit3 className="mr-1 h-4 w-4" />
            Edit
          </Button>
        )}
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="prose prose-invert max-w-none bg-gray-800/30 rounded-lg p-6 border border-gray-700"
        dangerouslySetInnerHTML={{ __html: formatMarkdown }}
        style={{
          fontSize: '15px',
          lineHeight: '1.6',
          minHeight: '500px',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}
      />
    </div>
  )
} 