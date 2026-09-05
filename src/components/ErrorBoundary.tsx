import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in React component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-900/20 rounded-full blur-[160px] pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-900/20 rounded-full blur-[160px] pointer-events-none" />

          <div className="max-w-md w-full bg-zinc-950/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Application Rendering Issue
              </h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                An unexpected error occurred while loading this view. The application has safely caught the error to prevent a blank screen.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-left overflow-x-auto max-h-32 text-[11px] font-mono text-red-300/90 leading-tight">
                {this.state.error.message || 'Unknown error'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Reload App
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="py-3 px-4 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-bold transition-all border border-white/5 cursor-pointer active:scale-95"
              >
                Reset Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
