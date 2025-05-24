'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { 
  Code, 
  Download, 
  CheckCircle, 
  RefreshCw, 
  File, 
  Folder,
  ChevronRight,
  ChevronDown,
  TestTube
} from 'lucide-react'
import { CodingResponse } from '@/services/n8nService'

interface CodeGenerationProps {
  generationId: string
  initialResponse: CodingResponse
  onComplete: (response: CodingResponse) => void
  onRunTests: () => void
  onCheckStatus: (id: string) => Promise<CodingResponse>
}

interface FileTreeItem {
  name: string
  type: 'file' | 'folder'
  content?: string
  children?: FileTreeItem[]
  expanded?: boolean
}

export default function CodeGeneration({
  generationId,
  initialResponse,
  onComplete,
  onRunTests,
  onCheckStatus
}: CodeGenerationProps) {
  const [response, setResponse] = useState<CodingResponse>(initialResponse)
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([])
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    // Build file tree from response
    if (response.files) {
      setFileTree(buildFileTree(response.files))
      if (response.files.length > 0 && !selectedFile) {
        setSelectedFile(response.files[0].path)
      }
    }
  }, [response.files, selectedFile])

  useEffect(() => {
    // Poll for status updates if generation is in progress
    if (response.status === 'generating' || response.status === 'in_progress') {
      setIsPolling(true)
      const interval = setInterval(async () => {
        try {
          const statusResponse = await onCheckStatus(generationId)
          setResponse(statusResponse)
          
          if (statusResponse.status === 'completed' || statusResponse.status === 'error') {
            clearInterval(interval)
            setIsPolling(false)
            if (statusResponse.status === 'completed') {
              onComplete(statusResponse)
            }
          }
        } catch (error) {
          console.error('Error checking status:', error)
          clearInterval(interval)
          setIsPolling(false)
        }
      }, 3000)

      return () => {
        clearInterval(interval)
        setIsPolling(false)
      }
    }
  }, [generationId, response.status, onCheckStatus, onComplete])

  const buildFileTree = (files: Array<{ path: string; content: string }>): FileTreeItem[] => {
    const tree: FileTreeItem[] = []
    const pathMap = new Map<string, FileTreeItem>()

    files.forEach(file => {
      const parts = file.path.split('/')
      let currentPath = ''
      
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1
        currentPath = currentPath ? `${currentPath}/${part}` : part
        
        if (!pathMap.has(currentPath)) {
          const item: FileTreeItem = {
            name: part,
            type: isFile ? 'file' : 'folder',
            content: isFile ? file.content : undefined,
            children: isFile ? undefined : [],
            expanded: true
          }
          
          pathMap.set(currentPath, item)
          
          if (index === 0) {
            tree.push(item)
          } else {
            const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'))
            const parent = pathMap.get(parentPath)
            if (parent && parent.children) {
              parent.children.push(item)
            }
          }
        }
      })
    })

    return tree
  }

  const renderFileTree = (items: FileTreeItem[], prefix = ''): React.ReactNode => {
    return items.map((item, index) => {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name
      
      if (item.type === 'file') {
        return (
          <motion.div
            key={fullPath}
            className={`flex items-center space-x-2 py-1 px-2 rounded cursor-pointer hover:bg-white/10 ${
              selectedFile === fullPath ? 'bg-blue-500/20 text-blue-300' : 'text-white/80'
            }`}
            onClick={() => setSelectedFile(fullPath)}
            whileHover={{ x: 4 }}
          >
            <File className="h-4 w-4" />
            <span className="text-sm">{item.name}</span>
          </motion.div>
        )
      } else {
        return (
          <div key={fullPath}>
            <div 
              className="flex items-center space-x-2 py-1 px-2 rounded cursor-pointer hover:bg-white/10 text-white/80"
              onClick={() => {
                const updated = [...fileTree]
                // Toggle expanded state
                // This is a simplified implementation - you might want to use a more robust state management
              }}
            >
              {item.expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Folder className="h-4 w-4" />
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            {item.expanded && item.children && (
              <div className="ml-4">
                {renderFileTree(item.children, fullPath)}
              </div>
            )}
          </div>
        )
      }
    })
  }

  const getSelectedFileContent = (): string => {
    const file = response.files?.find(f => f.path === selectedFile)
    return file?.content || ''
  }

  const getProgress = (): number => {
    if (response.status === 'completed') return 100
    if (response.status === 'error') return 0
    return response.progress || 0
  }

  const getStatusText = (): string => {
    switch (response.status) {
      case 'generating':
      case 'in_progress':
        return 'Generating code...'
      case 'completed':
        return 'Code generation completed!'
      case 'error':
        return 'Generation failed'
      default:
        return 'Unknown status'
    }
  }

  const canDownload = response.status === 'completed' && response.files && response.files.length > 0

  const handleDownload = () => {
    if (!canDownload) return

    // Create a simple download of all files as a JSON
    const blob = new Blob([JSON.stringify(response.files, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `odoo-module-${generationId}.json`
    a.click()
    URL.revokeObjectURL(url)
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
              Code Generation
            </h1>
            <p className="text-xl text-white/70">
              {getStatusText()}
            </p>
          </div>

          {/* Progress Card */}
          <Card variant="glass" className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {response.status === 'completed' ? (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  ) : response.status === 'error' ? (
                    <RefreshCw className="h-6 w-6 text-red-400" />
                  ) : (
                    <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
                  )}
                  <span className="text-white font-medium">{getStatusText()}</span>
                </div>
                <span className="text-white/70 text-sm">{getProgress()}%</span>
              </div>
              
              <div className="w-full bg-white/10 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgress()}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* File Tree */}
            <Card variant="glass" className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Folder className="mr-2 h-5 w-5" />
                  Project Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {fileTree.length > 0 ? (
                    renderFileTree(fileTree)
                  ) : (
                    <p className="text-white/50 text-sm">No files generated yet...</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Code Viewer */}
            <Card variant="glass" className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <Code className="mr-2 h-5 w-5" />
                    {selectedFile || 'Select a file'}
                  </div>
                  
                  <div className="flex space-x-2">
                    {canDownload && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    )}
                    
                    {response.status === 'completed' && (
                      <Button
                        variant="glow"
                        size="sm"
                        onClick={onRunTests}
                      >
                        <TestTube className="mr-2 h-4 w-4" />
                        Run Tests
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/30 rounded-lg p-4 h-96 overflow-auto">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                    {selectedFile ? getSelectedFileContent() : 'Select a file to view its content'}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 