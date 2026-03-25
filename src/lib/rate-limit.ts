import { NextRequest, NextResponse } from 'next/server';
import { RateLimitError } from './errors';
import { logger } from './logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const stores: Map<string, RateLimitStore> = new Map();

export function resetRateLimitStores(): void {
  stores.clear();
}

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: NextRequest) => string;
  skip?: (req: NextRequest) => boolean;
  handler?: (req: NextRequest) => NextResponse;
}

const defaultOptions: Required<RateLimitOptions> = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return ip;
  },
  skip: () => false,
  handler: (req) => {
    throw new RateLimitError('Too many requests, please try again later');
  },
};

export function createRateLimiter(options: RateLimitOptions = {}) {
  const config = { ...defaultOptions, ...options };
  const storeName = `${config.windowMs}-${config.max}`;
  
  if (!stores.has(storeName)) {
    stores.set(storeName, {});
  }

  return async function rateLimiter(req: NextRequest): Promise<void> {
    if (config.skip(req)) {
      return;
    }

    let store = stores.get(storeName);
    if (!store) {
      store = {};
      stores.set(storeName, store);
    }
    
    const key = config.keyGenerator(req);
    const now = Date.now();
    
    // Clean up expired entries
    for (const [k, v] of Object.entries(store)) {
      if (v.resetTime < now) {
        delete store[k];
      }
    }
    
    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }
    
    const entry = store[key];
    
    if (entry.resetTime < now) {
      entry.count = 0;
      entry.resetTime = now + config.windowMs;
    }
    
    entry.count++;
    
    if (entry.count > config.max) {
      logger.warn({
        type: 'rate_limit',
        key,
        count: entry.count,
        max: config.max,
        path: req.nextUrl.pathname,
      });
      
      throw new RateLimitError(config.message || 'Too many requests');
    }
  };
}

// Preset rate limiters for different endpoints
export const rateLimiters = {
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    message: 'Too many authentication attempts, please try again later',
  }),
  
  api: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  }),
  
  strict: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
  }),
  
  webhook: createRateLimiter({
    windowMs: 1000, // 1 second
    max: 10, // 10 requests per second
    keyGenerator: (req) => 'webhook', // Single key for all webhook requests
  }),
};

// Memory cleanup - run every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const store of stores.values()) {
      for (const [key, value] of Object.entries(store)) {
        if (value.resetTime < now) {
          delete store[key];
        }
      }
    }
  }, 5 * 60 * 1000);
}