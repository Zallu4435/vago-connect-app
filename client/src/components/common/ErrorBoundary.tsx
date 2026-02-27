"use client";
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

  static getDerivedStateFromError(_: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });
    if (this.props.onError) this.props.onError(error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  handleGotoLogin = () => {
    if (typeof window !== "undefined") window.location.href = "/login";
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { fallbackUI, children } = this.props;

    if (!hasError) return children;
    if (fallbackUI) return fallbackUI;

    return (
      <div className="
        h-screen w-screen bg-ancient-bg-dark text-ancient-text-light
        flex items-center justify-center px-4 sm:px-6
        overflow-auto
      ">
        <div className="
          max-w-xl w-full text-center
          bg-ancient-bg-medium rounded-2xl shadow-lg border border-ancient-border-stone
          p-6 sm:p-8
        ">
          <div className="
            text-6xl sm:text-7xl mb-4 animate-pulse text-ancient-icon-glow
          ">😔</div>
          <h1 className="
            text-xl sm:text-2xl font-bold text-ancient-icon-glow mb-2
          ">
            Something went wrong
          </h1>
          <p className="text-base sm:text-lg text-ancient-text-muted mb-4">
            We&apos;re sorry for the inconvenience. The app ran into an unexpected error.
          </p>          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <button
              onClick={this.handleReload}
              className="
                bg-ancient-bubble-user hover:bg-ancient-bubble-user-light
                text-ancient-text-light px-6 py-2 rounded-lg shadow
                transition-colors w-full sm:w-auto
                text-base sm:text-lg
              "
              aria-label="Reload application"
            >
              Reload App
            </button>
            <button
              onClick={this.handleGotoLogin}
              className="
                bg-ancient-icon-glow/80 hover:bg-ancient-icon-glow
                text-ancient-bg-dark px-6 py-2 rounded-lg shadow
                transition-colors w-full sm:w-auto
                text-base sm:text-lg
              "
              aria-label="Go to login"
            >
              Go to Login
            </button>
          </div>

          <p className="text-xs sm:text-sm text-ancient-text-muted">
            If the problem persists, please contact support
          </p>
        </div >
      </div >
    );
  }
}

export default ErrorBoundary;
