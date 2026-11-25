/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import {
  X,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  ShieldCheck,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialIsSignUp?: boolean;
  initialMode?: 'login' | 'signup' | 'reset';
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialIsSignUp = false,
  initialMode,
}: AuthModalProps) {
  const resolveMode = () =>
    initialMode || (initialIsSignUp ? 'signup' : 'login');

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(resolveMode());
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
    loading,
    errorMessage,
    successMessage,
    clearError,
    clearSuccess,
  } = useStore();

  useEffect(() => {
    setMode(resolveMode());
    setLocalError(null);
    clearError();
    clearSuccess();
  }, [initialIsSignUp, initialMode, isOpen]);

  if (!isOpen) return null;

  const switchMode = (next: 'login' | 'signup' | 'reset') => {
    setMode(next);
    setLocalError(null);
    clearError();
    clearSuccess();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    clearSuccess();

    if (mode === 'reset') {
      if (!email.trim()) {
        setLocalError('Please enter your account email address.');
        return;
      }
      await sendPasswordReset(email);
      return;
    }

    if (mode === 'signup') {
      if (!firstName.trim() || !lastName.trim()) {
        setLocalError('Please enter both your first and last name.');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }

      const ok = await signUpWithEmail(firstName, lastName, email, password);
      if (ok) {
        onClose();
        onSuccess?.();
      }
      return;
    }

    // Login mode
    const ok = await signInWithEmail(email, password);
    if (ok) {
      onClose();
      onSuccess?.();
    }
  };

  const activeError = localError || errorMessage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[92vh] flex flex-col space-y-5"
      >
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 blur-xl rounded-full pointer-events-none" />
        <div className="absolute top-4 right-14 flex items-center space-x-1 border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-400">
          <ShieldCheck size={10} />
          <span>FDIC INSURED</span>
        </div>

        <div className="flex justify-between items-start mt-1">
          <div>
            <Logo withBackground={false} className="w-8 h-8 text-emerald-500 mb-3" />
            <h3 className="text-xl font-bold tracking-tight text-white font-sans">
              {mode === 'signup'
                ? 'Open Morning Bright Account'
                : mode === 'reset'
                ? 'Reset Account Password'
                : 'Log In to Morning Bright'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <Lock size={10} className="text-slate-500" />
              <span>Email & Password encrypted banking session</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Switcher Tabs (Login vs Open Account) */}
        {mode !== 'reset' && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-white/5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Open Account
            </button>
          </div>
        )}

        {/* ERROR BOX */}
        {activeError && (
          <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-start space-x-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="leading-normal">{activeError}</span>
          </div>
        )}

        {/* SUCCESS BOX */}
        {successMessage && (
          <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs flex items-start space-x-2">
            <Check size={16} className="shrink-0 mt-0.5" />
            <span className="leading-normal">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  First Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Alex"
                    className="w-full h-11 pl-9 pr-3 rounded-xl border border-white/10 bg-slate-950/70 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Morgan"
                  className="w-full h-11 px-3 rounded-xl border border-white/10 bg-slate-950/70 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-white/10 bg-slate-950/70 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter your password'}
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-slate-950/70 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-white/10 bg-slate-950/70 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'signup'
                    ? 'Open Account'
                    : mode === 'reset'
                    ? 'Send Password Reset Email'
                    : 'Log In Securely'}
                </span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="flex flex-col space-y-2 text-center pt-3 border-t border-white/5">
          {mode === 'reset' ? (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-[11px] text-slate-400 hover:text-emerald-400 font-mono underline underline-offset-2 cursor-pointer"
            >
              Back to Email Login
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
              className="text-[11px] text-slate-400 hover:text-emerald-400 font-mono underline underline-offset-2 cursor-pointer"
            >
              {mode === 'signup'
                ? 'Already have an account? Log In'
                : 'New to Morning Bright? Open an Account'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
