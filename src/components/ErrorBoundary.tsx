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

interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;
  onResetToHome?: () => void;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<SectionErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in section [${this.props.sectionName || 'view'}]:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 md:p-12 flex flex-col items-center justify-center min-h-[420px] text-center">
          <div className="max-w-md w-full bg-[#0b0d14]/90 border border-amber-500/30 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                {this.props.sectionName ? `${this.props.sectionName} Encountered an Issue` : 'View Rendering Interrupted'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                IPTV.Menu Pro isolated this issue so your player, playlists, and other sections stay active.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-black/60 border border-white/5 rounded-xl p-2.5 text-left text-[10px] font-mono text-amber-300/80 max-h-20 overflow-y-auto">
                {this.state.error.message || 'Unknown render error'}
              </div>
            )}

            <div className="flex items-center gap-3 w-full mt-1">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#7c5cff] to-[#00e0c6] hover:brightness-110 text-black font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#7c5cff]/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              {this.props.onResetToHome && (
                <button
                  type="button"
                  onClick={this.props.onResetToHome}
                  className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer flex items-center gap-1.5"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
