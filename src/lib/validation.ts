import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const walletAddressRegex = /^0x[a-fA-F0-9]{40}$/;

export const authSchemas = {
  signup: z.object({
    email: z.string().email('Invalid email address').toLowerCase(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(passwordRegex, 'Password must contain uppercase, lowercase, number, and special character'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
    role: z.enum(['human', 'ai']),
  }),
  
  signin: z.object({
    email: z.string().email('Invalid email address').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
  
  resetPassword: z.object({
    email: z.string().email('Invalid email address').toLowerCase(),
  }),
  
  updatePassword: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(passwordRegex, 'Password must contain uppercase, lowercase, number, and special character'),
  }),
};

export const hotkeySchemas = {
  create: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long'),
    price: z.number().min(0.01, 'Price must be positive').max(10000, 'Price too high'),
    category: z.enum(['productivity', 'testing', 'deployment', 'debugging', 'documentation', 'refactoring']),
    isPublic: z.boolean().default(false),
    content: z.object({
      trigger: z.string().min(1, 'Trigger is required').max(50, 'Trigger too long'),
      action: z.string().min(1, 'Action is required').max(100, 'Action too long'),
      instructions: z.string().min(10, 'Instructions must be at least 10 characters').max(1000, 'Instructions too long'),
      examples: z.array(z.string()).optional(),
      tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
    }),
  }),
  
  update: z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().min(10).max(500).optional(),
    price: z.number().min(0.01).max(10000).optional(),
    category: z.enum(['productivity', 'testing', 'deployment', 'debugging', 'documentation', 'refactoring']).optional(),
    isPublic: z.boolean().optional(),
    content: z.object({
      trigger: z.string().min(1).max(50).optional(),
      action: z.string().min(1).max(100).optional(),
      instructions: z.string().min(10).max(1000).optional(),
      examples: z.array(z.string()).optional(),
      tags: z.array(z.string()).max(10).optional(),
    }).optional(),
  }),
  
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category: z.enum(['all', 'productivity', 'testing', 'deployment', 'debugging', 'documentation', 'refactoring']).optional(),
    search: z.string().max(100).optional(),
    sortBy: z.enum(['createdAt', 'price', 'title', 'downloads']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
};

export const paymentSchemas = {
  createCheckout: z.object({
    hotkeyId: z.string().uuid('Invalid hotkey ID'),
    paymentMethod: z.enum(['stripe', 'crypto']),
  }),
  
  cryptoPayment: z.object({
    hotkeyId: z.string().uuid('Invalid hotkey ID'),
    currency: z.enum(['ETH', 'MATIC', 'USDC']),
    walletAddress: z.string().regex(walletAddressRegex, 'Invalid wallet address'),
    transactionHash: z.string().min(66).max(66, 'Invalid transaction hash'),
  }),
  
  webhookEvent: z.object({
    type: z.string(),
    data: z.object({
      object: z.any(),
    }),
  }),
};

export function sanitizeInput(input: string): string {
  const cleaned = DOMPurify.sanitize(input, { 
    USE_PROFILES: { html: false },
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  
  return cleaned.trim();
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
}

export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  try {
    const validated = await schema.parseAsync(data);
    return sanitizeObject(validated as Record<string, any>) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    throw error;
  }
}

export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidWalletAddress(address: string): boolean {
  return walletAddressRegex.test(address);
}