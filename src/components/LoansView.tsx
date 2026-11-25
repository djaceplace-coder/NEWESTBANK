/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { LoanType } from './types';
import {
  Landmark,
  Calculator,
  CheckCircle2,
  Clock,
  XCircle,
  Car,
  Home,
  Briefcase,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency } from '../utils';

const LOAN_OPTIONS: Record<
  LoanType,
  {
    label: string;
    apr: number;
    min: number;
    max: number;
    step: number;
    terms: number[];
    defaultAmt: number;
    defaultTerm: number;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  personal: {
    label: 'Personal Loan',
    apr: 7.49,
    min: 1000,
    max: 100000,
    step: 500,
    terms: [24, 36, 48, 60],
    defaultAmt: 15000,
    defaultTerm: 36,
    icon: Sparkles,
  },
  auto: {
    label: 'Auto Financing',
    apr: 5.89,
    min: 5000,
    max: 120000,
    step: 1000,
    terms: [36, 48, 60, 72],
    defaultAmt: 32000,
    defaultTerm: 60,
    icon: Car,
  },
  mortgage: {
    label: 'Home Mortgage',
    apr: 6.15,
    min: 50000,
    max: 1500000,
    step: 10000,
    terms: [180, 240, 360],
    defaultAmt: 350000,
    defaultTerm: 360,
    icon: Home,
  },
  business: {
    label: 'Business Capital',
    apr: 8.25,
    min: 5000,
    max: 500000,
    step: 2500,
    terms: [24, 36, 60, 84],
    defaultAmt: 50000,
    defaultTerm: 48,
    icon: Briefcase,
  },
};

export function LoansView() {
  const { user, loans, applyForLoan, loading } = useStore();
  const currency = user?.currency || 'USD';

  const [loanType, setLoanType] = useState<LoanType>('personal');
  const [amount, setAmount] = useState<number>(15000);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [annualIncome, setAnnualIncome] = useState<string>('95000');
  const [purpose, setPurpose] = useState<string>('Debt consolidation & home upgrades');
  const [submitting, setSubmitting] = useState(false);

  const config = LOAN_OPTIONS[loanType];

  const handleSelectType = (nextType: LoanType) => {
    setLoanType(nextType);
    setAmount(LOAN_OPTIONS[nextType].defaultAmt);
    setTermMonths(LOAN_OPTIONS[nextType].defaultTerm);
  };

  const calculation = useMemo(() => {
    const r = config.apr / 100 / 12;
    const n = termMonths;
    const monthlyPayment =
      r > 0 ? (amount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1) : amount / n;
    const totalPayoff = monthlyPayment * n;
    const totalInterest = Math.max(0, totalPayoff - amount);
    return {
      monthlyPayment: Number(monthlyPayment.toFixed(2)),
      totalPayoff: Number(totalPayoff.toFixed(2)),
      totalInterest: Number(totalInterest.toFixed(2)),
    };
  }, [amount, termMonths, config.apr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedIncome = parseFloat(annualIncome);
    if (isNaN(parsedIncome) || parsedIncome <= 0 || !purpose.trim()) return;

    setSubmitting(true);
    try {
      const ok = await applyForLoan(
        loanType,
        amount,
        termMonths,
        config.apr,
        calculation.monthlyPayment,
        purpose.trim(),
        parsedIncome,
      );
      if (ok) {
        setPurpose('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-8 font-sans space-y-8 pb-24 transition-colors">
      {/* HEADER */}
      <div className="border-b border-slate-200 dark:border-white/5 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tracking-widest uppercase font-bold">
            LENDING & CREDIT DESK
          </span>
          <h2 className="text-2xl font-sans tracking-tight font-semibold text-slate-900 dark:text-white mt-1">
            Morning Bright Loans
          </h2>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <ShieldCheck size={14} />
          <span>Fixed APR • $0 Prepayment Penalty</span>
        </div>
      </div>

      {/* LOAN PRODUCT SELECTOR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(LOAN_OPTIONS) as LoanType[]).map((key) => {
          const item = LOAN_OPTIONS[key];
          const Icon = item.icon;
          const active = loanType === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectType(key)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                active
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon size={20} className={active ? 'text-white' : 'text-emerald-500'} />
                <span className={`text-[11px] font-mono font-bold ${active ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {item.apr.toFixed(2)}% APR
                </span>
              </div>
              <div className="font-bold text-sm mt-3">{item.label}</div>
              <div className={`text-[11px] mt-0.5 ${active ? 'text-emerald-100' : 'text-slate-500'}`}>
                Up to {formatCurrency(item.max, currency)}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* APPLICATION FORM & CALCULATOR */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Calculator size={16} className="text-emerald-500" />
                <span>Configure & Apply — {config.label}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Approved funds can be disbursed directly into your Morning Bright Checking account.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Principal Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Requested Principal</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(amount, currency)}
                </span>
              </div>
              <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>{formatCurrency(config.min, currency)}</span>
                <span>{formatCurrency(config.max, currency)}</span>
              </div>
            </div>

            {/* Term Selection */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                Repayment Term
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {config.terms.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTermMonths(t)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      termMonths === t
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {t >= 120 ? `${t / 12} Years` : `${t} Mo`}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-950 text-white grid grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Monthly Est.</span>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                  {formatCurrency(calculation.monthlyPayment, currency)}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Total Interest</span>
                <div className="text-lg font-bold font-mono text-white mt-1">
                  {formatCurrency(calculation.totalInterest, currency)}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Fixed APR</span>
                <div className="text-lg font-bold font-mono text-slate-200 mt-1">
                  {config.apr.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Underwriting Details */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Annual Gross Income ({currency})
                </label>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  required
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Loan Purpose
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Home renovation, Vehicle purchase..."
                  required
                  maxLength={200}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Submitting Application...' : `Submit ${config.label} Application`}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        </div>

        {/* USER'S LOAN APPLICATIONS */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Applications</h3>
              <p className="text-xs text-slate-500">Real-time underwriting status</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
              {loans.length}
            </span>
          </div>

          {loans.length === 0 ? (
            <div className="py-14 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl space-y-2">
              <Landmark size={28} className="mx-auto text-slate-400" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                No loan applications yet
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Configure your desired loan terms on the left and submit for underwriting review.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      {loan.loanType} Loan
                    </span>
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        loan.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : loan.status === 'declined'
                            ? 'bg-red-500/15 text-red-500'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {loan.status === 'approved' ? (
                        <CheckCircle2 size={11} />
                      ) : loan.status === 'declined' ? (
                        <XCircle size={11} />
                      ) : (
                        <Clock size={11} />
                      )}
                      <span>{loan.status}</span>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                      {formatCurrency(loan.amount, currency)}
                    </span>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatCurrency(loan.monthlyPayment, currency)}/mo
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {loan.purpose}
                  </p>

                  <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-200 dark:border-white/5">
                    <span>
                      {loan.termMonths} mo @ {loan.apr.toFixed(2)}% APR
                    </span>
                    <span>{new Date(loan.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
