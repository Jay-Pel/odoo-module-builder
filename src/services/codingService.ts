import { errorService } from './errorService'

export interface CodingResponse {
  success: boolean;
  data?: {
    generationId: string;
    moduleName: string;
    odooVersion: string;
    description: string;
    dependencies: string[];
    fileCount: number;
    totalSize: number;
    createdAt: string;
    installationNotes?: string;
    usageInstructions?: string;
  };
  error?: string;
}

export interface FileTreeNode {
  name: string
  type: 'file' | 'directory'
  size?: number
  extension?: string
  modified?: string
  children?: FileTreeNode[]
}

export interface FileTreeResponse {
  success: boolean;
  data?: {
    generationId: string;
    moduleName: string;
    odooVersion: string;
    description: string;
    createdAt: string;
    fileCount: number;
    totalSize: number;
    tree: FileTreeNode;
  };
  error?: string;
}

class CodingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_CODING_AGENT_URL || 'http://localhost:3001';
  }

  private async handleRequest<T>(
    url: string, 
    options: RequestInit, 
    context: string
  ): Promise<T> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = errorService.handleNetworkError(
          new Error(`HTTP ${response.status}: ${response.statusText}`),
          context
        );
        throw error;
      }

      const result = await response.json();
      
      // Handle coding-agent response format
      if (result.success === false) {
        throw new Error(result.error || `${context} failed`);
      }

      return result;
    } catch (error: any) {
      if (error.code) {
        // Already handled by errorService
        throw error;
      }

      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = errorService.handleNetworkError(error, context);
        throw networkError;
      }

      // Handle other errors
      const unknownError = errorService.createError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred',
        error,
        context
      );
      throw unknownError;
    }
  }

  async generateCode(
    specificationId: string, 
    specification: string,
    moduleName: string,
    odooVersion: string
  ): Promise<CodingResponse> {
    return this.handleRequest<CodingResponse>(
      `${this.baseUrl}/api/modules/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          specificationId,
          specification,
          moduleName,
          odooVersion
        }),
      },
      'Generate Code'
    );
  }

  async checkCodingStatus(generationId: string): Promise<CodingResponse> {
    return this.handleRequest<CodingResponse>(
      `${this.baseUrl}/api/modules/${generationId}/status`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      'Check Coding Status'
    );
  }

  async getFileTree(generationId: string): Promise<FileTreeResponse> {
    return this.handleRequest<FileTreeResponse>(
      `${this.baseUrl}/api/modules/${generationId}/tree`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      'Get File Tree'
    );
  }

  async downloadModule(generationId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/api/modules/${generationId}/download`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error: any) {
      const downloadError = errorService.createError(
        'DOWNLOAD_ERROR',
        'Failed to download module',
        error,
        'Download Module'
      );
      throw downloadError;
    }
  }

  // Health check method to verify coding-agent connection
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const codingService = new CodingService(); 