import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FileText, Database, Settings, Image, Code } from 'lucide-react';
import axios from 'axios';

const FileTreeViewer = ({ projectId, selectedVersion = null }) => {
  const [fileTree, setFileTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set([''])); // Root is expanded by default
  const [buildInfo, setBuildInfo] = useState(null);

  useEffect(() => {
    fetchFileTree();
  }, [projectId, selectedVersion]);

  const fetchFileTree = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const url = selectedVersion 
        ? `/coding/module-files/${projectId}?version=${selectedVersion}`
        : `/coding/module-files/${projectId}`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = response.data;
      setFileTree(buildFileTreeStructure(data.files));
      setBuildInfo(data.build_info);
      
    } catch (err) {
      console.error('Error fetching file tree:', err);
      setError('Failed to load module files');
    } finally {
      setLoading(false);
    }
  };

  const buildFileTreeStructure = (files) => {
    const tree = {};
    
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            type: index === parts.length - 1 ? 'file' : 'folder',
            path: parts.slice(0, index + 1).join('/'),
            size: index === parts.length - 1 ? file.size : 0,
            fileType: index === parts.length - 1 ? file.type : null,
            children: {}
          };
        }
        current = current[part].children;
      });
    });
    
    return convertToArray(tree);
  };

  const convertToArray = (tree) => {
    return Object.values(tree).map(node => ({
      ...node,
      children: node.type === 'folder' ? convertToArray(node.children) : []
    })).sort((a, b) => {
      // Folders first, then files, alphabetically
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (fileType, fileName) => {
    const size = 16;
    
    switch (fileType) {
      case 'python':
        return <Code size={size} className="text-blue-500" />;
      case 'xml':
        return <FileText size={size} className="text-green-500" />;
      case 'csv':
        return <Database size={size} className="text-orange-500" />;
      case 'javascript':
        return <Code size={size} className="text-yellow-500" />;
      case 'css':
        return <Settings size={size} className="text-purple-500" />;
      case 'image':
        return <Image size={size} className="text-pink-500" />;
      case 'markdown':
        return <FileText size={size} className="text-gray-500" />;
      default:
        return <File size={size} className="text-gray-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderTreeNode = (node, level = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const paddingLeft = level * 20 + 8;

    return (
      <div key={node.path} className="select-none">
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => node.type === 'folder' ? toggleFolder(node.path) : null}
        >
          {node.type === 'folder' ? (
            <>
              <div className="flex items-center mr-2">
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-400" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
              </div>
              {isExpanded ? (
                <FolderOpen size={16} className="text-blue-500 mr-2" />
              ) : (
                <Folder size={16} className="text-blue-500 mr-2" />
              )}
              <span className="font-medium text-gray-700">{node.name}</span>
            </>
          ) : (
            <>
              <div className="w-4 mr-2" /> {/* Spacer for alignment */}
              <div className="mr-2">
                {getFileIcon(node.fileType, node.name)}
              </div>
              <span className="text-gray-600 flex-1">{node.name}</span>
              <span className="text-xs text-gray-400 ml-2">
                {formatFileSize(node.size)}
              </span>
            </>
          )}
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading module files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 mb-2">⚠️ {error}</div>
        <button
          onClick={fetchFileTree}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (fileTree.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No module files found. Generate the module code first.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900">Module Files</h3>
        {buildInfo && (
          <div className="mt-2 text-sm text-gray-500">
            <div className="flex items-center justify-between">
              <span>Created: {new Date(buildInfo.created_at).toLocaleDateString()}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                buildInfo.status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {buildInfo.status}
              </span>
            </div>
            <div className="mt-1">
              Total size: {formatFileSize(buildInfo.size)}
            </div>
          </div>
        )}
      </div>

      {/* File Tree */}
      <div className="max-h-96 overflow-y-auto">
        {fileTree.map(node => renderTreeNode(node))}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50 text-xs text-gray-500">
        {fileTree.length} items • Use the tree view to explore your module structure
      </div>
    </div>
  );
};

export default FileTreeViewer; 