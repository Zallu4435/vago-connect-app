import React, { Component, ReactNode, ErrorInfo } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackUI?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console for debugging; could be extended to remote logging
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
    if (this.props.onError) this.props.onError(error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  handleGotoLogin = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { fallbackUI, children } = this.props;

    if (!hasError) return children;

    if (fallbackUI) return fallbackUI;

    const isDev = process.env.NODE_ENV === "development";

    return (
      <div className="h-screen w-screen bg-panel-header-background text-white flex items-center justify-center px-6">
        <div className="max-w-xl w-full text-center">
          <div className="text-5xl mb-4">😔</div>
          <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-secondary mb-4">
            We're sorry for the inconvenience. The app ran into an unexpected error.
          </p>

          {isDev && error && (
            <div className="text-left bg-[#1f2c33] border border-[#2b3942] rounded-lg p-4 mb-4 overflow-auto max-h-60">
              <p className="font-mono text-xs text-red-300 whitespace-pre-wrap mb-2">
                {String(error?.message || error)}
              </p>
              {errorInfo?.componentStack && (
                <pre className="font-mono text-[10px] text-gray-300 whitespace-pre-wrap">
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg"
              aria-label="Reload application"
            >
              Reload App
            </button>
            <button
              onClick={this.handleGotoLogin}
              className="bg-[#2b3942] hover:bg-[#33464f] text-white px-4 py-2 rounded-lg"
              aria-label="Go to login"
            >
              Go to Login
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-6">
            If the problem persists, please contact support
          </p>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
