'use client';

import { ReactNode } from 'react';

// Inline loading spinner
export function LoadingSpinner({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-accent/30 border-t-accent`} />
  );
}

// Full page loading screen
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="large" />
        <p className="text-text-dim mt-4">Loading...</p>
      </div>
    </div>
  );
}

// Card loading skeleton
export function CardSkeleton() {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-6 bg-bg w-32 rounded"></div>
        <div className="h-6 bg-bg w-16 rounded"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-bg w-full rounded"></div>
        <div className="h-4 bg-bg w-3/4 rounded"></div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-bg w-16 rounded-full"></div>
        <div className="h-5 bg-bg w-20 rounded-full"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-4 bg-bg w-24 rounded"></div>
        <div className="h-4 bg-bg w-20 rounded"></div>
      </div>
    </div>
  );
}

// Stats card loading
export function StatCardLoading() {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-bg w-20 rounded mb-2"></div>
      <div className="h-8 bg-bg w-16 rounded"></div>
    </div>
  );
}

// Generic loading wrapper
interface LoadingWrapperProps {
  loading: boolean;
  error?: string | null;
  children: ReactNode;
  skeleton?: ReactNode;
  onRetry?: () => void;
}

export function LoadingWrapper({ loading, error, children, skeleton, onRetry }: LoadingWrapperProps) {
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-red-400 mb-2">Error</h3>
          <p className="text-text-dim mb-4">{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-accent text-bg font-bold rounded-lg hover:bg-accent-bright transition-all"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return skeleton || (
      <div className="text-center py-12">
        <LoadingSpinner size="large" />
        <p className="text-text-dim mt-4">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}

// Button loading state
interface LoadingButtonProps {
  loading: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}

export function LoadingButton({ 
  loading, 
  disabled, 
  children, 
  onClick, 
  className = '', 
  type = 'button' 
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading && <LoadingSpinner size="small" />}
      {children}
    </button>
  );
}

// Empty state component
interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-bg-card rounded-full flex items-center justify-center">
          <span className="text-2xl">{icon}</span>
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-text-dim">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-accent text-bg font-bold rounded-lg hover:bg-accent-bright transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}