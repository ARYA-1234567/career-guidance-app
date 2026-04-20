import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-rose-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-2xl animate-pulse" />
              <AlertTriangle size={32} className="text-rose-500 relative z-10" />
            </div>

            <h1 className="text-2xl font-black text-white mb-2 tracking-tight">System Glitch Detected</h1>
            <p className="text-zinc-400 text-sm mb-8 font-medium leading-relaxed">
              A neural pathway misfired while rendering this view. This usually occurs during background updates. Let's reset the connection.
            </p>

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-white hover:bg-zinc-200 text-black rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <RefreshCcw size={16} className="group-hover:-rotate-180 transition-transform duration-500" />
              Reload Application
            </button>
            
            <p className="mt-6 text-[10px] text-zinc-600 font-mono tracking-tighter truncate max-w-full">
              ERR_CODE: {this.state.errorMsg || 'UI_COMPONENT_FAILURE'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
