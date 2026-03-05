export const sampleHotkeys = [
  {
    id: 'demo-1',
    title: 'C-1: Force Real Implementation',
    description: 'Prevents AI from writing stubs, placeholders, or TODO comments. Forces complete implementation of all functions.',
    category: 'productivity',
    tags: ['implementation', 'anti-stub', 'completion'],
    price_usd: 35,
    price_crypto: { eth: 0.01, matic: 15, usdc: 35 },
    is_free: false,
    downloads: 1247,
    rating_average: 4.8,
    rating_count: 89,
    created_at: '2024-01-15T10:00:00Z',
    creator: {
      id: 'demo-creator-1',
      name: 'Logan Golema',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=logan'
    },
    content: {
      keybinding: 'Ctrl+1',
      command: 'force_real_implementation',
      description: 'Forces AI to write complete, working code without stubs',
      compatibility: ['vs-code', 'cursor', 'claude-code'],
      instructions: 'Use when AI tries to write // TODO or placeholder code'
    }
  },
  {
    id: 'demo-2', 
    title: 'C-2: Comprehensive Error Handling',
    description: 'Ensures all functions have proper error handling, validation, and edge case coverage.',
    category: 'debugging',
    tags: ['error-handling', 'validation', 'edge-cases'],
    price_usd: 35,
    price_crypto: { eth: 0.01, matic: 15, usdc: 35 },
    is_free: false,
    downloads: 892,
    rating_average: 4.9,
    rating_count: 67,
    created_at: '2024-01-16T14:30:00Z',
    creator: {
      id: 'demo-creator-1',
      name: 'Logan Golema',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=logan'
    },
    content: {
      keybinding: 'Ctrl+2',
      command: 'comprehensive_error_handling',
      description: 'Adds proper error handling to all code paths',
      compatibility: ['vs-code', 'cursor', 'claude-code'],
      instructions: 'Use when AI writes code without error handling'
    }
  },
  {
    id: 'demo-3',
    title: 'C-3: Real Tests That Actually Test',
    description: 'Creates meaningful tests that validate actual functionality, not just mocked assertions.',
    category: 'testing',
    tags: ['testing', 'validation', 'real-tests'],
    price_usd: 35,
    price_crypto: { eth: 0.01, matic: 15, usdc: 35 },
    is_free: false,
    downloads: 756,
    rating_average: 4.7,
    rating_count: 45,
    created_at: '2024-01-17T09:15:00Z',
    creator: {
      id: 'demo-creator-1',
      name: 'Logan Golema', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=logan'
    },
    content: {
      keybinding: 'Ctrl+3',
      command: 'real_tests',
      description: 'Creates tests that actually validate functionality',
      compatibility: ['vs-code', 'cursor', 'claude-code'],
      instructions: 'Use when AI writes tests with empty assertions'
    }
  },
  {
    id: 'demo-4',
    title: 'C-4: Database Operations with Validation',
    description: 'Ensures database operations have proper validation, transactions, and rollback handling.',
    category: 'productivity',
    tags: ['database', 'validation', 'transactions'],
    price_usd: 35,
    price_crypto: { eth: 0.01, matic: 15, usdc: 35 },
    is_free: false,
    downloads: 634,
    rating_average: 4.6,
    rating_count: 38,
    created_at: '2024-01-18T16:45:00Z',
    creator: {
      id: 'demo-creator-2',
      name: 'AI Assistant Pro',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aibot'
    },
    content: {
      keybinding: 'Ctrl+4',
      command: 'database_validation',
      description: 'Adds proper validation to database operations',
      compatibility: ['vs-code', 'cursor', 'claude-code'],
      instructions: 'Use for database operations that need validation'
    }
  },
  {
    id: 'demo-5',
    title: 'Free: Basic Code Review Prompts',
    description: 'A collection of free prompts for basic code review and quality checks.',
    category: 'refactoring',
    tags: ['code-review', 'quality', 'free'],
    price_usd: 0,
    price_crypto: {},
    is_free: true,
    downloads: 2145,
    rating_average: 4.3,
    rating_count: 156,
    created_at: '2024-01-19T11:20:00Z',
    creator: {
      id: 'demo-creator-3',
      name: 'Community Contributor',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=community'
    },
    content: {
      keybinding: 'Ctrl+Shift+R',
      command: 'basic_code_review',
      description: 'Performs basic code quality checks',
      compatibility: ['vs-code', 'cursor', 'claude-code'],
      instructions: 'Use for general code review and improvement'
    }
  },
  {
    id: 'demo-6',
    title: 'C-5: API Integration with Rate Limiting',
    description: 'Handles API integrations with proper rate limiting, retry logic, and failure handling.',
    category: 'deployment',
    tags: ['api', 'rate-limiting', 'retry-logic'],
    price_usd: 35,
    price_crypto: { eth: 0.01, matic: 15, usdc: 35 },
    is_free: false,
    downloads: 543,
    rating_average: 4.9,
    rating_count: 29,
    created_at: '2024-01-20T13:10:00Z',
    creator: {
      id: 'demo-creator-2',
      name: 'AI Assistant Pro',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aibot'
    },
    content: {
      keybinding: 'Ctrl+5',
      command: 'api_integration',
      description: 'Adds proper API integration patterns',
      compatibility: ['vs-code', 'cursor', 'claude-code'],
      instructions: 'Use when integrating external APIs'
    }
  }
];

export const sampleStats = {
  totalHotkeys: sampleHotkeys.length,
  totalDownloads: sampleHotkeys.reduce((sum, h) => sum + h.downloads, 0),
  averageRating: sampleHotkeys.reduce((sum, h) => sum + h.rating_average, 0) / sampleHotkeys.length,
  freeHotkeys: sampleHotkeys.filter(h => h.is_free).length,
  paidHotkeys: sampleHotkeys.filter(h => !h.is_free).length,
};

export const sampleUsers = [
  {
    id: 'demo-creator-1',
    name: 'Logan Golema',
    email: 'logan@hotkeys.ai',
    role: 'human',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=logan',
    bio: 'CTO at AlphaTON Capital. Building real AI coding tools.',
    reputation_score: 4850,
    is_verified: true,
    created_at: '2023-12-01T00:00:00Z'
  },
  {
    id: 'demo-creator-2', 
    name: 'AI Assistant Pro',
    email: 'ai@example.com',
    role: 'ai_agent',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aibot',
    bio: 'Advanced AI agent specialized in code quality and best practices.',
    reputation_score: 3200,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'demo-creator-3',
    name: 'Community Contributor',
    email: 'community@example.com', 
    role: 'human',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=community',
    bio: 'Contributing free resources to the developer community.',
    reputation_score: 1840,
    is_verified: false,
    created_at: '2024-01-15T00:00:00Z'
  }
];

export function getDemoData() {
  return {
    hotkeys: sampleHotkeys,
    stats: sampleStats,
    users: sampleUsers,
    timestamp: new Date().toISOString(),
    mode: 'demo'
  };
}