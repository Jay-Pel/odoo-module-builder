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
  TestTube,
  ExternalLink
} from 'lucide-react'
import { CodingResponse } from '@/services/codingService'
import { useToast } from '@/components/UI/ToastProvider'

interface CodeGenerationProps {
  generationId: string
  initialResponse: CodingResponse
  onComplete: (response: CodingResponse) => void
  onRunTests: () => void
  onCheckStatus: (id: string) => Promise<CodingResponse>
}

interface FileTreeNode {
  name: string
  type: 'file' | 'directory'
  size?: number
  extension?: string
  modified?: string
  children?: FileTreeNode[]
}

interface FileTreeResponse {
  generationId: string
  moduleName: string
  odooVersion: string
  description: string
  createdAt: string
  fileCount: number
  totalSize: number
  tree: FileTreeNode
}

export default function CodeGeneration({
  generationId,
  initialResponse,
  onComplete,
  onRunTests,
  onCheckStatus
}: CodeGenerationProps) {
  const [response, setResponse] = useState<CodingResponse>(initialResponse)
  const [fileTree, setFileTree] = useState<FileTreeNode | null>(null)
  const [fileTreeData, setFileTreeData] = useState<FileTreeResponse | null>(null)
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [isPolling, setIsPolling] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    // If generation is completed, fetch the file tree
    if (response.success && response.data) {
      fetchFileTree()
    }
  }, [response])

  const fetchFileTree = async () => {
    try {
      const codingAgentUrl = process.env.NEXT_PUBLIC_CODING_AGENT_URL || 'http://localhost:3001'
      const response = await fetch(`${codingAgentUrl}/api/modules/${generationId}/tree`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch file tree')
      }
      
      const result = await response.json()
      if (result.success && result.data) {
        setFileTreeData(result.data)
        setFileTree(result.data.tree)
        // Expand root directory by default
        setExpandedFolders(new Set([result.data.tree.name]))
      }
    } catch (error) {
      console.error('Error fetching file tree:', error)
      showError({
        code: 'FETCH_ERROR',
        message: 'Failed to load file structure',
        timestamp: new Date()
      })
    }
  }

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFileTree = (node: FileTreeNode, path = ''): React.ReactNode => {
    const fullPath = path ? `${path}/${node.name}` : node.name
    const isExpanded = expandedFolders.has(fullPath)
    
    if (node.type === 'file') {
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
          <span className="text-sm">{node.name}</span>
          {node.size && (
            <span className="text-xs text-white/50 ml-auto">
              {formatFileSize(node.size)}
            </span>
          )}
        </motion.div>
      )
    } else {
      return (
        <div key={fullPath}>
          <div 
            className="flex items-center space-x-2 py-1 px-2 rounded cursor-pointer hover:bg-white/10 text-white/80"
            onClick={() => toggleFolder(fullPath)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Folder className="h-4 w-4" />
            <span className="text-sm font-medium">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div className="ml-4">
              {node.children.map(child => renderFileTree(child, fullPath))}
            </div>
          )}
        </div>
      )
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = async () => {
    try {
      const codingAgentUrl = process.env.NEXT_PUBLIC_CODING_AGENT_URL || 'http://localhost:3001'
      const downloadUrl = `${codingAgentUrl}/api/modules/${generationId}/download`
      
      // Open download in new window
      window.open(downloadUrl, '_blank')
      showSuccess('Download started! Check your downloads folder.')
    } catch (error) {
      console.error('Error downloading module:', error)
      showError({
        code: 'DOWNLOAD_ERROR',
        message: 'Failed to download module',
        timestamp: new Date()
      })
    }
  }

  const getStatusText = (): string => {
    if (!response.success) {
      return response.error || 'Generation failed'
    }
    return 'Code generation completed!'
  }

  const isCompleted = response.success && response.data

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

          {/* Status Card */}
          <Card variant="glass" className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  ) : (
                    <RefreshCw className="h-6 w-6 text-red-400" />
                  )}
                  <span className="text-white font-medium">{getStatusText()}</span>
                </div>
                <span className="text-white/70 text-sm">
                  {isCompleted ? '100%' : '0%'}
                </span>
              </div>
              
              <div className="w-full bg-white/10 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Module Info */}
              {response.data && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">Module:</span>
                    <p className="text-white font-medium">{response.data.moduleName}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Odoo Version:</span>
                    <p className="text-white font-medium">{response.data.odooVersion}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Files:</span>
                    <p className="text-white font-medium">{response.data.fileCount || fileTreeData?.fileCount || 0}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Size:</span>
                    <p className="text-white font-medium">
                      {response.data.totalSize ? formatFileSize(response.data.totalSize) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
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
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {fileTree ? (
                    renderFileTree(fileTree)
                  ) : isCompleted ? (
                    <div className="text-white/50 text-sm">Loading file structure...</div>
                  ) : (
                    <div className="text-white/50 text-sm">No files generated yet...</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* File Viewer / Info */}
            <Card variant="glass" className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <Code className="mr-2 h-5 w-5" />
                    Module Information
                  </div>
                  
                  <div className="flex space-x-2">
                    {isCompleted && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download ZIP
                        </Button>
                        
                        <Button
                          variant="glow"
                          size="sm"
                          onClick={onRunTests}
                        >
                          <TestTube className="mr-2 h-4 w-4" />
                          Run Tests
                        </Button>
                      </>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {response.data ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Module Description</h3>
                      <p className="text-white/80">{response.data.description}</p>
                    </div>
                    
                    {response.data.dependencies && response.data.dependencies.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Dependencies</h3>
                        <div className="flex flex-wrap gap-2">
                          {response.data.dependencies.map((dep, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm"
                            >
                              {dep}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {response.data.installationNotes && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Installation Notes</h3>
                        <div className="bg-black/30 rounded-lg p-4">
                          <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                            {response.data.installationNotes}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {response.data.usageInstructions && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Usage Instructions</h3>
                        <div className="bg-black/30 rounded-lg p-4">
                          <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                            {response.data.usageInstructions}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-black/30 rounded-lg p-4 h-96 flex items-center justify-center">
                    <div className="text-white/50 text-center">
                      <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                      <p>Generating module...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 