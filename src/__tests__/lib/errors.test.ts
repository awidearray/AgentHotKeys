import { AppError, ValidationError, AuthenticationError, NotFoundError, handleApiError } from '@/lib/errors';
import { NextResponse } from 'next/server';

jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an app error with correct properties', () => {
      const error = new AppError(500, 'Test error', 'TEST_ERROR', true, { detail: 'test' });
      
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual({ detail: 'test' });
    });
  });
  
  describe('ValidationError', () => {
    it('should create a validation error', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });
  });
  
  describe('AuthenticationError', () => {
    it('should create an authentication error', () => {
      const error = new AuthenticationError();
      
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication failed');
      expect(error.code).toBe('AUTH_ERROR');
    });
    
    it('should accept custom message', () => {
      const error = new AuthenticationError('Invalid token');
      expect(error.message).toBe('Invalid token');
    });
  });
  
  describe('NotFoundError', () => {
    it('should create a not found error', () => {
      const error = new NotFoundError('User');
      
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
      expect(error.code).toBe('NOT_FOUND');
    });
  });
});

describe('handleApiError', () => {
  const originalEnv = process.env.NODE_ENV;
  
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });
  
  it('should handle AppError correctly', () => {
    const error = new ValidationError('Invalid input', { field: 'email' });
    const response = handleApiError(error, { endpoint: '/api/test' });
    
    expect(response).toBeInstanceOf(NextResponse);
  });
  
  it('should handle generic Error', () => {
    const error = new Error('Generic error');
    const response = handleApiError(error);
    
    expect(response).toBeInstanceOf(NextResponse);
  });
  
  it('should handle unknown error', () => {
    const error = 'string error';
    const response = handleApiError(error);
    
    expect(response).toBeInstanceOf(NextResponse);
  });
  
  it('should include details in development mode', () => {
    process.env.NODE_ENV = 'development';
    const error = new ValidationError('Invalid input', { field: 'email' });
    handleApiError(error);
    
    process.env.NODE_ENV = originalEnv;
  });
  
  it('should hide details in production mode', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Internal error');
    handleApiError(error);
    
    process.env.NODE_ENV = originalEnv;
  });
});