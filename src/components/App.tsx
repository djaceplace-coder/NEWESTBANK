/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { isBootstrappedAdminEmail } from '../firebase';
import { LandingPage } from './LandingPage';
import { AuthModal } from './AuthModal';
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
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
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
  return window.location.pathname.toLowerCase().startsWith('/admin');
};

export default function App() {
  const {
    user,
    settings,
    authChecked,
    loading,
    errorMessage,
    clearError,
    signInWithEmail,
    logOutUser,
    initAuthListener,
    requestAdminVerificationEmail,
    checkAndUnlockAdmin,
  } = useStore();

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(isAdminPathname);
  const [currentTab, setCurrentTab] = useState<string>(isAdminPathname() ? 'admin' : 'home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [autoOpenKyc, setAutoOpenKyc] = useState(false);

  // Admin portal login form state (when visiting /admin while signed out)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminUnlockBusy, setAdminUnlockBusy] = useState(false);

  const [isPWA, setIsPWA] = useState(false);

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
    clearError();
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

  const handleAdminRouteSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const ok = await signInWithEmail(adminEmail, adminPassword);
    if (ok) {
      setCurrentTab('admin');
    }
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
              onClick={logOutUser}
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

  // Render Admin access gate when navigating to /admin without full admin flag yet
  const renderAdminView = () => {
    if (!user) return null;
    if (user.isAdmin) {
      return <AdminPanel />;
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
                  Activate Administrator Console
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Signed in as <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{user.email}</span>. Your email is authorized as a system administrator. Complete this one-time email verification check so Firestore grants permanent admin access to your account.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white">
                Two quick steps:
              </div>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click <strong>Send Verification Link</strong> and open the link sent to your inbox.</li>
                <li>Return here and click <strong>I&apos;ve Verified — Unlock Admin Panel</strong>.</li>
              </ol>
            </div>

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
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={15} className={adminUnlockBusy ? 'animate-spin' : ''} />
                <span>I&apos;ve Verified — Unlock Admin Panel</span>
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
                onClick={logOutUser}
                className="text-red-500 hover:text-red-400 font-semibold cursor-pointer"
              >
                Switch Account
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
            Administrator Access Required
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Your account (<span className="font-mono">{user.email}</span>) does not currently hold administrator permissions. Sign in with an administrator account or contact operations management.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => handleChangeTab('home')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            >
              Return to Dashboard
            </button>
            <button
              type="button"
              onClick={logOutUser}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Sign Out
            </button>
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
        ) : !user && isAdminRoute ? (
          // DEDICATED /admin SIGN-IN CONSOLE
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Logo className="w-9 h-9" withBackground={true} />
                  <div>
                    <span className="font-bold text-base text-white block leading-tight">
                      Morning Bright
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                      Operations & Admin Console
                    </span>
                  </div>
                </div>
                <Lock size={18} className="text-slate-500" />
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-bold text-white">Administrator Sign-In</h1>
                <p className="text-xs text-slate-400">
                  Enter your administrator credentials to access client accounts, balances, KYC queues, and management chat.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleAdminRouteSignIn} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@morningbrightfinance.com"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-white/10 bg-slate-950 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-slate-950 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showAdminPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Admin Panel</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={exitAdminRouteToSite}
                  className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Return to Website</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exitAdminRouteToSite();
                    handleOpenSignUp();
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  Register Account
                </button>
              </div>
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
              <Sidebar currentTab={currentTab} onChangeTab={handleChangeTab} />
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
                              logOutUser();
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
