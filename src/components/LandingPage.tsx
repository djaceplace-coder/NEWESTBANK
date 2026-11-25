import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Landmark,
  Lock,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  CreditCard,
  Home,
  Briefcase,
  PieChart,
  Building2,
  ChevronDown,
  TrendingUp,
  Car,
  MessageSquare,
  FileCheck2,
  Clock,
  Globe,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';
import { ProductPages, ProductPageKey } from './ProductPages';
import { LegalPage } from './LegalPage';

import heroPrivateImg from '../assets/images/hero_private_banking_1795597203032.jpg';
import heroArchitectureImg from '../assets/images/hero_banking_architecture_1795552393159.jpg';
import cardObsidianImg from '../assets/images/card_obsidian_showcase_1795552396914.jpg';
import mobileSecurityImg from '../assets/images/mobile_biometric_security_1795552397290.jpg';
import wealthSavingsImg from '../assets/images/wealth_savings_editorial_1795552393099.jpg';
import businessTreasuryImg from '../assets/images/business_treasury_desk_1795597203919.jpg';
import homeMortgageImg from '../assets/images/home_mortgage_modern_1795597203390.jpg';

interface LandingProps {
  onEnterApp: () => void;
  onSignUp: () => void;
  onForgotPassword?: () => void;
}

interface JournalArticle {
  category: string;
  readTime: string;
  title: string;
  summary: string;
  img: string;
  paragraphs: string[];
  takeaways: string[];
  relatedPage: ProductPageKey;
  relatedLabel: string;
}

const NAV_PRODUCTS: { label: string; key: ProductPageKey }[] = [
  { label: 'Checking', key: 'checking' },
  { label: 'Savings', key: 'savings' },
  { label: 'Credit Cards', key: 'cards' },
  { label: 'Loans', key: 'loans' },
  { label: 'Investing', key: 'investing' },
  { label: 'Business', key: 'business' },
  { label: 'About', key: 'about' },
];

const COMPARISON_ROWS = [
  {
    feature: 'High-Yield Savings APY',
    morningBright: '6.00% APY',
    traditional: '0.45% APY avg.',
  },
  {
    feature: 'Monthly Maintenance Fee',
    morningBright: '$0',
    traditional: '$12 – $25 / month',
  },
  {
    feature: 'Minimum Opening Balance',
    morningBright: '$0',
    traditional: '$500 – $2,500',
  },
  {
    feature: 'Fee-Free ATM Access',
    morningBright: '25,000+ nationwide',
    traditional: 'Own-branch ATMs only',
  },
  {
    feature: 'Virtual & Metal Cards',
    morningBright: 'Instant issue & freeze',
    traditional: '7–10 business days',
  },
  {
    feature: 'Domestic & SWIFT Wire Desk',
    morningBright: 'Same-day digital clearing',
    traditional: 'Branch visit + $35+ fee',
  },
  {
    feature: 'Account Setup & KYC',
    morningBright: 'Guided 3-step onboarding & in-site KYC',
    traditional: 'Multi-day branch & paperwork wait',
  },
  {
    feature: 'Direct Management Support',
    morningBright: 'Live in-portal chat desk',
    traditional: 'Automated call queues',
  },
];

const CLIENT_OUTCOMES = [
  {
    quote:
      'Moving our operating reserves to Morning Bright Treasury lifted our idle cash yield to 5.25% APY while giving every department instant virtual cards with hard spend caps.',
    name: 'Hannah Lindholm',
    role: 'VP of Finance, Northstar Logistics Group',
    metric: '+$38,400 annual treasury yield',
  },
  {
    quote:
      'Sign-up took less than a minute with no email link bottlenecks. When I needed to increase my wire limit for a closing, the management chat team cleared it the same afternoon.',
    name: 'David Okafor',
    role: 'Principal Architect, Okafor & Partners Studio',
    metric: 'Same-day $145,000 closing wire',
  },
  {
    quote:
      'Having 6.00% APY goal vaults, zero-fee checking, and direct investment allocations in one uncluttered ledger replaced three separate banking apps for our household.',
    name: 'Claire Morales',
    role: 'Director of Product Operations, Veridian Health',
    metric: '6.00% APY across 4 savings vaults',
  },
];

const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    category: 'Yield & Cash Strategy',
    readTime: '5 min read',
    title: 'Structuring a Three-Tier Liquidity Reserve in 2026',
    summary:
      'How to split operating cash, 6.00% APY high-yield vaults, and low-cost index allocations without sacrificing daily liquidity.',
    img: wealthSavingsImg,
    paragraphs: [
      'Keeping an entire emergency fund inside a 0.01% checking balance quietly erodes purchasing power every quarter. Conversely, locking every spare dollar into illiquid vehicles creates stress when unexpected expenses or investment windows appear.',
      'A disciplined three-tier liquidity structure solves both problems. Tier One holds 30 to 45 days of predictable bills and payroll in a zero-fee checking ledger. Tier Two places three to six months of reserve capital inside a 6.00% APY daily-compounding savings vault where funds remain accessible on demand. Tier Three directs surplus cash beyond your reserve ceiling into diversified, low-expense market allocations.',
      'Inside Morning Bright, you can separate each tier into dedicated goal vaults and schedule automatic transfers on payday so surplus cash begins compounding immediately instead of sitting idle.',
    ],
    takeaways: [
      'Hold 1 month of core operating spend in $0-fee checking for seamless bill pay.',
      'Route 3–6 months of reserves into 6.00% APY vaults with daily compounding.',
      'Review tier thresholds semi-annually as income or obligations change.',
    ],
    relatedPage: 'savings',
    relatedLabel: 'Explore High-Yield Savings',
  },
  {
    category: 'Corporate Treasury',
    readTime: '6 min read',
    title: 'Modern Cash Management for Growing Businesses',
    summary:
      'Controlling vendor spend with virtual cards, accelerating receivables, and putting idle corporate balances to work at 5.25% APY.',
    img: businessTreasuryImg,
    paragraphs: [
      'Growing companies often outpace legacy business checking accounts long before they realize how much yield and operational time is being lost. Waiting on branch approvals for routine wires or sharing a single plastic card across departments creates avoidable audit friction.',
      'Modern treasury teams separate receivables, payroll reserves, and vendor disbursements across dedicated accounts while issuing single-merchant or department-scoped virtual cards with real-time freeze controls.',
      'With Morning Bright Business Banking, authorized controllers can monitor real-time ledger entries, initiate domestic and international wires directly from the portal, and speak directly with account management whenever custom clearing limits are required.',
    ],
    takeaways: [
      'Issue dedicated virtual cards per software vendor or department budget.',
      'Sweep non-operating cash into 5.25% APY treasury reserves.',
      'Maintain an immutable ledger trail for every wire, card spend, and adjustment.',
    ],
    relatedPage: 'business',
    relatedLabel: 'Explore Business Banking',
  },
  {
    category: 'Real Estate & Lending',
    readTime: '7 min read',
    title: 'Evaluating Fixed vs. Adjustable Mortgages in a Shifting Rate Cycle',
    summary:
      'A clear framework for comparing total interest cost, down-payment liquidity, and refinancing breakeven horizons before locking a home loan.',
    img: homeMortgageImg,
    paragraphs: [
      'Choosing between a 30-year fixed mortgage, a 15-year fixed schedule, or a rate-capped adjustable option should start with your realistic holding period rather than headline monthly payment alone.',
      'When comparing loan estimates, evaluate three numbers side by side: the effective APR inclusive of origination charges, your remaining post-closing cash reserve, and the breakeven month at which lower monthly payments offset closing costs.',
      'Morning Bright Lending provides transparent amortization modeling upfront with zero hidden origination padding, allowing you to compare monthly payments and total lifetime interest before submitting an application inside your account.',
    ],
    takeaways: [
      'Preserve at least 6 months of post-closing liquidity before making a larger down payment.',
      'Compare total 5-year and 10-year cost, not just the first monthly installment.',
      'Lock rates once closing timelines are confirmed to eliminate market drift.',
    ],
    relatedPage: 'loans',
    relatedLabel: 'Compare Loan Options',
  },
];

const FAQ_ITEMS = [
  {
    q: 'How does first-time account setup work?',
    a: 'Once you create your account, a short 3-step onboarding flow lets you choose Personal, Business, or Private Wealth banking, set your primary goals and currency, and proceed directly to in-site identity verification or your dashboard.',
  },
  {
    q: 'When does Morning Bright ask for camera access?',
    a: 'We never request camera permissions on public pages or general logins. Camera access is requested strictly on demand when an authenticated, unverified member opens the in-site KYC Verification modal and explicitly chooses live camera capture. Uploading an ID photo or PDF file is always available without using a camera.',
  },
  {
    q: 'Are deposits insured and safeguarded?',
    a: 'Yes. Eligible deposits are safeguarded up to $250,000 per depositor through our partner clearing institutions, backed by AES-256 encryption, segregated custody ledgers, and zero-liability fraud monitoring.',
  },
  {
    q: 'How does the 6.00% APY High-Yield Savings rate work?',
    a: 'Interest compounds daily and credits to your savings balance monthly with no minimum deposit requirement, no monthly maintenance fee, and unlimited transfers between your Morning Bright Checking and Savings vaults.',
  },
  {
    q: 'How do domestic transfers, international SWIFT wires, and limits work?',
    a: 'Verified accounts can execute internal transfers, ACH payouts, and domestic or international wires directly from the Transfers desk. If you need a temporary limit increase for a large closing or vendor disbursement, contact our management team directly through the in-portal Management Chat.',
  },
  {
    q: 'How does Direct Management Chat work inside the portal?',
    a: 'Once logged in, every member has a dedicated real-time Management Chat channel inside Support. Messages route directly to our banking operations desk for instant balance inquiries, wire clearances, card controls, and KYC review updates.',
  },
];

export function LandingPage({ onEnterApp, onSignUp, onForgotPassword }: LandingProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState<JournalArticle | null>(null);
  const [activePage, setActivePage] = useState<'overview' | ProductPageKey>('overview');
  const [legalTab, setLegalTab] = useState<null | 'privacy' | 'terms' | 'cookie' | 'security' | 'acceptable'>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const navigateProduct = (key: 'overview' | ProductPageKey) => {
    setActivePage(key);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (legalTab) {
    return <LegalPage initialTab={legalTab} onClose={() => setLegalTab(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* ARTICLE READER MODAL */}
      <AnimatePresence>
        {activeArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveArticle(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden relative my-8 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                aria-label="Close article"
                className="absolute top-4 right-4 z-10 w-9 h-9 bg-slate-950/70 text-white rounded-full flex items-center justify-center hover:bg-slate-950 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
              <div className="w-full h-56 sm:h-64 bg-slate-100 dark:bg-slate-800 relative">
                <img
                  src={activeArticle.img}
                  alt={activeArticle.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-6 sm:p-8 max-h-[65vh] overflow-y-auto">
                <div className="flex items-center space-x-3 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                  <span>{activeArticle.category}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 dark:text-slate-400">{activeArticle.readTime}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-5 leading-tight">
                  {activeArticle.title}
                </h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                  {activeArticle.paragraphs.map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
                <div className="mt-6 p-5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                    Key Takeaways
                  </h3>
                  <ul className="space-y-2.5">
                    {activeArticle.takeaways.map((point, i) => (
                      <li key={i} className="flex items-start space-x-2.5 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      const target = activeArticle.relatedPage;
                      setActiveArticle(null);
                      navigateProduct(target);
                    }}
                    className="inline-flex items-center space-x-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    <span>{activeArticle.relatedLabel}</span>
                    <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveArticle(null)}
                    className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Close Article
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INSTITUTIONAL TOP BAR */}
      <div className="bg-slate-900 dark:bg-[#03081a] text-slate-300 px-4 py-2 border-b border-white/10 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs">
          <div className="flex items-center space-x-5">
            <span className="flex items-center space-x-1.5 font-medium">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Member FDIC Partner Custody</span>
            </span>
            <span className="flex items-center space-x-1.5 font-medium">
              <Home size={14} className="text-emerald-400" />
              <span>Equal Housing Lender</span>
            </span>
            <span className="text-slate-400 tabular-nums">Deposits safeguarded up to $250,000</span>
          </div>
          <div className="flex items-center space-x-5">
            <button
              type="button"
              onClick={() => navigateProduct('about')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About Morning Bright
            </button>
            <button
              type="button"
              onClick={() => toast('25,000+ fee-free Allpoint & MoneyPass ATMs nationwide.', { icon: '📍' })}
              className="hover:text-white transition-colors cursor-pointer"
            >
              ATM Network
            </button>
            <button
              type="button"
              onClick={() => setLegalTab('security')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Security
            </button>
          </div>
        </div>
      </div>

      {/* CLEAN 3-ZONE HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigateProduct('overview')}
            className="flex items-center space-x-2.5 shrink-0 cursor-pointer"
          >
            <Logo className="w-8 h-8" withBackground={true} />
            <span className="font-bold text-lg md:text-xl tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Morning Bright
            </span>
          </button>

          <nav className="hidden xl:flex items-center gap-6 2xl:gap-7">
            {NAV_PRODUCTS.map((item) => {
              const isActive = activePage === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigateProduct(item.key)}
                  className={`text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer py-1 border-b-2 ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500'
                      : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden xl:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onSignUp}
              className="px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg transition-colors cursor-pointer"
            >
              Open Account
            </button>
            <button
              type="button"
              onClick={onEnterApp}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center space-x-2 whitespace-nowrap cursor-pointer"
            >
              <Lock size={15} />
              <span>Log In</span>
            </button>
          </div>

          {/* Tablet & Mobile Actions + Menu Trigger */}
          <div className="flex xl:hidden items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onSignUp}
              className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer whitespace-nowrap"
            >
              Open Account
            </button>
            <button
              type="button"
              onClick={onEnterApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer whitespace-nowrap"
            >
              Log In
            </button>
            <button
              type="button"
              aria-label="Toggle navigation menu"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* TABLET & MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="xl:hidden fixed inset-x-0 top-16 md:top-20 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto p-5 sm:px-6 flex flex-col space-y-1">
              <div className="grid sm:grid-cols-2 gap-1 sm:gap-x-6">
                {NAV_PRODUCTS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => navigateProduct(item.key)}
                    className={`text-left text-base font-semibold py-3 px-2 rounded-lg border-b border-slate-100 dark:border-white/5 cursor-pointer transition-colors ${
                      activePage === item.key
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="pt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignUp();
                  }}
                  className="py-3 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-center text-sm cursor-pointer"
                >
                  Open Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onEnterApp();
                  }}
                  className="py-3 bg-emerald-600 text-white font-bold rounded-xl text-center text-sm cursor-pointer"
                >
                  Log In
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activePage !== 'overview' ? (
        <ProductPages
          page={activePage}
          onSelectPage={(p) => navigateProduct(p)}
          onBack={() => navigateProduct('overview')}
          onSignUp={onSignUp}
          onLogIn={onEnterApp}
        />
      ) : (
        <>
          {/* HERO SECTION */}
          <section className="relative pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 items-center">
              <div className="lg:col-span-6 space-y-5 sm:space-y-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                  Private & Commercial Digital Banking
                </p>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                  Earn <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">6.00% APY</span> on savings, backed by private-grade banking.
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                  Zero monthly maintenance fees, <span className="font-semibold text-slate-900 dark:text-white tabular-nums">25,000+</span> fee-free ATMs, instant virtual cards, and personalized personal or business onboarding. Open with a <span className="font-semibold text-slate-900 dark:text-white tabular-nums">$0</span> minimum balance.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onSignUp}
                    className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm inline-flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Open Account</span>
                    <ArrowRight size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={onEnterApp}
                    className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white font-semibold rounded-xl border border-slate-200 dark:border-white/10 transition-colors text-center cursor-pointer"
                  >
                    Client Portal Login
                  </button>
                </div>

                {/* $500 Welcome Bonus Card */}
                <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 max-w-xl">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                        Earn a <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">$500</span> Welcome Bonus
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Available to new checking & savings members with qualifying direct deposit.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md shrink-0 tabular-nums">
                      $0 MIN
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-200 dark:border-white/10">
                    <div className="flex items-start space-x-2">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">01</span>
                      <span>Choose personal or business profile</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">02</span>
                      <span>Complete in-site KYC verification</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">03</span>
                      <span>Bonus posts within 30 days</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl bg-slate-900">
                  <img
                    src={heroPrivateImg}
                    alt="Morning Bright Private Banking headquarters lounge"
                    className="w-full h-[260px] sm:h-[360px] md:h-[420px] lg:h-[460px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 text-white">
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-300 mb-1">
                        Unified Client Ledger
                      </p>
                      <p className="text-base sm:text-lg md:text-xl font-bold leading-snug">
                        Checking, 6.00% APY Vaults, Wires & Management Desk in one portal.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateProduct('savings')}
                      className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/20 transition-colors cursor-pointer text-center"
                    >
                      Calculate Yield →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4-COLUMN INSTITUTIONAL KPI STRIP */}
          <section className="bg-slate-100/80 dark:bg-slate-900/70 border-b border-slate-200 dark:border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8 grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8">
              {[
                { value: '$4.8B+', label: 'Client Assets Safeguarded' },
                { value: '6.00% APY', label: 'High-Yield Savings Rate' },
                { value: '25,000+', label: 'Fee-Free ATMs Nationwide' },
                { value: 'In-Site', label: 'Guided Onboarding & KYC' },
              ].map((stat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SERVICES CAPABILITIES GRID */}
          <section className="py-20 max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-2">
                  Full-Spectrum Banking Suite
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Built for everyday liquidity and long-term wealth.
                </h2>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md">
                Every product connects to a single real-time ledger with transparent schedules, instant card controls, and direct management oversight.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {[
                {
                  icon: Landmark,
                  title: 'Checking Accounts',
                  desc: '$0 monthly fee, early direct deposit, bill pay, and instant ACH.',
                  target: 'checking' as ProductPageKey,
                },
                {
                  icon: PieChart,
                  title: 'High-Yield Savings',
                  desc: '6.00% APY compounded daily across dedicated goal vaults.',
                  target: 'savings' as ProductPageKey,
                },
                {
                  icon: CreditCard,
                  title: 'Credit & Metal Cards',
                  desc: 'Up to 3% cashback, instant virtual cards, and one-tap freeze.',
                  target: 'cards' as ProductPageKey,
                },
                {
                  icon: Home,
                  title: 'Home Mortgages',
                  desc: 'Fixed and adjustable residential loans with clear amortization.',
                  target: 'loans' as ProductPageKey,
                },
                {
                  icon: Car,
                  title: 'Auto & Personal Loans',
                  desc: 'Competitive APR financing with same-day pre-qualification.',
                  target: 'loans' as ProductPageKey,
                },
                {
                  icon: TrendingUp,
                  title: 'Wealth & Investing',
                  desc: 'Zero-commission ETFs, treasury ladders, and managed portfolios.',
                  target: 'investing' as ProductPageKey,
                },
                {
                  icon: Building2,
                  title: 'Business Treasury',
                  desc: '5.25% APY corporate cash reserves, SWIFT wires, and team cards.',
                  target: 'business' as ProductPageKey,
                },
                {
                  icon: ShieldCheck,
                  title: 'About & Governance',
                  desc: 'Charter standards, FDIC partner custody, and institutional security.',
                  target: 'about' as ProductPageKey,
                },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => navigateProduct(item.target)}
                  className="text-left flex flex-col justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-emerald-500/70 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <item.icon size={22} />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-5">
                    <span>Explore details</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* TRANSPARENT COMPARISON TABLE (Cards on Mobile, Table on Tablet & Desktop) */}
          <section className="py-16 sm:py-20 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl mb-8 sm:mb-10">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-2">
                  Fee & Yield Transparency
                </p>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                  See how Morning Bright compares to legacy banks.
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                  No hidden account minimums, no wire-desk branch appointments, and direct access to real operations specialists inside your dashboard.
                </p>
              </div>

              {/* Mobile Stacked Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:hidden">
                {COMPARISON_ROWS.map((row, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 space-y-3"
                  >
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {row.feature}
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                          Morning Bright
                        </div>
                        <div className="font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">
                          {row.morningBright}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          National Avg.
                        </div>
                        <div className="font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                          {row.traditional}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tablet & Desktop Institutional Comparison Table */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80">
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Banking Capability
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/5">
                        Morning Bright
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        National Bank Average
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-sm">
                    {COMPARISON_ROWS.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                          {row.feature}
                        </td>
                        <td className="py-4 px-6 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 tabular-nums">
                          <span className="inline-flex items-center space-x-2">
                            <CheckCircle2 size={16} className="shrink-0" />
                            <span>{row.morningBright}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 tabular-nums">
                          {row.traditional}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 3-STEP ONBOARDING ARCHITECTURE */}
          <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10 sm:mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-2">
                Streamlined Onboarding
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                From registration to active banking in minutes.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Every onboarding and compliance step happens cleanly inside the platform, tailored around whether you bank as an individual, business, or private wealth member.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {[
                {
                  step: '01',
                  icon: Clock,
                  title: 'Register & Personalize Your Profile',
                  desc: 'Create your account and answer three quick onboarding questions—selecting Personal, Business, or Private Wealth preferences and base currency.',
                },
                {
                  step: '02',
                  icon: FileCheck2,
                  title: 'Verify Identity In-Site',
                  desc: 'Complete KYC verification directly inside your dashboard by uploading a document or using on-demand camera capture whenever you are ready.',
                },
                {
                  step: '03',
                  icon: MessageSquare,
                  title: 'Transact & Message Management',
                  desc: 'Activate virtual cards, build 6.00% APY savings vaults, send domestic or SWIFT wires, and chat directly with operations management anytime.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {item.step}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                        <item.icon size={20} />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* EDITORIAL SPLIT 1: CARDS & PAYMENT CONTROLS */}
          <section className="py-20 bg-white dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/10">
            <div className="max-w-7xl mx-auto px-4 md:px-8 grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6">
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl bg-slate-950">
                  <img
                    src={cardObsidianImg}
                    alt="Morning Bright Obsidian matte metal card"
                    className="w-full h-[320px] sm:h-[380px] object-cover"
                  />
                </div>
              </div>
              <div className="lg:col-span-6 space-y-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                  Cards & Treasury Controls
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Precision metal & virtual cards with instant freeze controls.
                </h2>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Issue single-purpose virtual cards for recurring subscriptions or travel, customize daily spending ceilings from your dashboard, and lock compromised cards in one tap—without disrupting your primary checking balance.
                </p>
                <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  {[
                    'Up to 3% cashback on dining, travel, and recurring commercial spend',
                    'Zero foreign transaction fees across 150+ supported currencies',
                    'Real-time ledger notifications on every card authorization and settlement',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigateProduct('cards')}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors inline-flex items-center space-x-2 cursor-pointer"
                  >
                    <span>Explore Credit & Debit Cards</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={onSignUp}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white text-sm font-semibold rounded-xl border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                  >
                    Open Account
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* EDITORIAL SPLIT 2: SECURITY & PRIVACY ARCHITECTURE */}
          <section className="py-20 bg-slate-950 text-white border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 md:px-8 grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                  Security & Privacy First
                </p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                  Your security is our primary architecture.
                </h2>
                <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                  We safeguard both your capital and your device privacy. Ledgers are encrypted end-to-end with AES-256, every administrative adjustment is audit-logged, and device hardware like your camera is never requested unless you explicitly start in-site KYC capture inside your authenticated account.
                </p>

                <ul className="space-y-3.5 text-sm text-slate-200">
                  {[
                    'Strict on-demand hardware permissions — zero background or visitor camera prompts',
                    'Role-isolated ledger rules with immutable audit logging on every adjustment',
                    'Zero-liability fraud protection with instant card freeze and management alerts',
                    'Segregated partner custody safeguarding eligible deposits up to $250,000',
                  ].map((text, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <Shield size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setLegalTab('security')}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Read Security Policy
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateProduct('about')}
                    className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl border border-white/15 transition-colors cursor-pointer"
                  >
                    Governance & Custody
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-slate-900">
                  <img
                    src={mobileSecurityImg}
                    alt="Morning Bright hardware security and encrypted authentication"
                    className="w-full h-[320px] sm:h-[390px] object-cover"
                  />
                  <div className="p-6 grid sm:grid-cols-2 gap-4 bg-slate-900/95 border-t border-white/10">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                        Encryption Standard
                      </div>
                      <div className="text-base font-bold text-white mt-1">AES-256 + TLS 1.3</div>
                    </div>
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                        Verification Privacy
                      </div>
                      <div className="text-base font-bold text-emerald-400 mt-1">
                        In-Site & On-Demand Only
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CLIENT OUTCOMES / TESTIMONIALS */}
          <section className="py-20 max-w-7xl mx-auto px-4 md:px-8">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-2">
                Member Perspectives
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                Trusted by households, founders, and finance teams.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {CLIENT_OUTCOMES.map((item, idx) => (
                <div
                  key={idx}
                  className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {item.metric}
                    </div>
                    <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-white/10">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* BETTER MONEY HABITS — EDITORIAL JOURNAL */}
          <section className="py-20 bg-white dark:bg-slate-900/60 border-t border-slate-200 dark:border-white/10">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-2">
                    Morning Bright Journal
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Better Money Habits
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-base mt-2">
                    Practical frameworks on cash yield, corporate treasury, and long-term lending.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateProduct('investing')}
                  className="inline-flex items-center space-x-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <span>Explore Wealth & Investing</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-7">
                {JOURNAL_ARTICLES.map((article, i) => (
                  <article
                    key={i}
                    onClick={() => setActiveArticle(article)}
                    className="group cursor-pointer bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col justify-between hover:border-emerald-500/60 hover:shadow-lg transition-all"
                  >
                    <div>
                      <div className="w-full h-52 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <img
                          src={article.img}
                          alt={article.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                          <span>{article.category}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500 dark:text-slate-400">{article.readTime}</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug mb-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>
                    </div>
                    <div className="px-6 pb-6 pt-1">
                      <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <span>Read full briefing</span>
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* INTERACTIVE FAQ ACCORDION */}
          <section className="py-20 max-w-4xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-2">
                Answers & Disclosures
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                Frequently asked questions
              </h2>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        {item.q}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 pt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CLOSING CONVERSION BAND */}
          <section className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
            <div className="max-w-7xl mx-auto relative rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-950 text-white">
              <img
                src={heroArchitectureImg}
                alt="Morning Bright headquarters architecture"
                className="absolute inset-0 w-full h-full object-cover opacity-25"
              />
              <div className="relative z-10 p-6 sm:p-10 lg:p-16 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
                <div className="max-w-2xl space-y-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                    Open Your Account Today
                  </p>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                    Start earning 6.00% APY with modern personal or business banking.
                  </h2>
                  <p className="text-slate-300 text-sm sm:text-base">
                    Open an account in minutes, personalize your workspace, manage balances cleanly, and connect directly with management whenever you need support.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={onSignUp}
                    className="w-full sm:w-auto px-7 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer text-center"
                  >
                    Open Personal Account
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateProduct('business')}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors cursor-pointer text-center"
                  >
                    Explore Business Banking
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* STRUCTURED 5-COLUMN FOOTER */}
      <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 pt-14 sm:pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
            <div className="sm:col-span-2 md:col-span-3 lg:col-span-1 space-y-4">
              <button
                type="button"
                onClick={() => navigateProduct('overview')}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <Logo className="w-7 h-7 text-emerald-600" withBackground={true} />
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                  Morning Bright
                </span>
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Private-grade digital checking, high-yield savings, cards, lending, and corporate treasury built for clarity and real-time control.
              </p>
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <Globe size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>United States · USD Clearing</span>
              </div>
            </div>

            <div>
              <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-4">Client Portal</h4>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <button type="button" onClick={onEnterApp} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    Log In
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onSignUp} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    Open Account
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onEnterApp} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    Activate Card
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => (onForgotPassword ? onForgotPassword() : onEnterApp())}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Forgot Password
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-4">Products</h4>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <button type="button" onClick={() => navigateProduct('checking')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    Checking Accounts
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigateProduct('savings')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    High-Yield Savings
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigateProduct('cards')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    Credit & Metal Cards
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigateProduct('loans')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    Loans & Mortgages
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigateProduct('investing')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    Wealth & Investing
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigateProduct('business')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    Business Treasury
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-4">Company & Support</h4>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <button type="button" onClick={() => navigateProduct('about')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    About & Governance
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onEnterApp} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    Management Chat Desk
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => toast('25,000+ fee-free Allpoint & MoneyPass ATMs nationwide.', { icon: '📍' })}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    ATM Network
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => toast('Operations Desk: support@morningbrightfinance.com', { icon: '✉️' })}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Contact Support
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLegalTab('security')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    Security Center
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-4">Legal & Disclosures</h4>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <button type="button" onClick={() => setLegalTab('privacy')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLegalTab('terms')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLegalTab('cookie')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    Cookie Policy
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLegalTab('acceptable')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    Acceptable Use
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-white/10 pt-8 text-xs text-slate-500 dark:text-slate-400 space-y-3">
            <p>
              Morning Bright Financial Services is a digital banking platform. Eligible deposits are insured up to $250,000 per depositor through partner clearing institutions. APYs are variable and subject to change. Investment advisory products are not FDIC insured and may lose value.
            </p>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p>© 2026 Morning Bright Financial Services. All rights reserved.</p>
              <div className="flex flex-wrap gap-5">
                <button type="button" onClick={() => setLegalTab('privacy')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                  Privacy
                </button>
                <button type="button" onClick={() => setLegalTab('terms')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                  Terms
                </button>
                <button type="button" onClick={() => setLegalTab('cookie')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                  Cookies
                </button>
                <button type="button" onClick={() => setLegalTab('security')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                  Security
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
