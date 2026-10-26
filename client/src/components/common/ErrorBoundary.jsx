import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Button from '../ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CodeCraft App Error Boundary caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper flex items-center justify-center p-6 text-ink">
          <div className="max-w-md w-full bg-surface border border-line rounded-lg p-8 shadow-xs text-center">
            <div className="w-12 h-12 rounded-full bg-danger-soft text-danger mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-danger block mb-1">
              Application Error (500)
            </span>

            <h1 className="font-serif font-bold text-2xl text-ink mb-2">
              Something went wrong
            </h1>

            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed mb-6">
              An unexpected client error occurred while rendering this view. Your session and saved data are intact.
            </p>

            {this.state.error && (
              <div className="p-3 bg-paper border border-line rounded text-left text-[11px] font-mono text-ink-muted overflow-auto max-h-32 mb-6">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={this.handleReload}
                leftIcon={RotateCcw}
                className="w-full sm:w-auto"
              >
                Reload Page
              </Button>
              <a href="/" className="w-full sm:w-auto">
                <Button variant="secondary" size="md" leftIcon={Home} className="w-full">
                  Return Home
                </Button>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
