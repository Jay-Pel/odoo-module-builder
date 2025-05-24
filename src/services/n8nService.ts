import { errorService } from './errorService'

export interface UserRequirements {
  moduleName: string;
  moduleVersion: string;
  requirements: string;
  odooVersion: string;
}

export interface SpecificationResponse {
  specificationId: string;
  specification: string;
  status: string;
  metadata?: any;
}

export interface CodingResponse {
  generationId: string;
  files: Array<{
    path: string;
    content: string;
  }>;
  status: string;
  progress?: number;
}

export interface TestingResponse {
  testResults: {
    passed: boolean;
    errors: string[];
    fixes: string[];
  };
  screenshots: string[];
  status: string;
}

export interface UserTestingResponse {
  odooUrl: string;
  iframeUrl: string;
  status: string;
}

class N8nService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_N8N_BASE_URL || 'http://localhost:5678';
  }

  private async handleRequest<T>(
    url: string, 
    options: RequestInit, 
    context: string
  ): Promise<T> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = errorService.handleN8nError(
          { status: response.status, statusText: response.statusText },
          context
        );
        throw error;
      }

      return await response.json();
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

  async generateSpecification(requirements: UserRequirements): Promise<SpecificationResponse> {
    return this.handleRequest<SpecificationResponse>(
      `${this.baseUrl}/webhook/specification-agent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requirements),
      },
      'Generate Specification'
    );
  }

  async submitSpecificationFeedback(
    specificationId: string, 
    feedback: string
  ): Promise<SpecificationResponse> {
    return this.handleRequest<SpecificationResponse>(
      `${this.baseUrl}/webhook/specification-feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          specificationId,
          feedback,
        }),
      },
      'Submit Specification Feedback'
    );
  }

  async generateCode(
    specificationId: string, 
    specification: string
  ): Promise<CodingResponse> {
    return this.handleRequest<CodingResponse>(
      `${this.baseUrl}/webhook/coding-agent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          specificationId,
          specification,
        }),
      },
      'Generate Code'
    );
  }

  async checkCodingStatus(generationId: string): Promise<CodingResponse> {
    return this.handleRequest<CodingResponse>(
      `${this.baseUrl}/webhook/coding-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generationId }),
      },
      'Check Coding Status'
    );
  }

  async runAutomatedTests(
    modulePath: string, 
    generationId: string
  ): Promise<TestingResponse> {
    return this.handleRequest<TestingResponse>(
      `${this.baseUrl}/webhook/testing-agent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modulePath,
          generationId,
        }),
      },
      'Run Automated Tests'
    );
  }

  async initializeUserTesting(generationId: string): Promise<UserTestingResponse> {
    return this.handleRequest<UserTestingResponse>(
      `${this.baseUrl}/webhook/user-testing`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generationId,
          action: 'initialize'
        }),
      },
      'Initialize User Testing'
    );
  }

  async submitUserTestingFeedback(
    generationId: string,
    feedback: string,
    images?: File[]
  ): Promise<CodingResponse> {
    try {
      const formData = new FormData();
      formData.append('generationId', generationId);
      formData.append('feedback', feedback);
      
      if (images) {
        images.forEach((image, index) => {
          formData.append(`image_${index}`, image);
        });
      }

      return this.handleRequest<CodingResponse>(
        `${this.baseUrl}/webhook/user-testing`,
        {
        method: 'POST',
        body: formData,
        },
        'Submit User Testing Feedback'
      );
    } catch (error: any) {
      const testingError = errorService.createError(
        'TESTING_ERROR',
        'Failed to submit user testing feedback',
        error,
        'Submit User Testing Feedback'
      );
      throw testingError;
    }
  }

  // Health check method to verify n8n connection
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/healthz`, {
        method: 'GET',
        timeout: 5000
      } as any);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const n8nService = new N8nService(); 