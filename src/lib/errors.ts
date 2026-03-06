import { logger } from './logger';
import { NextResponse } from 'next/server';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public isOperational = true,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(401, message, 'AUTH_ERROR', true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(403, message, 'FORBIDDEN', true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND', true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT', true);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, message, 'RATE_LIMIT', true);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(503, `External service error: ${service}`, 'SERVICE_ERROR', false, {
      service,
      originalError: originalError?.message,
    });
  }
}

export function handleApiError(error: unknown, context?: Record<string, any>) {
  if (error instanceof AppError) {
    logger.warn({
      type: 'api_error',
      error: {
        statusCode: error.statusCode,
        message: error.message,
        code: error.code,
        details: error.details,
      },
      ...context,
    });

    return NextResponse.json(
      {
        error: error.code || 'ERROR',
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  logger.error({
    type: 'unhandled_error',
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error,
    ...context,
  });

  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : error instanceof Error ? error.message : 'Unknown error';

  return NextResponse.json(
    {
      error: 'INTERNAL_ERROR',
      message,
    },
    { status: 500 }
  );
}

export async function withErrorHandler<T>(
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (error) {
    return handleApiError(error, context);
  }
}

export function createErrorResponse(
  statusCode: number,
  message: string,
  code?: string
): NextResponse {
  return NextResponse.json(
    {
      error: code || 'ERROR',
      message,
    },
    { status: statusCode }
  );
}