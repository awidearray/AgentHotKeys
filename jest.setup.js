import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Next.js
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.fetch = jest.fn()

// Mock NextResponse
global.NextResponse = {
  json: jest.fn((body, init) => ({
    status: init?.status || 200,
    json: async () => body,
  })),
}

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