/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { InvestmentCategory } from './types';
import {
  TrendingUp,
  Briefcase,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  X,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../utils';

interface CuratedFund {
  symbol: string;
  name: string;
  category: InvestmentCategory;
  expectedYield: number;
  risk: string;
  expenseRatio: string;
  description: string;
}

const CURATED_FUNDS: CuratedFund[] = [
  {
    symbol: 'MB500',
    name: 'Morning Bright S&P 500 Core ETF',
    category: 'index_etf',
    expectedYield: 10.2,
    risk: 'Moderate Growth',
    expenseRatio: '0.03%',
    description: 'Broad exposure to 500 leading large-cap US companies with automatic dividend reinvestment.',
  },
  {
    symbol: 'MBTRY',
    name: 'US Short-Term Treasury Yield ETF',
    category: 'treasury',
    expectedYield: 5.35,
    risk: 'Low Risk',
    expenseRatio: '0.05%',
    description: 'Backed by short-duration US Treasury bills offering steady monthly yield with minimal volatility.',
  },
  {
    symbol: 'MBGRW',
    name: 'Global Tech & AI Innovation ETF',
    category: 'growth_tech',
    expectedYield: 13.8,
    risk: 'High Growth',
    expenseRatio: '0.12%',
    description: 'Concentrated portfolio of cloud infrastructure, semiconductor, and AI market leaders.',
  },
  {
    symbol: 'MBDIV',
    name: 'Dividend Aristocrats Income ETF',
    category: 'dividend',
    expectedYield: 7.4,
    risk: 'Balanced Income',
    expenseRatio: '0.07%',
    description: 'Blue-chip companies with 25+ consecutive years of dividend growth for resilient cash flow.',
  },
];

export function InvestingView() {
  const {
    user,
    balance,
    investments,
    investFunds,
    requestInvestmentRedemption,
    loading,
  } = useStore();
  const currency = user?.currency || 'USD';

  const [selectedFund, setSelectedFund] = useState<CuratedFund | null>(null);
  const [investAmount, setInvestAmount] = useState<string>('500');
  const [submitting, setSubmitting] = useState(false);

  const portfolioStats = useMemo(() => {
    const activePositions = investments.filter((i) => i.status !== 'redeemed');
    const totalInvested = activePositions.reduce((sum, i) => sum + i.investedAmount, 0);
    const weightedYield =
      totalInvested > 0
        ? activePositions.reduce((sum, i) => sum + i.investedAmount * i.expectedYield, 0) /
          totalInvested
        : 0;
    const estAnnualReturn = totalInvested * (weightedYield / 100);
    return {
      totalInvested,
      activeCount: activePositions.length,
      weightedYield,
      estAnnualReturn,
    };
  }, [investments]);

  const handleConfirmInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFund) return;
    const amt = parseFloat(investAmount);
    if (isNaN(amt) || amt < 10) return;

    setSubmitting(true);
    try {
      const ok = await investFunds(
        selectedFund.symbol,
        selectedFund.name,
        selectedFund.category,
        amt,
        selectedFund.expectedYield,
      );
      if (ok) {
        setSelectedFund(null);
        setInvestAmount('500');
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
            WEALTH & PORTFOLIO MANAGEMENT
          </span>
          <h2 className="text-2xl font-sans tracking-tight font-semibold text-slate-900 dark:text-white mt-1">
            Morning Bright Investing
          </h2>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <ShieldCheck size={14} />
          <span>$0 Commission • SIPC Insured</span>
        </div>
      </div>

      {/* SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 text-white border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Active Portfolio</span>
            <Briefcase size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(portfolioStats.totalInvested, currency)}
          </div>
          <div className="text-[11px] text-slate-400">
            {portfolioStats.activeCount} active position{portfolioStats.activeCount === 1 ? '' : 's'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Est. Annual Yield</span>
            <TrendingUp size={15} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            +{formatCurrency(portfolioStats.estAnnualReturn, currency)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
            Avg {portfolioStats.weightedYield.toFixed(2)}% projected APY
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Checking Available</span>
            <Wallet size={15} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(balance?.checking || 0, currency)}
          </div>
          <div className="text-[11px] text-slate-500">
            Instant funding with $10 minimum
          </div>
        </div>
      </div>

      {/* CURATED FUNDS MARKETPLACE */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Curated ETF Marketplace</h3>
          <p className="text-xs text-slate-500">
            Allocate directly from your Morning Bright Checking balance with instant settlement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CURATED_FUNDS.map((fund) => (
            <div
              key={fund.symbol}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
                        {fund.symbol}
                      </span>
                      <span className="text-[10px] font-mono uppercase text-slate-400">
                        {fund.risk} • ER {fund.expenseRatio}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">
                      {fund.name}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {fund.expectedYield.toFixed(1)}%
                    </span>
                    <span className="block text-[10px] font-mono text-slate-400">Hist. Avg/Yr</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {fund.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedFund(fund);
                  setInvestAmount('500');
                }}
                className="w-full h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-xs flex items-center justify-center space-x-1.5 hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span>Invest in {fund.symbol}</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE HOLDINGS */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Holdings</h3>
            <p className="text-xs text-slate-500">Live Firestore positions and redemption requests</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
            {investments.length}
          </span>
        </div>

        {investments.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl space-y-2">
            <Sparkles size={26} className="mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              No investment positions yet
            </p>
            <p className="text-[11px] text-slate-500">
              Choose any curated ETF above to fund your first position directly from Checking.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {investments.map((pos) => (
              <div
                key={pos.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {pos.symbol}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {pos.name}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Opened {new Date(pos.createdAt).toLocaleDateString()} • Projected {pos.expectedYield.toFixed(2)}% APY
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                      {formatCurrency(pos.investedAmount, currency)}
                    </div>
                    <span
                      className={`inline-flex items-center space-x-1 text-[10px] font-mono font-bold uppercase ${
                        pos.status === 'active'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : pos.status === 'redemption_requested'
                            ? 'text-amber-500'
                            : 'text-slate-400'
                      }`}
                    >
                      {pos.status === 'active' ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <Clock size={11} />
                      )}
                      <span>{pos.status.replace('_', ' ')}</span>
                    </span>
                  </div>

                  {pos.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => requestInvestmentRedemption(pos.id)}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:border-amber-500 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-500 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Redeem
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INVEST MODAL */}
      {selectedFund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setSelectedFund(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
                {selectedFund.symbol}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                {selectedFund.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Available Checking: <strong className="font-mono text-slate-900 dark:text-white">{formatCurrency(balance?.checking || 0, currency)}</strong>
              </p>
            </div>

            <form onSubmit={handleConfirmInvest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Investment Amount ({currency})
                </label>
                <input
                  type="number"
                  min={10}
                  max={Math.max(10, balance?.checking || 10)}
                  step="any"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  required
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2 pt-1">
                  {[100, 500, 1000, 2500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setInvestAmount(preset.toString())}
                      className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-600 cursor-pointer"
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Executing Order...' : `Confirm $${parseFloat(investAmount || '0').toLocaleString()} Investment`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
