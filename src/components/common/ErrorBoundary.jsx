// src/components/common/ErrorBoundary.jsx
/* eslint-disable */

import React from 'react';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // Here you could also log to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetErrorBoundary: this.handleRetry,
          retryCount: this.state.retryCount,
        });
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            {/* Error Message */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">
                Something went wrong
              </h2>
              <p className="text-muted-foreground">
                An unexpected error occurred. This has been logged and we'll
                look into it.
              </p>

              {/* Show retry count if > 0 */}
              {this.state.retryCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  Retry attempt: {this.state.retryCount}
                </Badge>
              )}
            </div>

            {/* Error Details in Development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-muted/50 rounded-lg p-4 text-xs space-y-2">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Bug className="w-4 h-4" />
                  <span className="font-medium">
                    Development Error Details:
                  </span>
                </div>
                <div className="text-destructive font-mono break-all">
                  {this.state.error.message}
                </div>
                {this.state.errorInfo && (
                  <details className="text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                className="flex items-center space-x-2"
                disabled={this.state.retryCount >= 3}>
                <RefreshCw className="w-4 h-4" />
                <span>
                  {this.state.retryCount >= 3
                    ? 'Max retries reached'
                    : 'Try Again'}
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="flex items-center space-x-2">
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-muted-foreground">
              If this problem persists, please{' '}
              <a
                href="https://github.com/prabapro/xxx/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline">
                report it on GitHub
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  return (error, errorInfo) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by hook:', error, errorInfo);
    }

    // Here you could also log to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  };
};

// Simple error fallback component
export const SimpleErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="p-6 text-center space-y-4 border border-destructive/20 bg-destructive/5 rounded-lg">
    <div className="text-destructive font-medium">Something went wrong</div>
    <div className="text-sm text-muted-foreground">
      {error?.message || 'An unexpected error occurred'}
    </div>
    <Button
      size="sm"
      variant="outline"
      onClick={resetErrorBoundary}
      className="mx-auto">
      Try again
    </Button>
  </div>
);

export default ErrorBoundary;
