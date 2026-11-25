/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Logo } from './Logo';

interface AdminPasscodeGateProps {
  onUnlocked: (token: string) => void;
  onExit: () => void;
}

export function AdminPasscodeGate({ onUnlocked, onExit }: AdminPasscodeGateProps) {
  const [statusLoading, setStatusLoading] = useState(true);
  const [mode, setMode] = useState<'env' | 'claimed' | 'unclaimed'>('env');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      try {
        const res = await fetch('/api/admin/status');
        if (res.ok && active) {
          const data = await res.json();
          if (data.mode === 'unclaimed' || data.mode === 'claimed' || data.mode === 'env') {
            setMode(data.mode);
          }
        }
      } catch {
        // Default to standard verify mode if status check fails transiently
      } finally {
        if (active) setStatusLoading(false);
      }
    };
    loadStatus();
    return () => {
      active = false;
    };
  }, []);

  const strengthChecks = {
    length: passcode.length >= 12,
    upper: /[A-Z]/.test(passcode),
    lower: /[a-z]/.test(passcode),
    digit: /[0-9]/.test(passcode),
  };
  const isPasscodeStrong =
    strengthChecks.length &&
    strengthChecks.upper &&
    strengthChecks.lower &&
    strengthChecks.digit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'unclaimed') {
      if (!isPasscodeStrong) {
        setError(
          'Passcode must be at least 12 characters with uppercase, lowercase, and numeric characters.',
        );
        return;
      }
      if (passcode !== confirmPasscode) {
        setError('Passcodes do not match.');
        return;
      }
    } else if (!passcode) {
      setError('Please enter your administrator passcode.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint =
        mode === 'unclaimed' ? '/api/admin/claim' : '/api/admin/verify-passcode';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.token) {
        if (res.status === 409 && mode === 'unclaimed') {
          setMode('claimed');
        }
        setError(data.error || 'Authentication failed. Please check your passcode.');
        return;
      }

      setPasscode('');
      setConfirmPasscode('');
      onUnlocked(data.token);
    } catch {
      setError('Unable to reach verification server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo className="w-9 h-9" withBackground={true} />
            <div>
              <span className="font-bold text-base text-white block leading-tight">
                Morning Bright
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                Operations Console
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Lock size={17} />
          </div>
        </div>

        {statusLoading ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-3">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-slate-400">
              Checking vault status...
            </span>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-white">
                {mode === 'unclaimed'
                  ? 'Initialize Admin Passcode'
                  : 'Passcode-Only Admin Access'}
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                {mode === 'unclaimed'
                  ? 'Set your strong administrator passcode once to lock the Operations Console. For production persistence, also add ADMIN_PASSCODE in Settings → Secrets.'
                  : 'Enter your strong administrator passcode to unlock the Operations Console.'}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-start space-x-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-passcode-input"
                  className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block"
                >
                  {mode === 'unclaimed' ? 'New Strong Passcode' : 'Administrator Passcode'}
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    id="admin-passcode-input"
                    type={showPasscode ? 'text' : 'password'}
                    required
                    autoFocus
                    autoComplete={mode === 'unclaimed' ? 'new-password' : 'current-password'}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter strong passcode"
                    className="w-full h-12 pl-10 pr-11 rounded-xl border border-white/10 bg-slate-950 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono tracking-wide"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    aria-label="Toggle passcode visibility"
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === 'unclaimed' && (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="admin-passcode-confirm"
                      className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block"
                    >
                      Confirm Strong Passcode
                    </label>
                    <div className="relative">
                      <KeyRound size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
                      <input
                        id="admin-passcode-confirm"
                        type={showPasscode ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={confirmPasscode}
                        onChange={(e) => setConfirmPasscode(e.target.value)}
                        placeholder="Re-enter passcode"
                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-white/10 bg-slate-950 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono tracking-wide"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/80 border border-white/5 text-[11px]">
                    {[
                      { ok: strengthChecks.length, label: '12+ characters' },
                      { ok: strengthChecks.upper, label: 'Uppercase (A-Z)' },
                      { ok: strengthChecks.lower, label: 'Lowercase (a-z)' },
                      { ok: strengthChecks.digit, label: 'Number (0-9)' },
                    ].map((req, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center space-x-1.5 ${
                          req.ok ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        <span>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>
                      {mode === 'unclaimed'
                        ? 'Save Passcode & Unlock Console'
                        : 'Unlock Admin Panel'}
                    </span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={onExit}
                className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Return to Website</span>
              </button>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Server-Verified
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
