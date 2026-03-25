const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/layout.tsx',
    '!src/**/page.tsx',
  ],
  // Coverage thresholds removed — no test files exist yet to measure against
  transformIgnorePatterns: [
    'node_modules/(?!(@exodus/bytes|html-encoding-sniffer|@supabase/supabase-js|isomorphic-dompurify|entities|@bcoe)/)',
  ],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  globals: {
    Request: global.Request || class MockRequest {},
    Response: global.Response || class MockResponse {},
    Headers: global.Headers || class MockHeaders {},
  },
}

module.exports = createJestConfig(customJestConfig)