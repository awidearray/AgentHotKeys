'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-red-400 mb-2">
                Something went wrong
              </h2>
              <p className="text-text-dim text-sm mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <div className="p-4 bg-bg-card border border-red-500/30 rounded-lg text-left">
                <h4 className="font-bold text-sm mb-2">What you can do:</h4>
                <ul className="text-sm text-text-dim space-y-1">
                  <li>• Refresh the page</li>
                  <li>• Check your internet connection</li>
                  <li>• Try again in a few moments</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-accent text-bg font-bold rounded-lg hover:bg-accent-bright transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook for handling async errors in functional components
export function useAsyncError() {
  const [, setError] = React.useState();
  return React.useCallback(
    (e: Error) => {
      setError(() => {
        throw e;
      });
    },
    [setError]
  );
}

// Component for handling API errors
interface ApiErrorProps {
  error: string | null;
  onRetry?: () => void;
  loading?: boolean;
}

export function ApiError({ error, onRetry, loading }: ApiErrorProps) {
  if (!error) return null;

  return (
    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <span className="text-red-400 text-lg">⚠️</span>
        <div className="flex-1">
          <p className="text-red-400 font-medium text-sm mb-2">Error</p>
          <p className="text-text-dim text-sm mb-3">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 text-sm"
            >
              {loading ? 'Retrying...' : 'Try Again'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Component for handling network errors
export function NetworkError({ onRetry, loading }: { onRetry?: () => void; loading?: boolean }) {
  return (
    <div className="text-center py-12">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
          <span className="text-2xl">📡</span>
        </div>
        <h3 className="text-xl font-bold mb-2">Network Error</h3>
        <p className="text-text-dim mb-4">
          Unable to connect to the server. Please check your internet connection.
        </p>
        <div className="p-4 bg-bg-card border border-yellow-500/30 rounded-lg text-left max-w-md mx-auto">
          <h4 className="font-bold text-sm mb-2">Troubleshooting:</h4>
          <ul className="text-sm text-text-dim space-y-1">
            <li>• Check your internet connection</li>
            <li>• Make sure the server is running</li>
            <li>• Try refreshing the page</li>
            <li>• Clear your browser cache</li>
          </ul>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={loading}
          className="px-6 py-3 bg-accent text-bg font-bold rounded-lg hover:bg-accent-bright transition-all disabled:opacity-50"
        >
          {loading ? 'Connecting...' : 'Try Again'}
        </button>
      )}
    </div>
  );
}