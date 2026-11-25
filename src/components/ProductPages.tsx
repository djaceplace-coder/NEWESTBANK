/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Landmark,
  ShieldCheck,
  Calculator,
  Sparkles,
  Percent,
  Clock,
  Briefcase,
  Home,
  Car,
  Building2,
  Globe,
  FileCheck2,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from './Logo';

import imgArchitecture from '../assets/images/hero_banking_architecture_1795552393159.jpg';
import imgBusiness from '../assets/images/business_treasury_desk_1795597203919.jpg';
import imgCard from '../assets/images/card_obsidian_showcase_1795552396914.jpg';
import imgMortgage from '../assets/images/home_mortgage_modern_1795597203390.jpg';
import imgAdvisory from '../assets/images/wealth_advisory_architecture_1795597203626.jpg';
import imgSavings from '../assets/images/wealth_savings_editorial_1795552393099.jpg';

export type ProductPageKey =
  | 'checking'
  | 'savings'
  | 'cards'
  | 'loans'
  | 'investing'
  | 'business'
  | 'about';

interface ProductPagesProps {
  page: ProductPageKey;
  onSelectPage: (page: ProductPageKey) => void;
  onBack: () => void;
  onSignUp: () => void;
  onLogIn: () => void;
}

const PRODUCT_TABS: { key: ProductPageKey; label: string }[] = [
  { key: 'checking', label: 'Checking' },
  { key: 'savings', label: 'Savings' },
  { key: 'cards', label: 'Credit Cards' },
  { key: 'loans', label: 'Loans' },
  { key: 'investing', label: 'Investing' },
  { key: 'business', label: 'Business' },
  { key: 'about', label: 'About & Trust' },
];

const fmtCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);

export function ProductPages({
  page,
  onSelectPage,
  onBack,
  onSignUp,
  onLogIn,
}: ProductPagesProps) {
  // Savings calculator state
  const [savInitial, setSavInitial] = useState(15000);
  const [savMonthly, setSavMonthly] = useState(750);
  const [savYears, setSavYears] = useState(5);

  // Card rewards estimator state
  const [cardMonthlySpend, setCardMonthlySpend] = useState(3500);
  const [selectedCardTier, setSelectedCardTier] = useState<'obsidian' | 'emerald' | 'platinum'>('obsidian');

  // Loan calculator state
  const [loanCategory, setLoanCategory] = useState<'personal' | 'auto' | 'mortgage' | 'business'>('personal');
  const [loanAmount, setLoanAmount] = useState(25000);
  const [loanTermMonths, setLoanTermMonths] = useState(48);

  // Investing simulator state
  const [invProfile, setInvProfile] = useState<'conservative' | 'balanced' | 'growth' | 'tech'>('balanced');
  const [invInitial, setInvInitial] = useState(10000);
  const [invMonthly, setInvMonthly] = useState(500);
  const [invYears, setInvYears] = useState(10);

  // Business Treasury calculator state
  const [bizCash, setBizCash] = useState(250000);

  const savingsProjection = useMemo(() => {
    const calcFuture = (apy: number) => {
      const r = apy / 12;
      const n = savYears * 12;
      const futurePrincipal = savInitial * Math.pow(1 + r, n);
      const futureContrib = r > 0 ? savMonthly * ((Math.pow(1 + r, n) - 1) / r) : savMonthly * n;
      return futurePrincipal + futureContrib;
    };
    const totalDeposits = savInitial + savMonthly * savYears * 12;
    const mbTotal = calcFuture(0.06);
    const natTotal = calcFuture(0.0045);
    return {
      totalDeposits,
      mbTotal,
      mbInterest: Math.max(0, mbTotal - totalDeposits),
      natInterest: Math.max(0, natTotal - totalDeposits),
      extraEarned: Math.max(0, mbTotal - natTotal),
    };
  }, [savInitial, savMonthly, savYears]);

  const loanConfig = {
    personal: { label: 'Personal Loan', apr: 7.49, min: 2000, max: 100000, step: 1000, terms: [24, 36, 48, 60] },
    auto: { label: 'Auto Loan', apr: 5.89, min: 5000, max: 120000, step: 1000, terms: [36, 48, 60, 72] },
    mortgage: { label: 'Home Mortgage', apr: 6.15, min: 100000, max: 1500000, step: 10000, terms: [180, 240, 360] },
    business: { label: 'Business Line', apr: 8.25, min: 10000, max: 500000, step: 5000, terms: [24, 36, 60, 84] },
  }[loanCategory];

  const handleSelectLoanCategory = (next: 'personal' | 'auto' | 'mortgage' | 'business') => {
    setLoanCategory(next);
    if (next === 'mortgage') {
      setLoanAmount(420000);
      setLoanTermMonths(360);
    } else if (next === 'auto') {
      setLoanAmount(35000);
      setLoanTermMonths(60);
    } else if (next === 'business') {
      setLoanAmount(75000);
      setLoanTermMonths(36);
    } else {
      setLoanAmount(25000);
      setLoanTermMonths(48);
    }
  };

  const loanStats = useMemo(() => {
    const monthlyRate = loanConfig.apr / 100 / 12;
    const n = loanTermMonths;
    const monthlyPayment =
      monthlyRate > 0
        ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n))) /
          (Math.pow(1 + monthlyRate, n) - 1)
        : loanAmount / n;
    const totalPayment = monthlyPayment * n;
    const totalInterest = Math.max(0, totalPayment - loanAmount);
    return { monthlyPayment, totalPayment, totalInterest };
  }, [loanAmount, loanTermMonths, loanConfig.apr]);

  const invProfiles = {
    conservative: { label: 'Treasury & Income', rate: 0.054, risk: 'Low Volatility', allocation: '80% US Treasuries / 20% Dividend ETFs' },
    balanced: { label: 'Balanced Core', rate: 0.088, risk: 'Moderate', allocation: '60% S&P 500 / 30% Bonds / 10% Global' },
    growth: { label: 'Equity Growth', rate: 0.106, risk: 'Growth', allocation: '85% US & Global Equities / 15% REITs' },
    tech: { label: 'Tech & AI Index', rate: 0.132, risk: 'High Growth', allocation: '100% Innovation & Mega-Cap Tech' },
  };

  const invProjection = useMemo(() => {
    const profile = invProfiles[invProfile];
    const r = profile.rate / 12;
    const n = invYears * 12;
    const fv = invInitial * Math.pow(1 + r, n) + invMonthly * ((Math.pow(1 + r, n) - 1) / r);
    const contributed = invInitial + invMonthly * n;
    return {
      projectedValue: fv,
      contributed,
      estimatedGain: Math.max(0, fv - contributed),
      profile,
    };
  }, [invProfile, invInitial, invMonthly, invYears]);

  const bizAnnualTreasury = bizCash * 0.0525;
  const bizTraditionalYield = bizCash * 0.002;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-80px)]">
      {/* Sub-navigation bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center space-x-1 overflow-x-auto">
            {PRODUCT_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => onSelectPage(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  page === t.key
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        key={page}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16 space-y-16"
      >
        {/* ==================== CHECKING ==================== */}
        {page === 'checking' && (
          <>
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6">
                <p className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 font-semibold">
                  Morning Bright Checking · Zero Maintenance Fees
                </p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight [text-wrap:balance]">
                  Zero-fee checking built for real-time money movement.
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  Receive paychecks up to 2 days early with direct deposit, withdraw cash free at 25,000+ nationwide ATMs, and send domestic or international wires with complete fee transparency.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onSignUp}
                    className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <span>Open Checking Account</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={onLogIn}
                    className="px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold rounded-xl text-sm hover:border-emerald-600 transition-colors cursor-pointer"
                  >
                    Sign In to Dashboard
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="p-6 md:p-8 rounded-3xl bg-slate-900 text-white border border-white/10 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                      New Client Welcome Offer
                    </span>
                    <Logo className="w-7 h-7" withBackground={false} />
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-white tabular-nums">$500 Cash Bonus</div>
                    <p className="text-sm text-slate-400 mt-1">
                      Credited directly to your checking ledger within 30 days of qualifying direct deposit and in-site verification.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 tabular-nums">
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="text-xs text-slate-400">Monthly Fee</div>
                      <div className="text-lg font-bold text-emerald-400 mt-0.5">$0.00</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="text-xs text-slate-400">Minimum Balance</div>
                      <div className="text-lg font-bold text-emerald-400 mt-0.5">$0.00</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="text-xs text-slate-400">Overdraft Cushion</div>
                      <div className="text-lg font-bold text-white mt-0.5">$0 (Up to $200)</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="text-xs text-slate-400">FDIC Coverage</div>
                      <div className="text-lg font-bold text-white mt-0.5">$250,000</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  name: 'Everyday Checking',
                  price: '$0 / month',
                  desc: 'Ideal for daily spending, payroll direct deposits, and instant transfers.',
                  perks: [
                    'Instant virtual debit card issued immediately upon signup',
                    'Free domestic ACH & P2P transfers with live notifications',
                    '25,000+ fee-free ATMs nationwide via Allpoint & MoneyPass',
                    'Transfer PIN controls & one-tap card freeze',
                  ],
                  highlight: false,
                },
                {
                  name: 'Private Reserve Checking',
                  price: '$0 with $25k combined balance',
                  desc: 'Higher daily limits, priority wire clearing desk, and global ATM rebates.',
                  perks: [
                    'Unlimited global out-of-network ATM fee reimbursements',
                    'Same-day domestic & SWIFT international wires waived',
                    'Dedicated Account Management direct chat line',
                    'Automatic 6.00% APY sweep into Goal Savings Vaults',
                  ],
                  highlight: true,
                },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={`p-8 rounded-3xl border space-y-6 ${
                    tier.highlight
                      ? 'bg-emerald-700/5 border-emerald-600/35 dark:bg-emerald-500/5'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{tier.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{tier.desc}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      {tier.price}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {tier.perks.map((p) => (
                      <li key={p} className="flex items-center space-x-3 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={onSignUp}
                    className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Open {tier.name}
                  </button>
                </div>
              ))}
            </div>

            {/* Transparent Fee Schedule */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 md:p-8 space-y-5">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 font-semibold">
                  Transparent Fee Schedule
                </p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  No hidden maintenance charges or surprise penalties.
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 dark:border-white/10 text-xs font-mono uppercase text-slate-500">
                    <tr>
                      <th className="py-3 pr-4">Banking Service</th>
                      <th className="py-3 px-4">Morning Bright</th>
                      <th className="py-3 pl-4">Traditional Bank Avg.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 tabular-nums">
                    {[
                      ['Monthly Maintenance Fee', '$0.00', '$12.00 – $15.00'],
                      ['Minimum Opening Balance', '$0.00', '$100.00'],
                      ['Domestic ACH & Direct Deposit', 'Free (Up to 2 days early)', 'Free (Standard)'],
                      ['In-Network ATM Withdrawal', 'Free (25,000+ ATMs)', '$2.50 – $5.00 out-of-network'],
                      ['Insufficient Funds / Overdraft', '$0.00', '$34.00 per item'],
                      ['Virtual Card Issuance & Freeze', 'Instant & Free', 'Not offered / $10 replacement'],
                    ].map(([service, mb, trad]) => (
                      <tr key={service}>
                        <td className="py-3.5 pr-4 font-medium text-slate-900 dark:text-white">{service}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700 dark:text-emerald-400">{mb}</td>
                        <td className="py-3.5 pl-4 text-slate-500 dark:text-slate-400">{trad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ==================== SAVINGS ==================== */}
        {page === 'savings' && (
          <>
            <div className="grid lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-6 space-y-6">
                <p className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 font-semibold">
                  High-Yield Goal Savings · Daily Compounding
                </p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight [text-wrap:balance]">
                  Grow every dollar at <span className="text-emerald-700 dark:text-emerald-400 tabular-nums">6.00% APY</span>.
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  More than 13x the national savings average. Organize reserves into dedicated Goal Vaults with automated percentage transfers and instant liquidity back to Checking.
                </p>

                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 h-56 bg-slate-200 dark:bg-slate-800">
                  <img
                    src={imgSavings}
                    alt="Morning Bright high-yield savings planning"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Daily Compounding', desc: 'Interest accrues daily and credits directly to your savings balance monthly.' },
                    { title: 'Dedicated Goal Vaults', desc: 'Segment Emergency, Tax, Travel, and Down Payment goals with progress tracking.' },
                    { title: 'Automated Save Rules', desc: 'Automatically sweep a chosen percentage of incoming funds into target goals.' },
                    { title: 'Zero Lockup Periods', desc: 'Move money seamlessly between Checking and Savings whenever you need it.' },
                  ].map((f) => (
                    <div key={f.title} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{f.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Compound Calculator */}
              <div className="lg:col-span-6 p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-bold">
                      Interactive Yield Calculator
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                      See what 6.00% APY earns you
                    </h2>
                  </div>
                  <Calculator className="text-emerald-600" size={24} />
                </div>

                <div className="space-y-5 tabular-nums">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-600 dark:text-slate-400">Initial Deposit</span>
                      <span className="text-slate-900 dark:text-white font-mono font-bold">{fmtCurrency(savInitial)}</span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={100000}
                      step={500}
                      value={savInitial}
                      onChange={(e) => setSavInitial(Number(e.target.value))}
                      className="w-full accent-emerald-700 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-600 dark:text-slate-400">Monthly Contribution</span>
                      <span className="text-slate-900 dark:text-white font-mono font-bold">{fmtCurrency(savMonthly)}/mo</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5000}
                      step={50}
                      value={savMonthly}
                      onChange={(e) => setSavMonthly(Number(e.target.value))}
                      className="w-full accent-emerald-700 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-600 dark:text-slate-400">Time Horizon</span>
                      <span className="text-slate-900 dark:text-white font-mono font-bold">{savYears} {savYears === 1 ? 'Year' : 'Years'}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={savYears}
                      onChange={(e) => setSavYears(Number(e.target.value))}
                      className="w-full accent-emerald-700 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 text-white space-y-4 tabular-nums">
                  <div className="flex items-end justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-xs text-slate-400">Projected Balance at 6.00% APY</span>
                      <div className="text-3xl font-bold text-emerald-400 mt-1 font-mono">
                        {fmtCurrency(savingsProjection.mbTotal)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">Interest Earned</span>
                      <div className="text-lg font-bold text-white font-mono">
                        +{fmtCurrency(savingsProjection.mbInterest)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>vs. 0.45% National Avg ({fmtCurrency(savingsProjection.natInterest)})</span>
                    <span className="font-bold text-emerald-400">
                      +{fmtCurrency(savingsProjection.extraEarned)} extra
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onSignUp}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 cursor-pointer transition-colors"
                >
                  <span>Open High-Yield Savings</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ==================== CREDIT CARDS ==================== */}
        {page === 'cards' && (
          <>
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-5">
                <p className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 font-semibold">
                  Morning Bright Cards · Virtual &amp; Metal
                </p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
                  Instant virtual &amp; brushed metal cards with live controls.
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                  Provision virtual cards in seconds, freeze or adjust monthly spending limits in a single tap, and earn uncapped cash back or travel points with zero foreign transaction fees.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onSignUp}
                    className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Issue Your First Card</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
              <div className="lg:col-span-6">
                <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 h-72 md:h-80 bg-slate-900 shadow-xl">
                  <img
                    src={imgCard}
                    alt="Morning Bright Obsidian matte metal card"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  id: 'obsidian' as const,
                  name: 'Obsidian Metal',
                  badge: '3% Cash Back',
                  annualFee: '$0 Annual Fee',
                  bg: 'from-slate-900 via-zinc-900 to-black text-white',
                  perks: ['3% cash back on dining & groceries', '2% everywhere else', 'Instant virtual card issuance'],
                },
                {
                  id: 'emerald' as const,
                  name: 'Emerald Travel Reserve',
                  badge: '4x Travel Points',
                  annualFee: '$95 Annual Fee',
                  bg: 'from-emerald-900 via-emerald-800 to-teal-950 text-white',
                  perks: ['4x points on flights & hotels', '0% foreign transaction fees worldwide', 'Global airport lounge network'],
                },
                {
                  id: 'platinum' as const,
                  name: 'Platinum Everyday',
                  badge: '0% Intro APR (15 mo)',
                  annualFee: '$0 Annual Fee',
                  bg: 'from-slate-200 via-slate-300 to-slate-400 text-slate-900',
                  perks: ['0% intro APR for 15 billing cycles', '1.5% flat cash back on all purchases', 'First late-fee forgiveness'],
                },
              ].map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSelectedCardTier(card.id)}
                  className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
                    selectedCardTier === card.id
                      ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-xl'
                      : 'border-slate-200 dark:border-white/10 hover:border-emerald-600/50'
                  }`}
                >
                  <div className="space-y-5">
                    <div className={`h-44 rounded-2xl bg-gradient-to-br ${card.bg} p-5 flex flex-col justify-between shadow-lg`}>
                      <div className="flex justify-between items-center">
                        <Logo className="w-7 h-7" withBackground={false} />
                        <span className="text-[10px] font-mono uppercase tracking-widest opacity-80">
                          {card.badge}
                        </span>
                      </div>
                      <div>
                        <div className="font-mono text-sm tracking-[0.2em] opacity-90">4532 •••• •••• 8841</div>
                        <div className="flex justify-between items-center mt-2 text-xs font-semibold">
                          <span>{card.name}</span>
                          <span className="opacity-75">VISA</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{card.name}</h3>
                        <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold">{card.annualFee}</span>
                      </div>
                      <ul className="mt-4 space-y-2.5">
                        {card.perks.map((p) => (
                          <li key={p} className="flex items-start space-x-2 text-xs text-slate-600 dark:text-slate-300">
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSignUp();
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Apply for {card.name}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-6 md:p-8 rounded-3xl bg-slate-900 text-white border border-white/10 grid md:grid-cols-12 gap-8 items-center tabular-nums">
              <div className="md:col-span-7 space-y-4">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                  Annual Cash Rewards Estimator
                </span>
                <h3 className="text-2xl font-bold">Estimate your yearly rewards</h3>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Estimated Monthly Card Spend</span>
                    <span className="font-mono font-bold text-white">{fmtCurrency(cardMonthlySpend)} / mo</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={15000}
                    step={100}
                    value={cardMonthlySpend}
                    onChange={(e) => setCardMonthlySpend(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
              <div className="md:col-span-5 p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <div className="text-xs text-slate-400 uppercase font-mono">
                  Projected Annual Rewards ({selectedCardTier})
                </div>
                <div className="text-4xl font-bold font-mono text-emerald-400">
                  {fmtCurrency(
                    cardMonthlySpend *
                      12 *
                      (selectedCardTier === 'emerald' ? 0.04 : selectedCardTier === 'obsidian' ? 0.03 : 0.015),
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Zero foreign transaction fees &amp; instant virtual issuance.</p>
              </div>
            </div>
          </>
        )}

        {/* ==================== LOANS ==================== */}
        {page === 'loans' && (
          <>
            <div className="grid lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5 space-y-6">
                <p className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 font-semibold">
                  Morning Bright Lending · Fixed Transparent APR
                </p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight [text-wrap:balance]">
                  Transparent loans with fixed rates &amp; zero prepayment fees.
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                  Purchase a home, finance a vehicle, consolidate debt, or expand working capital with direct underwriting and same-day checking disbursement upon approval.
                </p>

                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 h-48 bg-slate-200 dark:bg-slate-800">
                  <img
                    src={imgMortgage}
                    alt="Modern architectural residence financed with Morning Bright Lending"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'personal' as const, label: 'Personal', rate: 'From 7.49% APR', icon: Sparkles },
                    { key: 'auto' as const, label: 'Auto Loans', rate: 'From 5.89% APR', icon: Car },
                    { key: 'mortgage' as const, label: 'Mortgages', rate: 'From 6.15% APR', icon: Home },
                    { key: 'business' as const, label: 'Business', rate: 'From 8.25% APR', icon: Briefcase },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleSelectLoanCategory(item.key)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        loanCategory === item.key
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-lg'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:border-emerald-600'
                      }`}
                    >
                      <item.icon size={20} className={loanCategory === item.key ? 'text-white' : 'text-emerald-600'} />
                      <div className="font-bold text-sm mt-2">{item.label}</div>
                      <div className={`text-xs mt-0.5 tabular-nums ${loanCategory === item.key ? 'text-emerald-100' : 'text-slate-500'}`}>
                        {item.rate}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-bold">
                      Live Payment Estimator
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{loanConfig.label}</h2>
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {loanConfig.apr.toFixed(2)}% APR
                  </span>
                </div>

                <div className="space-y-5 tabular-nums">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-600 dark:text-slate-400">Loan Amount</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{fmtCurrency(loanAmount)}</span>
                    </div>
                    <input
                      type="range"
                      min={loanConfig.min}
                      max={loanConfig.max}
                      step={loanConfig.step}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full accent-emerald-700 cursor-pointer"
                    />
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">Repayment Term</span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {loanConfig.terms.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setLoanTermMonths(t)}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            loanTermMonths === t
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {t >= 120 ? `${t / 12} Years` : `${t} Months`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950 text-white grid sm:grid-cols-3 gap-4 tabular-nums">
                  <div>
                    <span className="text-xs text-slate-400">Est. Monthly Payment</span>
                    <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                      {fmtCurrency(loanStats.monthlyPayment)}/mo
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Total Interest</span>
                    <div className="text-xl font-bold font-mono text-white mt-1">
                      {fmtCurrency(loanStats.totalInterest)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Total Payoff</span>
                    <div className="text-xl font-bold font-mono text-slate-200 mt-1">
                      {fmtCurrency(loanStats.totalPayment)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onSignUp}
                    className="flex-1 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 cursor-pointer transition-colors"
                  >
                    <span>Open Account &amp; Apply Now</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={onLogIn}
                    className="px-5 py-3.5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold rounded-xl text-sm hover:border-emerald-600 cursor-pointer"
                  >
                    Existing Client Login
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ==================== INVESTING ==================== */}
        {page === 'investing' && (
          <>
            <div className="grid lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5 space-y-6">
                <p className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 font-semibold">
                  Morning Bright Wealth &amp; Investing · $0 Commission
                </p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight [text-wrap:balance]">
                  Build long-term wealth with $0 commission portfolios.
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                  Allocate straight from your Checking balance into institutional-grade index ETFs, US Treasury yield funds, and automated dividend strategies starting at $10.
                </p>

                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 h-48 bg-slate-200 dark:bg-slate-800">
                  <img
                    src={imgAdvisory}
                    alt="Morning Bright wealth advisory lounge"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-3">
                  {[
                    { icon: Percent, title: 'Zero Advisory Surprises', desc: '$0 commission trades and transparent ultra-low ETF expense ratios.' },
                    { icon: Clock, title: 'Instant Funding from Checking', desc: 'Move capital from Checking into active investment positions in seconds.' },
                    { icon: ShieldCheck, title: 'SIPC-Protected Custody', desc: 'Securities protected up to $500,000 through certified clearing partners.' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start space-x-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                      <item.icon size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl space-y-6">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-bold">
                    Portfolio Growth Simulator
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    Choose a curated strategy
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.keys(invProfiles) as Array<keyof typeof invProfiles>).map((key) => {
                    const p = invProfiles[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setInvProfile(key)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          invProfile === key
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs">{p.label}</span>
                          <span className={`font-mono text-xs font-bold tabular-nums ${invProfile === key ? 'text-emerald-100' : 'text-emerald-700 dark:text-emerald-400'}`}>
                            {(p.rate * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className={`text-[11px] mt-1 ${invProfile === key ? 'text-emerald-100' : 'text-slate-500'}`}>
                          {p.risk}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-3 py-2 rounded-lg">
                  Target Allocation: {invProjection.profile.allocation}
                </p>

                <div className="space-y-4 tabular-nums">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Starting Investment</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{fmtCurrency(invInitial)}</span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={100000}
                      step={500}
                      value={invInitial}
                      onChange={(e) => setInvInitial(Number(e.target.value))}
                      className="w-full accent-emerald-700 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Monthly Recurring Investment</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{fmtCurrency(invMonthly)}/mo</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5000}
                      step={50}
                      value={invMonthly}
                      onChange={(e) => setInvMonthly(Number(e.target.value))}
                      className="w-full accent-emerald-700 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Investment Horizon</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{invYears} Years</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      step={1}
                      value={invYears}
                      onChange={(e) => setInvYears(Number(e.target.value))}
                      className="w-full accent-emerald-700 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950 text-white grid sm:grid-cols-3 gap-4 tabular-nums">
                  <div>
                    <span className="text-xs text-slate-400">Projected Value</span>
                    <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                      {fmtCurrency(invProjection.projectedValue)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Total Contributed</span>
                    <div className="text-lg font-bold font-mono text-white mt-1">
                      {fmtCurrency(invProjection.contributed)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Estimated Growth</span>
                    <div className="text-lg font-bold font-mono text-emerald-300 mt-1">
                      +{fmtCurrency(invProjection.estimatedGain)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onSignUp}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 cursor-pointer transition-colors"
                >
                  <span>Start Investing with Morning Bright</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ==================== BUSINESS BANKING ==================== */}
        {page === 'business' && (
          <>
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-6">
                <p className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 font-semibold">
                  Commercial Banking &amp; Corporate Treasury
                </p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight [text-wrap:balance]">
                  Operating accounts and treasury rails built for modern companies.
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  Combine zero-fee corporate checking, automated payroll ACH, instant team expense cards with per-card limits, and 5.25% APY Treasury sweep accounts in one unified workspace.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onSignUp}
                    className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Open Business Account</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={onLogIn}
                    className="px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold rounded-xl text-sm hover:border-emerald-600 cursor-pointer"
                  >
                    Treasury Client Login
                  </button>
                </div>
              </div>
              <div className="lg:col-span-6">
                <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 h-72 md:h-80 bg-slate-900 shadow-xl">
                  <img
                    src={imgBusiness}
                    alt="Morning Bright corporate treasury boardroom"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

            {/* Treasury Yield Estimator */}
            <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <p className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 font-semibold">
                  Idle Operating Cash Calculator
                </p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Put corporate reserves to work at 5.25% APY Treasury Yield.
                </h2>
                <div className="pt-2 tabular-nums">
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-600 dark:text-slate-400">Company Operating Cash Balance</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{fmtCurrency(bizCash)}</span>
                  </div>
                  <input
                    type="range"
                    min={25000}
                    max={5000000}
                    step={25000}
                    value={bizCash}
                    onChange={(e) => setBizCash(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                </div>
              </div>
              <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-950 text-white space-y-3 tabular-nums">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Annual Yield at Morning Bright (5.25%)</span>
                  <span className="font-mono font-bold text-emerald-400">{fmtCurrency(bizAnnualTreasury)}/yr</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Traditional Business Checking (0.20%)</span>
                  <span className="font-mono text-slate-300">{fmtCurrency(bizTraditionalYield)}/yr</span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-white">Net Annual Advantage</span>
                  <span className="text-2xl font-mono font-bold text-emerald-400">
                    +{fmtCurrency(bizAnnualTreasury - bizTraditionalYield)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: CreditCard,
                  title: 'Department Virtual Cards',
                  desc: 'Issue individual vendor cards for SaaS, travel, and procurement with real-time monthly caps and instant freeze controls.',
                },
                {
                  icon: Globe,
                  title: 'Same-Day Domestic & SWIFT Wires',
                  desc: 'Pay international contractors and suppliers across USD, EUR, and GBP with transparent settlement tracking.',
                },
                {
                  icon: Users,
                  title: 'Direct Account Management',
                  desc: 'Message your dedicated relationship operations desk directly inside the portal with real-time audit logs.',
                },
              ].map((card) => (
                <div key={card.title} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-3">
                  <card.icon className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{card.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ==================== ABOUT & TRUST ==================== */}
        {page === 'about' && (
          <>
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-6">
                <p className="text-xs font-mono uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 font-semibold">
                  Institutional Charter &amp; Custody Architecture
                </p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight [text-wrap:balance]">
                  Built on balance-sheet clarity, direct accountability, and zero-trust security.
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  Morning Bright Digital Banking was engineered to eliminate hidden legacy bank fees while delivering institutional treasury controls, immediate account access, and direct human account management.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onSignUp}
                    className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Open Your Account</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
              <div className="lg:col-span-6">
                <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 h-72 md:h-80 bg-slate-900 shadow-xl">
                  <img
                    src={imgArchitecture}
                    alt="Morning Bright institutional headquarters architecture"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 tabular-nums">
              {[
                { label: 'Client Assets Safeguarded', value: '$4.8B+' },
                { label: 'FDIC Deposit Coverage', value: '$250,000' },
                { label: 'Fee-Free ATM Network', value: '25,000+' },
                { label: 'Ledger Uptime Record', value: '99.98%' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-1"
                >
                  <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{stat.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Landmark,
                  title: 'Chartered Clearing Custody',
                  desc: 'Client checking and savings deposits are held at FDIC-insured partner banking institutions with pass-through coverage up to $250,000 per depositor.',
                },
                {
                  icon: FileCheck2,
                  title: 'In-Site Compliance & KYC',
                  desc: 'Sign up and enter your portal immediately with no email link bottlenecks. Complete identity verification directly inside your dashboard whenever you are ready.',
                },
                {
                  icon: Building2,
                  title: 'Regional Operations Desks',
                  desc: 'Headquartered at 100 Standard Plaza, New York, NY with compliance and client operations desks in San Francisco and London.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-3"
                >
                  <item.icon className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
