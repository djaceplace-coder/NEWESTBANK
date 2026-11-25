/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public declare props: ErrorBoundaryProps;
  public state: ErrorBoundaryState = { hasError: false, message: '' };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let friendly = error.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed.error === 'string') {
        friendly = parsed.error.includes('Missing or insufficient permissions')
          ? 'Access denied by Firestore security rules. Please verify your account permissions or sign in again.'
          : parsed.error;
      }
    } catch {
      // keep raw message
    }
    return { hasError: true, message: friendly };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/20 rounded-2xl p-6 md:p-8 shadow-2xl space-y-5 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
              <ShieldAlert size={28} />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{this.state.message}</p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-10 px-5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs flex items-center space-x-2 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
