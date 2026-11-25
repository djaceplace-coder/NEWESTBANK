/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User,
  Building2,
  Landmark,
  PiggyBank,
  CreditCard,
  Globe,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { Logo } from './Logo';

interface OnboardingFlowProps {
  onComplete: (options: { openKyc: boolean }) => void;
}

type AccountTypeOption = 'personal' | 'business' | 'private_wealth';
type PrimaryFocusOption =
  | 'savings_yield'
  | 'spending_cards'
  | 'wires_transfers'
  | 'lending_investing';
type MonthlyVolumeOption = 'under_5k' | '5k_25k' | '25k_100k' | 'over_100k';
type CurrencyOption = 'USD' | 'EUR' | 'GBP';

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user, completeOnboarding, logOutUser } = useStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accountType, setAccountType] = useState<AccountTypeOption>(
    user?.accountType || 'personal',
  );
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [primaryFocus, setPrimaryFocus] = useState<PrimaryFocusOption>(
    user?.primaryFocus || 'savings_yield',
  );
  const [monthlyVolume, setMonthlyVolume] = useState<MonthlyVolumeOption>(
    user?.monthlyVolume || '5k_25k',
  );
  const [currency, setCurrency] = useState<CurrencyOption>(
    user?.currency || 'USD',
  );
  const [saving, setSaving] = useState(false);

  const handleFinish = async (openKyc: boolean) => {
    setSaving(true);
    try {
      const ok = await completeOnboarding({
        accountType,
        businessName: accountType === 'business' ? businessName.trim() : undefined,
        primaryFocus,
        monthlyVolume,
        currency,
      });
      if (ok) {
        onComplete({ openKyc });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between px-4 py-6 sm:px-6 sm:py-10 font-sans">
      {/* Top Bar */}
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2.5">
          <Logo className="w-8 h-8" withBackground={true} />
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white block leading-none">
              Morning Bright
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Account Setup
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={logOutUser}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="max-w-3xl w-full mx-auto flex-1 flex items-center">
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-5 sm:p-8 md:p-10">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
              <span>
                Welcome, {user?.firstName || 'Client'} — Let&apos;s tailor your banking workspace
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                Step {step} of 3
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-colors ${
                    idx <= step
                      ? 'bg-emerald-600 dark:bg-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    What type of account are you setting up?
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
                    We configure your dashboard controls, card limits, and treasury options to match your account profile.
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-3.5">
                  {[
                    {
                      id: 'personal' as AccountTypeOption,
                      icon: User,
                      title: 'Personal Banking',
                      desc: 'Everyday checking, 6.00% APY savings vaults, and personal cards.',
                    },
                    {
                      id: 'business' as AccountTypeOption,
                      icon: Building2,
                      title: 'Business Account',
                      desc: 'Corporate treasury reserves, team virtual cards, and wire desk.',
                    },
                    {
                      id: 'private_wealth' as AccountTypeOption,
                      icon: Landmark,
                      title: 'Private Wealth',
                      desc: 'High-balance liquidity, investment portfolios, and priority management.',
                    },
                  ].map((opt) => {
                    const selected = accountType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAccountType(opt.id)}
                        className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          selected
                            ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-500/10 ring-1 ring-emerald-500/40'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-slate-950/60 hover:border-emerald-500/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3.5">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                selected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                              }`}
                            >
                              <opt.icon size={20} />
                            </div>
                            {selected && (
                              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                            )}
                          </div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                            {opt.title}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {accountType === 'business' && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 space-y-1.5">
                    <label
                      htmlFor="onboarding-business-name"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                    >
                      Registered Business or Entity Name (Optional)
                    </label>
                    <input
                      id="onboarding-business-name"
                      type="text"
                      maxLength={100}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Northstar Logistics LLC"
                      className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full sm:w-auto px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors inline-flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    What is your primary goal with Morning Bright?
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
                    We&apos;ll highlight the most relevant shortcuts and rate insights on your dashboard.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  {[
                    {
                      id: 'savings_yield' as PrimaryFocusOption,
                      icon: PiggyBank,
                      title: 'High-Yield Savings & Reserves',
                      desc: 'Earn 6.00% APY daily compounding across goal vaults.',
                    },
                    {
                      id: 'spending_cards' as PrimaryFocusOption,
                      icon: CreditCard,
                      title: 'Everyday Spending & Virtual Cards',
                      desc: 'Zero-fee checking with instant virtual and metal cards.',
                    },
                    {
                      id: 'wires_transfers' as PrimaryFocusOption,
                      icon: Globe,
                      title: 'Domestic & International Wires',
                      desc: 'Fast ACH payouts, saved beneficiaries, and SWIFT clearing.',
                    },
                    {
                      id: 'lending_investing' as PrimaryFocusOption,
                      icon: TrendingUp,
                      title: 'Lending, Mortgages & Investing',
                      desc: 'Low-APR financing and commission-free ETF allocations.',
                    },
                  ].map((opt) => {
                    const selected = primaryFocus === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPrimaryFocus(opt.id)}
                        className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-4 ${
                          selected
                            ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-500/10 ring-1 ring-emerald-500/40'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-slate-950/60 hover:border-emerald-500/50'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                            selected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                          }`}
                        >
                          <opt.icon size={19} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {opt.title}
                            </span>
                            {selected && (
                              <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto px-5 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <ArrowLeft size={15} />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-full sm:w-auto px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors inline-flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Preferred currency & expected monthly activity
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
                    This helps tailor your default ledger currency and clearing thresholds. You can change your currency anytime in Settings.
                  </p>
                </div>

                {/* Base Currency */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Primary Ledger Currency
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { code: 'USD', label: 'US Dollar', symbol: '$' },
                        { code: 'EUR', label: 'Euro', symbol: '€' },
                        { code: 'GBP', label: 'British Pound', symbol: '£' },
                      ] as { code: CurrencyOption; label: string; symbol: string }[]
                    ).map((c) => {
                      const selected = currency === c.code;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setCurrency(c.code)}
                          className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                            selected
                              ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-500/10 ring-1 ring-emerald-500/40'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-slate-950/60 hover:border-emerald-500/50'
                          }`}
                        >
                          <div className="text-lg font-bold text-slate-900 dark:text-white">
                            {c.symbol} {c.code}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {c.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expected Monthly Volume */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Expected Monthly Account Volume
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      [
                        { id: 'under_5k', label: 'Under $5,000' },
                        { id: '5k_25k', label: '$5,000 – $25,000' },
                        { id: '25k_100k', label: '$25,000 – $100,000' },
                        { id: 'over_100k', label: '$100,000+' },
                      ] as { id: MonthlyVolumeOption; label: string }[]
                    ).map((tier) => {
                      const selected = monthlyVolume === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setMonthlyVolume(tier.id)}
                          className={`px-3 py-3.5 rounded-xl border text-xs sm:text-sm font-bold text-center transition-all cursor-pointer tabular-nums ${
                            selected
                              ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/40'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
                          }`}
                        >
                          {tier.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Next Step Handoff Box */}
                <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 flex items-start space-x-3.5">
                  <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                      Next: In-Site Identity Verification (KYC)
                    </span>
                    You can verify your identity immediately via file upload or on-demand camera capture to unlock full transfer limits, or head straight to your dashboard first.
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setStep(2)}
                    className="w-full sm:w-auto px-5 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <ArrowLeft size={15} />
                    <span>Back</span>
                  </button>
                  <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleFinish(false)}
                      className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white text-sm font-semibold rounded-xl border border-slate-200 dark:border-white/10 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Go to Dashboard
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleFinish(true)}
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors inline-flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>{saving ? 'Saving...' : 'Complete & Start KYC'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer note */}
      <div className="max-w-3xl w-full mx-auto text-center text-[11px] text-slate-500 mt-6">
        Morning Bright Financial Services · Encrypted Client Onboarding
      </div>
    </div>
  );
}
