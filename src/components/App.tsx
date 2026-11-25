/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { isBootstrappedAdminEmail } from '../firebase';
import { LandingPage } from './LandingPage';
import { AuthModal } from './AuthModal';
import { AdminPasscodeGate } from './AdminPasscodeGate';
import { OnboardingFlow } from './OnboardingFlow';
import { Sidebar } from './Sidebar';
import { Logo } from './Logo';
import { MobileNav } from './MobileNav';
import { NotificationBell } from './NotificationBell';
import { DashboardView } from './DashboardView';
import { CardsView } from './CardsView';
import { TransfersView } from './TransfersView';
import { BillsView } from './BillsView';
import { SavingsView } from './SavingsView';
import { LoansView } from './LoansView';
import { InvestingView } from './InvestingView';
import { SettingsView } from './SettingsView';
import { SupportView } from './SupportView';
import { AdminPanel } from './AdminPanel';
import {
  LogOut,
  X,
  User,
  ShieldAlert,
  ShieldCheck,
  Lock,
  LockKeyhole,
  ChevronDown,
  Settings,
  Download,
  Mail,
  ArrowLeft,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Toaster } from 'react-hot-toast';

declare global {
  interface Window {
    deferredPrompt: any;
    installPWA: () => void;
  }
}

const isAdminPathname = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  return (
    path.startsWith('/admin') ||
    hash.startsWith('#/admin') ||
    search.get('admin') === '1'
  );
};

export default function App() {
  const {
    user,
    settings,
    authChecked,
    loading,
    errorMessage,
    successMessage,
    clearError,
    logOutUser,
    initAuthListener,
    signInWithEmail,
    sendPasswordReset,
    requestAdminVerificationEmail,
    checkAndUnlockAdmin,
    signInAdminWithGoogle,
    connectAdminFirebaseSession,
  } = useStore();

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(isAdminPathname);
  const [currentTab, setCurrentTab] = useState<string>(isAdminPathname() ? 'admin' : 'home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [autoOpenKyc, setAutoOpenKyc] = useState(false);

  // Server-verified HMAC Bearer token held strictly in React memory (never localStorage/sessionStorage)
  const [adminPasscodeToken, setAdminPasscodeToken] = useState<string | null>(null);
  const [adminAuthEmail, setAdminAuthEmail] = useState<string>('adereraadenike@gmail.com');
  const [adminSyncBusy, setAdminSyncBusy] = useState(false);
  const [adminSyncNeeded, setAdminSyncNeeded] = useState(false);
  const [syncPassword, setSyncPassword] = useState('');
  const [showSyncPassword, setShowSyncPassword] = useState(false);
  const [adminUnlockBusy, setAdminUnlockBusy] = useState(false);
  const prevUserUidRef = useRef<string | null>(null);

  const [isPWA, setIsPWA] = useState(false);

  // Clear in-memory admin passcode token if user signs out from any view
  useEffect(() => {
    const currentUid = user?.uid ?? null;
    if (prevUserUidRef.current && !currentUid) {
      setAdminPasscodeToken(null);
      setAdminSyncNeeded(false);
      setSyncPassword('');
    }
    prevUserUidRef.current = currentUid;
  }, [user?.uid]);

  // Sync /admin URL path with browser history
  useEffect(() => {
    const handlePopState = () => {
      const onAdmin = isAdminPathname();
      setIsAdminRoute(onAdmin);
      if (onAdmin) {
        setCurrentTab('admin');
      } else if (currentTab === 'admin') {
        setCurrentTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentTab]);

  // If authenticated user arrived via /admin, keep them on the admin tab
  useEffect(() => {
    if (user && isAdminRoute) {
      setCurrentTab('admin');
    }
  }, [user, isAdminRoute]);

  const handleChangeTab = (tab: string) => {
    setCurrentTab(tab);
    if (tab === 'admin') {
      if (!isAdminPathname()) {
        window.history.replaceState(null, '', '/admin');
      }
      setIsAdminRoute(true);
    } else if (isAdminPathname()) {
      window.history.replaceState(null, '', '/');
      setIsAdminRoute(false);
    }
  };

  const exitAdminRouteToSite = () => {
    window.history.replaceState(null, '', '/');
    setIsAdminRoute(false);
    setCurrentTab('home');
    setAdminPasscodeToken(null);
    setAdminSyncNeeded(false);
    setSyncPassword('');
    clearError();
  };

  const handleSecureLogOut = async () => {
    setAdminPasscodeToken(null);
    setAdminSyncNeeded(false);
    setSyncPassword('');
    await logOutUser();
  };

  const handleAdminPasscodeUnlocked = async ({
    token,
    passcode,
    adminAuthEmail: resolvedEmail,
  }: {
    token: string;
    passcode: string;
    adminAuthEmail?: string;
  }) => {
    const targetEmail = (resolvedEmail || 'adereraadenike@gmail.com')
      .trim()
      .toLowerCase();
    setAdminPasscodeToken(token);
    setAdminAuthEmail(targetEmail);
    setCurrentTab('admin');
    setAdminSyncNeeded(false);
    setSyncPassword('');
    clearError();

    if (!user) {
      setAdminSyncBusy(true);
      const result = await connectAdminFirebaseSession(targetEmail, passcode);
      setAdminSyncBusy(false);
      if (result === 'needs_password_sync') {
        setAdminSyncNeeded(true);
      }
    }
  };

  // Setup PWA listener
  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    setIsPWA(media.matches);

    const listener = (e: MediaQueryListEvent) => setIsPWA(e.matches);
    media.addEventListener('change', listener);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
    });

    window.installPWA = async () => {
      if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          window.deferredPrompt = null;
        }
      } else {
        setShowInstallModal(true);
      }
    };

    return () => media.removeEventListener('change', listener);
  }, []);

  // Startup persistent auth session restore effect
  useEffect(() => {
    const unsub = initAuthListener();
    return () => {
      unsub?.();
    };
  }, [initAuthListener]);

  // Theme Sync effect (Light / Dark / System)
  useEffect(() => {
    const applyTheme = (t: 'light' | 'dark' | 'system') => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');

      let resolvedTheme: 'light' | 'dark' = 'dark';
      if (t === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolvedTheme = systemPrefersDark ? 'dark' : 'light';
      } else {
        resolvedTheme = t;
      }

      root.classList.add(resolvedTheme);
      localStorage.setItem('mb_theme', t);
    };

    const targetTheme = settings?.theme || (localStorage.getItem('mb_theme') as any) || 'light';
    applyTheme(targetTheme);

    if (targetTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings?.theme]);

  const handleOpenAuth = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleOpenSignUp = () => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleOpenForgotPassword = () => {
    setAuthModalMode('reset');
    setIsAuthModalOpen(true);
  };

  // If user is suspended, block navigation and display recovery gate
  if (user?.isSuspended) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-red-500/10 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md bg-slate-900 border border-red-500/10 rounded-2xl p-6 md:p-8 shadow-2xl space-y-5 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 mb-2">
            <LockKeyhole size={32} />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-medium tracking-tight text-white">Account Suspended</h3>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Morning Bright Risk Operations
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            We registered abnormal transactional activity. This account has been temporarily restricted for your safety. Please contact our support team.
          </p>

          <div className="pt-4 border-t border-white/5 w-full flex flex-col space-y-3">
            <button
              onClick={handleSecureLogOut}
              className="h-11 rounded-lg bg-white text-black font-bold text-xs cursor-pointer"
            >
              Sign Out Securely
            </button>
            <div className="text-[10px] font-mono text-slate-600 uppercase font-bold tracking-widest text-center mt-1">
              Please contact support
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine whether authenticated non-admin client needs 3-step first-login onboarding
  const needsFirstLoginOnboarding = Boolean(
    user &&
      !user.isAdmin &&
      !user.isVerified &&
      user.onboardingCompleted !== true &&
      !isAdminRoute,
  );

  // Render Admin view once inside portal (requires server-verified passcode token in memory)
  const renderAdminView = () => {
    if (!adminPasscodeToken) {
      return (
        <div className="flex-1 overflow-y-auto">
          <AdminPasscodeGate
            onUnlocked={handleAdminPasscodeUnlocked}
            onExit={() => handleChangeTab('home')}
          />
        </div>
      );
    }

    if (!user) return null;

    if (user.isAdmin) {
      return (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-slate-900 text-slate-200 border-b border-white/10 px-4 sm:px-6 py-2 flex items-center justify-between text-xs shrink-0">
            <span className="inline-flex items-center space-x-2 font-mono text-emerald-400">
              <ShieldCheck size={14} />
              <span>Passcode-Verified Admin Session Active</span>
            </span>
            <button
              type="button"
              onClick={() => setAdminPasscodeToken(null)}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer"
            >
              <Lock size={12} />
              <span>Lock Console</span>
            </button>
          </div>
          <AdminPanel />
        </div>
      );
    }

    const isRecognizedAdminEmail = isBootstrappedAdminEmail(user.email);

    if (isRecognizedAdminEmail) {
      return (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex items-center justify-center pb-24 md:pb-10">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Passcode Verified — Activate Firestore Admin Link
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Your passcode is verified. Complete this one-time Firebase check for{' '}
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {user.email}
                  </span>{' '}
                  so Firestore grants permanent read/write access to all client ledgers.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={adminUnlockBusy || loading}
              onClick={async () => {
                setAdminUnlockBusy(true);
                const ok = await signInAdminWithGoogle();
                if (ok) setCurrentTab('admin');
                setAdminUnlockBusy(false);
              }}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck size={15} />
              <span>One-Click Owner Verification</span>
            </button>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={adminUnlockBusy}
                onClick={async () => {
                  setAdminUnlockBusy(true);
                  await requestAdminVerificationEmail();
                  setAdminUnlockBusy(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs font-bold inline-flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Mail size={15} />
                <span>Send Verification Link</span>
              </button>
              <button
                type="button"
                disabled={adminUnlockBusy}
                onClick={async () => {
                  setAdminUnlockBusy(true);
                  await checkAndUnlockAdmin();
                  setAdminUnlockBusy(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15 text-white text-xs font-bold inline-flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={15} className={adminUnlockBusy ? 'animate-spin' : ''} />
                <span>Check Verification</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleChangeTab('home')}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold cursor-pointer"
              >
                ← Return to Client Dashboard
              </button>
              <button
                type="button"
                onClick={handleSecureLogOut}
                className="text-red-500 hover:text-red-400 font-semibold cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex items-center justify-center pb-24 md:pb-10">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <ShieldAlert size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Administrator Account Required
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Your passcode is verified, but the currently active client session (
            <span className="font-mono">{user.email}</span>) does not hold Firestore admin database permissions. Sign out and connect an authorized administrator session to manage client records.
          </p>
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                const ok = await signInAdminWithGoogle();
                if (ok) setCurrentTab('admin');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck size={15} />
              <span>One-Click Owner Sign-In</span>
            </button>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => handleChangeTab('home')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Return to Dashboard
              </button>
              <button
                type="button"
                onClick={handleSecureLogOut}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300 flex flex-col">
      <Toaster position="top-center" />
      {!isPWA && !isAdminRoute && (
        <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between z-50 shadow-sm relative">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center shrink-0">
              <Download size={14} />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Install Morning Bright App</p>
            </div>
          </div>
          <button
            onClick={() => window.installPWA?.()}
            className="px-3 py-1 bg-white text-emerald-600 rounded-md text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Install
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col relative w-full h-full">
        {!authChecked ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Logo className="w-10 h-10" withBackground={true} />
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
              Restoring secure session...
            </p>
          </div>
        ) : isAdminRoute && !adminPasscodeToken ? (
          // PASSCODE-ONLY /admin ACCESS GATE (ZERO EMAIL INPUT)
          <AdminPasscodeGate
            onUnlocked={handleAdminPasscodeUnlocked}
            onExit={exitAdminRouteToSite}
          />
        ) : !user && isAdminRoute && adminPasscodeToken ? (
          // PASSCODE VERIFIED — ZERO-EMAIL DATABASE LINKING
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={28} />
                </div>
                <div className="space-y-1.5">
                  <h1 className="text-xl font-bold text-white">
                    {adminSyncBusy ? 'Unlocking Operations Console...' : 'Passcode Verified'}
                  </h1>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {adminSyncBusy
                      ? 'Connecting your encrypted Firestore administrator session...'
                      : 'Authorize your administrator database session below to load live client accounts, balances, KYC queues, and management chat.'}
                  </p>
                </div>
              </div>

              {adminSyncBusy ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px] font-mono text-slate-400">
                    Establishing live ledger link...
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {errorMessage && (
                    <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-start space-x-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                  {successMessage && (
                    <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs">
                      {successMessage}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={loading}
                    onClick={async () => {
                      const ok = await signInAdminWithGoogle();
                      if (ok) setCurrentTab('admin');
                    }}
                    className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>One-Click Owner Sign-In</span>
                      </>
                    )}
                  </button>

                  {adminSyncNeeded && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!syncPassword) return;
                        const ok = await signInWithEmail(adminAuthEmail, syncPassword);
                        if (ok) {
                          setSyncPassword('');
                          setAdminSyncNeeded(false);
                          setCurrentTab('admin');
                        }
                      }}
                      className="pt-4 border-t border-white/10 space-y-3"
                    >
                      <label
                        htmlFor="owner-sync-password"
                        className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block"
                      >
                        Or Enter Existing Owner Account Password
                      </label>
                      <div className="relative">
                        <KeyRound size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
                        <input
                          id="owner-sync-password"
                          type={showSyncPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          value={syncPassword}
                          onChange={(e) => setSyncPassword(e.target.value)}
                          placeholder="Existing account password"
                          className="w-full h-11 pl-10 pr-11 rounded-xl border border-white/10 bg-slate-950 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSyncPassword(!showSyncPassword)}
                          aria-label="Toggle password visibility"
                          className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showSyncPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Unlock With Password
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => sendPasswordReset(adminAuthEmail)}
                          className="px-3 h-10 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-medium cursor-pointer disabled:opacity-50"
                        >
                          Reset Password
                        </button>
                      </div>
                    </form>
                  )}

                  <button
                    type="button"
                    onClick={exitAdminRouteToSite}
                    className="w-full inline-flex items-center justify-center space-x-1.5 text-xs text-slate-400 hover:text-white pt-2 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Lock Console & Return to Website</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : !user ? (
          // PUBLIC FACING SITE
          <div className="flex flex-col flex-1">
            <LandingPage
              onEnterApp={handleOpenAuth}
              onSignUp={handleOpenSignUp}
              onForgotPassword={handleOpenForgotPassword}
            />
            <AnimatePresence>
              {isAuthModalOpen && (
                <AuthModal
                  isOpen={isAuthModalOpen}
                  onClose={() => setIsAuthModalOpen(false)}
                  onSuccess={() => handleChangeTab(isAdminRoute ? 'admin' : 'home')}
                  initialMode={authModalMode}
                />
              )}
            </AnimatePresence>
          </div>
        ) : needsFirstLoginOnboarding ? (
          // FIRST-LOGIN 3-QUESTION ONBOARDING WORKFLOW
          <OnboardingFlow
            onComplete={({ openKyc }) => {
              setAutoOpenKyc(openKyc);
              handleChangeTab('home');
            }}
          />
        ) : (
          // PRIVATE DASHBOARD CLIENT PORTAL
          <div
            className={`flex flex-1 w-full relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors ${
              isPWA
                ? 'max-w-[480px] mx-auto border-x border-slate-200 dark:border-white/5 shadow-2xl z-0'
                : 'z-0'
            }`}
          >
            {/* DESKTOP SIDEBAR */}
            <div className={isPWA ? 'hidden' : 'hidden md:block'}>
              <Sidebar
                currentTab={currentTab}
                onChangeTab={handleChangeTab}
                onLogOut={handleSecureLogOut}
              />
            </div>

            {/* MAIN PAGE BODY */}
            <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">
              {/* MOBILE NAVIGATION HEADER */}
              <header
                className={`${
                  isPWA ? 'flex' : 'md:hidden flex'
                } h-16 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 items-center justify-between px-4 sm:px-6 z-45 transition-colors`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Logo className="w-7 h-7 shrink-0" withBackground={true} />
                  <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                    Hi, {user?.firstName || user?.lastName || 'Client'}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-slate-900 dark:text-white relative z-40 shrink-0">
                  <NotificationBell />
                  <button
                    type="button"
                    onClick={() => setIsHeaderDropdownOpen(!isHeaderDropdownOpen)}
                    className="flex items-center space-x-1.5 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <span className="text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-mono font-bold">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform ${
                        isHeaderDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isHeaderDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20 z-50 overflow-hidden"
                      >
                        <div className="p-1.5 flex flex-col space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              handleChangeTab('settings');
                              setIsHeaderDropdownOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
                          >
                            <User size={14} className="text-emerald-500" />
                            <span>Profile Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleChangeTab('settings');
                              setIsHeaderDropdownOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
                          >
                            <Settings size={14} className="text-emerald-500" />
                            <span>Security Settings</span>
                          </button>

                          {user.isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                handleChangeTab('admin');
                                setIsHeaderDropdownOpen(false);
                              }}
                              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400 font-semibold cursor-pointer"
                            >
                              <ShieldAlert size={14} />
                              <span>Admin Panel</span>
                            </button>
                          )}

                          <div className="h-px bg-slate-200 dark:bg-white/10 my-1 mx-2" />

                          <button
                            type="button"
                            onClick={() => {
                              setIsHeaderDropdownOpen(false);
                              handleSecureLogOut();
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-xs text-red-600 dark:text-red-400 font-medium cursor-pointer"
                          >
                            <LogOut size={14} />
                            <span>Log Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </header>

              {/* VIEWS SWAP CONTAINER */}
              <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex flex-col overflow-hidden min-w-0"
                  >
                    {currentTab === 'home' && (
                      <DashboardView
                        onOpenTransfer={() => handleChangeTab('transfers')}
                        onNavigateTab={handleChangeTab}
                        autoOpenKyc={autoOpenKyc}
                        onConsumedAutoOpenKyc={() => setAutoOpenKyc(false)}
                      />
                    )}
                    {currentTab === 'transfers' && <TransfersView />}
                    {currentTab === 'bills' && <BillsView />}
                    {currentTab === 'cards' && <CardsView />}
                    {currentTab === 'savings' && <SavingsView />}
                    {currentTab === 'loans' && <LoansView />}
                    {currentTab === 'investing' && <InvestingView />}
                    {currentTab === 'support' && <SupportView />}
                    {currentTab === 'settings' && <SettingsView />}
                    {currentTab === 'admin' && renderAdminView()}
                  </motion.div>
                </AnimatePresence>
              </main>

              {/* MOBILE BOTTOM NAVIGATION */}
              <MobileNav currentTab={currentTab} onChangeTab={handleChangeTab} />
            </div>
          </div>
        )}
      </div>

      {/* PWA INSTALL MODAL */}
      <AnimatePresence>
        {showInstallModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-xl relative"
            >
              <button
                onClick={() => setShowInstallModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                  <Download className="w-8 h-8 text-emerald-500" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Install App
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    To install Morning Bright locally, tap your browser&apos;s{' '}
                    <strong className="text-slate-900 dark:text-slate-200">Share</strong> menu
                    (iOS) or{' '}
                    <strong className="text-slate-900 dark:text-slate-200">Menu bar</strong>{' '}
                    (Android) and select{' '}
                    <strong className="text-slate-900 dark:text-slate-200">
                      Add to Home Screen
                    </strong>
                    .
                  </p>
                </div>

                <button
                  onClick={() => setShowInstallModal(false)}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
