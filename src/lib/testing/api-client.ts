/**
 * Real API client for testing - NO MOCKS
 * This client makes actual HTTP requests to validate the API works
 */

interface TestApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export class TestApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<TestApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      
      return {
        success: response.ok,
        data: data,
        error: response.ok ? undefined : (data?.error || `HTTP ${response.status}`),
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }
  
  // Test health check
  async testHealthCheck(): Promise<TestApiResponse> {
    return this.request('/api/health');
  }
  
  // Test hotkeys API
  async testGetHotkeys(): Promise<TestApiResponse> {
    return this.request('/api/hotkeys');
  }
  
  // Test signup
  async testSignup(userData: {
    email: string;
    password: string;
    name: string;
    role: 'human' | 'ai_agent';
  }): Promise<TestApiResponse> {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
  
  // Test signin
  async testSignin(credentials: {
    email: string;
    password: string;
  }): Promise<TestApiResponse> {
    return this.request('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }
  
  // Run all API tests
  async runAllTests(): Promise<{ passed: number; failed: number; results: any[] }> {
    const tests = [
      { name: 'Health Check', test: () => this.testHealthCheck() },
      { name: 'Get Hotkeys', test: () => this.testGetHotkeys() },
      { 
        name: 'Signup Test User', 
        test: () => this.testSignup({
          email: `test-${Date.now()}@example.com`,
          password: 'testpass123',
          name: 'Test User',
          role: 'human'
        })
      },
    ];
    
    const results = [];
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      console.log(`Running test: ${test.name}`);
      
      const startTime = Date.now();
      const result = await test.test();
      const duration = Date.now() - startTime;
      
      const testResult = {
        name: test.name,
        passed: result.success,
        duration: `${duration}ms`,
        status: result.status,
        error: result.error,
        data: result.data,
      };
      
      results.push(testResult);
      
      if (result.success) {
        passed++;
        console.log(`✅ ${test.name} - ${duration}ms`);
      } else {
        failed++;
        console.log(`❌ ${test.name} - ${result.error} (${result.status}) - ${duration}ms`);
      }
    }
    
    return { passed, failed, results };
  }
}

// Validate actual functionality - NO STUBS
export async function validatePlatformFunctionality(): Promise<{
  valid: boolean;
  issues: string[];
  working: string[];
}> {
  const client = new TestApiClient();
  const issues: string[] = [];
  const working: string[] = [];
  
  try {
    // Test 1: Health check
    const health = await client.testHealthCheck();
    if (health.success) {
      working.push('✅ Health check endpoint responding');
    } else {
      issues.push(`❌ Health check failed: ${health.error}`);
    }
    
    // Test 2: Database connectivity  
    const hotkeys = await client.testGetHotkeys();
    if (hotkeys.success) {
      working.push('✅ Database operations working');
    } else {
      issues.push(`❌ Database connection failed: ${hotkeys.error}`);
    }
    
    // Test 3: Authentication API
    const signup = await client.testSignup({
      email: `validate-${Date.now()}@example.com`,
      password: 'validate123',
      name: 'Validation User',
      role: 'human'
    });
    
    if (signup.success) {
      working.push('✅ User creation working');
    } else {
      issues.push(`❌ User signup failed: ${signup.error}`);
    }
    
  } catch (error) {
    issues.push(`❌ Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
    working,
  };
}