import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Next.js
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.fetch = jest.fn()

// Mock NextResponse - create a proper mock response that works with tests
class MockNextResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this._init = init;
  }
  
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
  
  static json(body, init) {
    return new MockNextResponse(JSON.stringify(body), init);
  }
}

global.NextResponse = MockNextResponse;

// Set test environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'test-secret-key-minimum-32-characters-long',
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-minimum-100-characters-long-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key-minimum-100-characters-long-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: 'test-wallet-connect-id-min-32-chars',
  NEXT_PUBLIC_ALCHEMY_ID: 'test-alchemy-id-minimum-32-characters',
  PLATFORM_ETH_WALLET: '0x1234567890123456789012345678901234567890',
  PLATFORM_MATIC_WALLET: '0x1234567890123456789012345678901234567890',
  PLATFORM_USDC_WALLET: '0x1234567890123456789012345678901234567890',
  STRIPE_SECRET_KEY: 'sk_test_1234567890',
  STRIPE_WEBHOOK_SECRET: 'whsec_test1234567890',
  BREVO_API_KEY: 'xkeysib-test1234567890',
  SKIP_ENV_VALIDATION: 'true',
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock Web Request/Response APIs for server components
global.Request = global.Request || class MockRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
    this.body = options.body;
  }
  
  json() {
    return Promise.resolve(this.body ? JSON.parse(this.body) : {});
  }
  
  text() {
    return Promise.resolve(this.body || '');
  }
};

global.Response = global.Response || class MockResponse {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
  }
  
  json() {
    return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
  }
  
  text() {
    return Promise.resolve(this.body);
  }
};

global.Headers = global.Headers || class MockHeaders {
  constructor(init = {}) {
    this.map = new Map(Object.entries(init));
  }
  
  get(name) {
    return this.map.get(name.toLowerCase());
  }
  
  set(name, value) {
    this.map.set(name.toLowerCase(), value);
  }
  
  has(name) {
    return this.map.has(name.toLowerCase());
  }
};