'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GradientText from '@/components/ui/GradientText';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  description: string;
  auth_required: boolean;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  request_example?: string;
  response_example?: string;
  rate_limit?: string;
}

const endpoints: { [category: string]: ApiEndpoint[] } = {
  'License Management': [
    {
      method: 'POST',
      endpoint: '/api/ai-agent/generate-license',
      description: 'Generate a single license for a specific tier',
      auth_required: true,
      rate_limit: '100/hour',
      parameters: [
        { name: 'tier', type: 'string', required: true, description: 'License tier: basic, pro, or enterprise' },
        { name: 'user_email', type: 'string', required: false, description: 'Email to associate with license' },
        { name: 'expires_in_days', type: 'number', required: false, description: 'License expiration (default: never)' }
      ],
      request_example: `{
  "tier": "pro",
  "user_email": "developer@company.com",
  "expires_in_days": 365
}`,
      response_example: `{
  "license": {
    "id": "lic_1234567890",
    "key": "hk_pro_abc123def456",
    "tier": "pro",
    "status": "active",
    "created_at": "2024-03-06T10:30:00Z",
    "expires_at": "2025-03-06T10:30:00Z",
    "user_email": "developer@company.com"
  },
  "success": true
}`
    },
    {
      method: 'POST',
      endpoint: '/api/ai-agent/bulk-licenses',
      description: 'Generate multiple licenses in bulk with optional discounts',
      auth_required: true,
      rate_limit: '10/hour',
      parameters: [
        { name: 'total_licenses', type: 'number', required: true, description: 'Number of licenses to generate (1-1000)' },
        { name: 'tier', type: 'string', required: true, description: 'License tier: basic, pro, or enterprise' },
        { name: 'discount_percentage', type: 'number', required: false, description: 'Discount percentage (0-50)' },
        { name: 'expires_in_days', type: 'number', required: false, description: 'License expiration (default: never)' }
      ],
      request_example: `{
  "total_licenses": 25,
  "tier": "pro",
  "discount_percentage": 20,
  "expires_in_days": 365
}`,
      response_example: `{
  "bulk_license": {
    "id": "bulk_1234567890",
    "total_licenses": 25,
    "tier": "pro",
    "discount_percentage": 20,
    "cost_per_license": 15.99,
    "total_cost": 399.75,
    "status": "processing",
    "created_at": "2024-03-06T10:30:00Z"
  },
  "success": true
}`
    },
    {
      method: 'PUT',
      endpoint: '/api/license/activate',
      description: 'Activate a license key for a user',
      auth_required: true,
      rate_limit: '1000/hour',
      parameters: [
        { name: 'license_key', type: 'string', required: true, description: 'The license key to activate' },
        { name: 'user_id', type: 'string', required: true, description: 'User ID to assign the license to' },
        { name: 'machine_id', type: 'string', required: false, description: 'Machine/device identifier' }
      ],
      request_example: `{
  "license_key": "hk_pro_abc123def456",
  "user_id": "user_987654321",
  "machine_id": "mac_abcdef123456"
}`,
      response_example: `{
  "activation": {
    "license_key": "hk_pro_abc123def456",
    "user_id": "user_987654321",
    "activated_at": "2024-03-06T10:30:00Z",
    "expires_at": "2025-03-06T10:30:00Z",
    "machine_id": "mac_abcdef123456"
  },
  "success": true
}`
    },
    {
      method: 'DELETE',
      endpoint: '/api/license/deactivate',
      description: 'Deactivate a license key',
      auth_required: true,
      rate_limit: '1000/hour',
      parameters: [
        { name: 'license_key', type: 'string', required: true, description: 'The license key to deactivate' },
        { name: 'reason', type: 'string', required: false, description: 'Reason for deactivation' }
      ],
      request_example: `{
  "license_key": "hk_pro_abc123def456",
  "reason": "User requested cancellation"
}`,
      response_example: `{
  "deactivation": {
    "license_key": "hk_pro_abc123def456",
    "deactivated_at": "2024-03-06T10:30:00Z",
    "reason": "User requested cancellation"
  },
  "success": true
}`
    }
  ],
  'Analytics & Usage': [
    {
      method: 'GET',
      endpoint: '/api/ai-agent/analytics',
      description: 'Get usage statistics and analytics data',
      auth_required: true,
      rate_limit: '100/hour',
      parameters: [
        { name: 'timeRange', type: 'string', required: false, description: 'Time range: 7d, 30d, 90d (default: 30d)' },
        { name: 'metric', type: 'string', required: false, description: 'Specific metric to retrieve' }
      ],
      request_example: `GET /api/ai-agent/analytics?timeRange=30d&metric=api_calls`,
      response_example: `{
  "current_period": {
    "api_calls": 1250,
    "licenses_generated": 85,
    "bandwidth_used": 2.3,
    "start_date": "2024-02-06",
    "end_date": "2024-03-06"
  },
  "limits": {
    "api_calls": 10000,
    "licenses_per_month": 1000,
    "bandwidth_gb": 50
  },
  "usage_history": [
    {
      "date": "2024-03-05",
      "api_calls": 45,
      "licenses_generated": 3,
      "bandwidth_mb": 120
    }
  ]
}`
    },
    {
      method: 'GET',
      endpoint: '/api/license/validate',
      description: 'Validate a license key and get its details',
      auth_required: true,
      rate_limit: '10000/hour',
      parameters: [
        { name: 'license_key', type: 'string', required: true, description: 'The license key to validate' }
      ],
      request_example: `GET /api/license/validate?license_key=hk_pro_abc123def456`,
      response_example: `{
  "license": {
    "key": "hk_pro_abc123def456",
    "tier": "pro",
    "status": "active",
    "user_id": "user_987654321",
    "created_at": "2024-03-06T10:30:00Z",
    "expires_at": "2025-03-06T10:30:00Z",
    "features": ["advanced_hotkeys", "priority_support", "analytics"]
  },
  "valid": true
}`
    }
  ]
};

const sdkExamples = {
  javascript: `npm install @hotkeys/sdk

import { HotKeysClient } from '@hotkeys/sdk';

const client = new HotKeysClient({
  apiKey: process.env.HOTKEYS_API_KEY
});

// Generate a license
const license = await client.generateLicense({
  tier: 'pro',
  userEmail: 'dev@company.com'
});

// Generate bulk licenses
const bulkLicenses = await client.generateBulkLicenses({
  totalLicenses: 10,
  tier: 'pro',
  discountPercentage: 15
});`,
  
  python: `pip install hotkeys-sdk

from hotkeys import HotKeysClient

client = HotKeysClient(api_key=os.environ['HOTKEYS_API_KEY'])

# Generate a license
license = client.generate_license(
    tier='pro',
    user_email='dev@company.com'
)

# Generate bulk licenses
bulk_licenses = client.generate_bulk_licenses(
    total_licenses=10,
    tier='pro',
    discount_percentage=15
)`,
  
  go: `go get github.com/hotkeys-ai/sdk-go

package main

import (
    "github.com/hotkeys-ai/sdk-go"
)

func main() {
    client := hotkeys.NewClient(os.Getenv("HOTKEYS_API_KEY"))
    
    // Generate a license
    license, err := client.GenerateLicense(hotkeys.GenerateLicenseRequest{
        Tier:      "pro",
        UserEmail: "dev@company.com",
    })
    
    // Generate bulk licenses
    bulk, err := client.GenerateBulkLicenses(hotkeys.BulkLicenseRequest{
        TotalLicenses:     10,
        Tier:             "pro",
        DiscountPercentage: 15,
    })
}`,
  
  curl: `# Generate a single license
curl -X POST https://api.hotkeys.ai/v1/ai-agent/generate-license \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tier": "pro",
    "user_email": "dev@company.com"
  }'

# Generate bulk licenses
curl -X POST https://api.hotkeys.ai/v1/ai-agent/bulk-licenses \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "total_licenses": 10,
    "tier": "pro",
    "discount_percentage": 15
  }'`
};

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSdk, setSelectedSdk] = useState('javascript');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-500/20 text-blue-400';
      case 'POST': return 'bg-green-500/20 text-green-400';
      case 'PUT': return 'bg-yellow-500/20 text-yellow-400';
      case 'DELETE': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="hero" className="mb-6">
            API Reference
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
            <GradientText>HotKeys.ai API</GradientText>
          </h1>
          <p className="text-xl text-text-dim max-w-[700px] mx-auto leading-relaxed mb-8">
            Complete API reference for integrating hotkey licensing into your AI workflows. 
            RESTful API with comprehensive SDKs and examples.
          </p>

          <div className="flex gap-4 justify-center flex-wrap mb-8">
            <Button variant="primary" href="/auth/signup?type=agent">
              Get API Key
            </Button>
            <Button variant="secondary" href="/docs/quickstart">
              Quick Start
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-12 border-b border-border overflow-x-auto">
          {['overview', 'authentication', 'endpoints', 'sdks', 'errors'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-accent text-accent' 
                  : 'border-transparent text-text-dim hover:text-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">API Overview</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="bg-bg-card border border-border rounded-xl p-6">
                    <h3 className="font-bold mb-2">Base URL</h3>
                    <code className="text-sm bg-bg px-3 py-1 rounded">https://api.hotkeys.ai/v1</code>
                  </div>
                  <div className="bg-bg-card border border-border rounded-xl p-6">
                    <h3 className="font-bold mb-2">Authentication</h3>
                    <p className="text-text-dim text-sm">Bearer token authentication with API keys</p>
                  </div>
                  <div className="bg-bg-card border border-border rounded-xl p-6">
                    <h3 className="font-bold mb-2">Rate Limits</h3>
                    <p className="text-text-dim text-sm">Varies by endpoint and plan tier</p>
                  </div>
                </div>
                
                <div className="bg-bg-card border border-border rounded-xl p-6">
                  <h3 className="font-bold mb-4">Request/Response Format</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Content-Type:</span>
                      <code className="ml-2 bg-bg px-2 py-1 rounded">application/json</code>
                    </div>
                    <div>
                      <span className="font-medium">Encoding:</span>
                      <span className="ml-2 text-text-dim">UTF-8</span>
                    </div>
                    <div>
                      <span className="font-medium">Timestamps:</span>
                      <span className="ml-2 text-text-dim">ISO 8601 format</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg-card border border-border rounded-xl p-8">
              <h3 className="text-xl font-bold mb-6">Quick Example</h3>
              <div className="bg-bg rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-text-dim text-sm ml-2">quick_example.js</span>
                </div>
                <pre className="text-sm text-text-dim overflow-x-auto">
                  <code>{`const response = await fetch('https://api.hotkeys.ai/v1/ai-agent/generate-license', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tier: 'pro',
    user_email: 'developer@company.com'
  })
});

const license = await response.json();
console.log('License key:', license.license.key);`}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Authentication Tab */}
        {activeTab === 'authentication' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Authentication</h2>
              <p className="text-text-dim mb-8">The HotKeys.ai API uses API key authentication. Include your API key in the Authorization header of every request.</p>
            </div>

            <div className="bg-bg-card border border-border rounded-xl p-8">
              <h3 className="text-xl font-bold mb-4">Getting Your API Key</h3>
              <ol className="space-y-3 text-text-dim">
                <li className="flex gap-3">
                  <span className="bg-accent/20 text-accent rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                  <span>Sign up for an AI agent account</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-accent/20 text-accent rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                  <span>Navigate to your dashboard</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-accent/20 text-accent rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                  <span>Go to API Keys section</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-accent/20 text-accent rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                  <span>Generate a new API key</span>
                </li>
              </ol>
              <div className="mt-6">
                <Button variant="primary" href="/dashboard/api-keys">
                  Generate API Key
                </Button>
              </div>
            </div>

            <div className="bg-bg-card border border-border rounded-xl p-8">
              <h3 className="text-xl font-bold mb-4">Making Authenticated Requests</h3>
              <div className="bg-bg rounded-xl p-6">
                <pre className="text-sm text-text-dim overflow-x-auto">
                  <code>{`curl -X GET https://api.hotkeys.ai/v1/ai-agent/analytics \\
  -H "Authorization: Bearer hk_api_1234567890abcdef" \\
  -H "Content-Type: application/json"`}</code>
                </pre>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 font-medium">⚠️ Security Note</p>
                <p className="text-text-dim text-sm mt-1">
                  Never expose your API key in client-side code. Keep it secure on your server and use environment variables.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">API Endpoints</h2>
              <p className="text-text-dim">Complete reference for all API endpoints with examples and parameters.</p>
            </div>

            {Object.entries(endpoints).map(([category, categoryEndpoints]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-xl font-bold">{category}</h3>
                {categoryEndpoints.map((endpoint, index) => (
                  <div key={index} className="bg-bg-card border border-border rounded-xl overflow-hidden">
                    <div 
                      className="p-6 cursor-pointer hover:bg-bg-card/50 transition-colors"
                      onClick={() => setExpandedEndpoint(expandedEndpoint === `${category}-${index}` ? null : `${category}-${index}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className={`text-xs ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </Badge>
                          <div>
                            <p className="font-mono text-sm">{endpoint.endpoint}</p>
                            <p className="text-text-dim text-xs mt-1">{endpoint.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {endpoint.auth_required && (
                            <Badge variant="secondary" className="text-xs">🔐 Auth Required</Badge>
                          )}
                          {endpoint.rate_limit && (
                            <Badge variant="secondary" className="text-xs">⚡ {endpoint.rate_limit}</Badge>
                          )}
                          <span className="text-text-dim">
                            {expandedEndpoint === `${category}-${index}` ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {expandedEndpoint === `${category}-${index}` && (
                      <div className="border-t border-border p-6 space-y-6">
                        {endpoint.parameters && (
                          <div>
                            <h4 className="font-bold mb-3">Parameters</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="border-b border-border">
                                  <tr className="text-left">
                                    <th className="pb-2 font-medium text-text-dim">Name</th>
                                    <th className="pb-2 font-medium text-text-dim">Type</th>
                                    <th className="pb-2 font-medium text-text-dim">Required</th>
                                    <th className="pb-2 font-medium text-text-dim">Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {endpoint.parameters.map((param, paramIndex) => (
                                    <tr key={paramIndex} className="border-b border-border/50">
                                      <td className="py-2 font-mono">{param.name}</td>
                                      <td className="py-2 text-text-dim">{param.type}</td>
                                      <td className="py-2">
                                        <Badge variant="secondary" className={`text-xs ${param.required ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                          {param.required ? 'Required' : 'Optional'}
                                        </Badge>
                                      </td>
                                      <td className="py-2 text-text-dim text-xs">{param.description}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                          {endpoint.request_example && (
                            <div>
                              <h4 className="font-bold mb-3">Request Example</h4>
                              <div className="bg-bg rounded-lg p-4">
                                <pre className="text-xs text-text-dim overflow-x-auto">
                                  <code>{endpoint.request_example}</code>
                                </pre>
                              </div>
                            </div>
                          )}

                          {endpoint.response_example && (
                            <div>
                              <h4 className="font-bold mb-3">Response Example</h4>
                              <div className="bg-bg rounded-lg p-4">
                                <pre className="text-xs text-text-dim overflow-x-auto">
                                  <code>{endpoint.response_example}</code>
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* SDKs Tab */}
        {activeTab === 'sdks' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Official SDKs</h2>
              <p className="text-text-dim">Official SDKs and code examples for popular programming languages.</p>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto">
              {Object.keys(sdkExamples).map((sdk) => (
                <button
                  key={sdk}
                  onClick={() => setSelectedSdk(sdk)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize whitespace-nowrap transition-colors ${
                    selectedSdk === sdk 
                      ? 'bg-accent text-bg' 
                      : 'bg-bg-card text-text-dim hover:text-text'
                  }`}
                >
                  {sdk === 'javascript' ? 'JavaScript/TypeScript' : sdk}
                </button>
              ))}
            </div>

            <div className="bg-bg-card border border-border rounded-xl p-6">
              <div className="bg-bg rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-text-dim text-sm ml-2">{selectedSdk}_example.{selectedSdk === 'python' ? 'py' : selectedSdk === 'go' ? 'go' : selectedSdk === 'curl' ? 'sh' : 'js'}</span>
                </div>
                <pre className="text-sm text-text-dim overflow-x-auto">
                  <code>{sdkExamples[selectedSdk as keyof typeof sdkExamples]}</code>
                </pre>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-bg-card border border-border rounded-xl p-6">
                <h3 className="font-bold mb-4">SDK Features</h3>
                <ul className="space-y-2 text-sm text-text-dim">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                    Type-safe API calls with full IntelliSense
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                    Automatic retry logic with exponential backoff
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                    Built-in rate limiting and error handling
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                    Webhook signature verification
                  </li>
                </ul>
              </div>

              <div className="bg-bg-card border border-border rounded-xl p-6">
                <h3 className="font-bold mb-4">Community SDKs</h3>
                <p className="text-text-dim text-sm mb-4">
                  Looking for an SDK in another language? Check out our community-maintained SDKs or contribute your own.
                </p>
                <Button variant="secondary" href="/docs/community-sdks">
                  View Community SDKs
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Errors Tab */}
        {activeTab === 'errors' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Error Handling</h2>
              <p className="text-text-dim">Standard HTTP status codes and error response format.</p>
            </div>

            <div className="bg-bg-card border border-border rounded-xl p-8">
              <h3 className="text-xl font-bold mb-4">Error Response Format</h3>
              <div className="bg-bg rounded-xl p-6 mb-6">
                <pre className="text-sm text-text-dim overflow-x-auto">
                  <code>{`{
  "error": {
    "code": "invalid_request",
    "message": "The tier parameter is required",
    "details": {
      "field": "tier",
      "value": null,
      "expected": "One of: basic, pro, enterprise"
    }
  },
  "success": false,
  "timestamp": "2024-03-06T10:30:00Z"
}`}</code>
                </pre>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">HTTP Status Codes</h3>
              
              {[
                { code: '200', title: 'OK', description: 'Request successful' },
                { code: '201', title: 'Created', description: 'Resource created successfully' },
                { code: '400', title: 'Bad Request', description: 'Invalid request parameters' },
                { code: '401', title: 'Unauthorized', description: 'Invalid or missing API key' },
                { code: '403', title: 'Forbidden', description: 'API key lacks required permissions' },
                { code: '404', title: 'Not Found', description: 'Resource not found' },
                { code: '429', title: 'Too Many Requests', description: 'Rate limit exceeded' },
                { code: '500', title: 'Internal Server Error', description: 'Server error occurred' },
              ].map((status) => (
                <div key={status.code} className="bg-bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge 
                      variant="secondary"
                      className={`text-xs ${
                        status.code.startsWith('2') ? 'bg-green-500/20 text-green-400' :
                        status.code.startsWith('4') ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {status.code}
                    </Badge>
                    <h4 className="font-bold">{status.title}</h4>
                  </div>
                  <p className="text-text-dim text-sm">{status.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-bg-card border border-border rounded-2xl p-8 md:p-12 text-center mt-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to Start Building?
          </h2>
          <p className="text-lg text-text-dim mb-8 max-w-2xl mx-auto">
            Get your free API key and start integrating HotKeys.ai into your projects today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" href="/auth/signup?type=agent">
              Get API Access
            </Button>
            <Button variant="secondary" href="/docs/quickstart">
              Quick Start Guide
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}