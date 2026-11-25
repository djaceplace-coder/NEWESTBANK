/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useStore } from '../store';
import { TransactionType } from './types';
import { formatCurrency } from '../utils';
import {
  Send,
  Search,
  X,
  UserPlus,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  Landmark,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Bell,
  Wallet,
  ClipboardList,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  FileText,
} from 'lucide-react';

type AdminHubTab = 'finances' | 'chat' | 'controls' | 'queues';

export function AdminPanel() {
  const {
    user,
    usersList,
    adminLogs,
    adminTickets,
    adminLoans,
    adminInvestments,
    adminChatMessages,
    adminSelectedUserBalance,
    adminSelectedUserTransactions,
    adminCreateUserAccount,
    adminLoadUsers,
    adminLoadLogs,
    adminLoadTickets,
    adminLoadLoans,
    adminUpdateLoanStatus,
    adminLoadInvestments,
    adminSettleRedemption,
    adminLoadChatMessages,
    adminSendChatMessage,
    adminMarkUserChatRead,
    adminSubscribeSelectedUser,
    clearAdminSubscriptions,
    adminUpdateTicketStatus,
    adminEditBalance,
    adminAddSystemTransaction,
    adminPushSystemNotification,
    adminVerifyUser,
    adminBroadcastNotification,
    adminFreezeUser,
    adminSuspendUser,
    adminToggleAdminRole,
  } = useStore();

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<AdminHubTab>('finances');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create New Client Account Form
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newChecking, setNewChecking] = useState('5000');
  const [newSavings, setNewSavings] = useState('15000');
  const [newCurrency, setNewCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [newIsVerified, setNewIsVerified] = useState(true);
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState<{
    email: string;
    password: string;
    accountNumber: string;
    fullName: string;
  } | null>(null);

  // Balance Form
  const [checkingInput, setCheckingInput] = useState('0');
  const [savingsInput, setSavingsInput] = useState('0');

  // Transaction Injection Form
  const [txAmount, setTxAmount] = useState('250');
  const [txType, setTxType] = useState<TransactionType>(TransactionType.DEPOSIT);
  const [txMerchant, setTxMerchant] = useState('Wire Credit Adjustment');
  const [txCategory, setTxCategory] = useState('Treasury');

  // Notification Form
  const [broadcastMode, setBroadcastMode] = useState<boolean>(false);
  const [notifType, setNotifType] = useState<'info' | 'success' | 'alert' | 'system'>('info');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');

  // Management Chat Form
  const [chatReply, setChatReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Search & Document Preview
  const [userSearch, setUserSearch] = useState('');
  const [previewDocument, setPreviewDocument] = useState<{
    subject: string;
    dataUri: string;
  } | null>(null);

  useEffect(() => {
    clearAdminSubscriptions();
    adminLoadUsers();
    adminLoadLogs();
    adminLoadTickets();
    adminLoadLoans();
    adminLoadInvestments();
    adminLoadChatMessages();
    return () => {
      clearAdminSubscriptions();
    };
  }, []);

  useEffect(() => {
    if (usersList.length > 0 && !selectedUserId) {
      setSelectedUserId(usersList[0].uid);
    }
  }, [usersList, selectedUserId]);

  useEffect(() => {
    if (selectedUserId) {
      adminSubscribeSelectedUser(selectedUserId);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (adminSelectedUserBalance) {
      setCheckingInput(adminSelectedUserBalance.checking.toString());
      setSavingsInput(adminSelectedUserBalance.savings.toString());
    } else {
      setCheckingInput('0');
      setSavingsInput('0');
    }
  }, [adminSelectedUserBalance?.uid, adminSelectedUserBalance?.checking, adminSelectedUserBalance?.savings]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return usersList;
    return usersList.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.accountNumber || '').includes(q),
    );
  }, [usersList, userSearch]);

  const activeTargetProfile = usersList.find((u) => u.uid === selectedUserId) || null;
  const targetCurrency = activeTargetProfile?.currency || 'USD';

  const unreadByUser = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const msg of adminChatMessages) {
      if (msg.senderRole === 'client' && !msg.isReadByAdmin) {
        counts[msg.userId] = (counts[msg.userId] || 0) + 1;
      }
    }
    return counts;
  }, [adminChatMessages]);

  const totalUnreadChats = useMemo(
    () => (Object.values(unreadByUser) as number[]).reduce((acc, n) => acc + n, 0),
    [unreadByUser],
  );

  const selectedUserChat = useMemo(
    () => adminChatMessages.filter((m) => m.userId === selectedUserId),
    [adminChatMessages, selectedUserId],
  );

  const pendingQueuesCount =
    adminLoans.filter((l) => l.status === 'pending').length +
    adminInvestments.filter((i) => i.status === 'redemption_requested').length +
    adminTickets.filter((t) => t.status !== 'resolved').length;

  useEffect(() => {
    if (activeTab === 'chat' && selectedUserId) {
      adminMarkUserChatRead(selectedUserId);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, selectedUserId, selectedUserChat.length]);

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setShowNewPassword(true);
  };

  const handleCreateClientAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim() || newPassword.length < 6) {
      toast.error('Fill out name, email, and a password of at least 6 characters.');
      return;
    }

    setCreatingAccount(true);
    try {
      const res = await adminCreateUserAccount({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        initialChecking: parseFloat(newChecking) || 0,
        initialSavings: parseFloat(newSavings) || 0,
        currency: newCurrency,
        isVerified: newIsVerified,
        isAdmin: newIsAdmin,
      });

      if (res) {
        setCreatedReceipt({
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          accountNumber: res.accountNumber,
          fullName: `${newFirstName.trim()} ${newLastName.trim()}`,
        });
        setSelectedUserId(res.uid);
        setNewFirstName('');
        setNewLastName('');
        setNewEmail('');
        setNewPassword('');
        setNewIsAdmin(false);
      }
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleUpdateBalances = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    const chk = parseFloat(checkingInput);
    const sav = parseFloat(savingsInput);
    if (isNaN(chk) || isNaN(sav) || chk < 0 || sav < 0) {
      toast.error('Enter valid non-negative checking and savings amounts.');
      return;
    }
    await adminEditBalance(selectedUserId, chk, sav);
    toast.success(`Balances updated for ${activeTargetProfile?.email || selectedUserId}.`);
  };

  const handleInsertTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Enter a positive transaction amount.');
      return;
    }
    await adminAddSystemTransaction(selectedUserId, amt, txType, txMerchant, txCategory);
    toast.success(`Posted ${txType.replace('_', ' ')} of ${formatCurrency(amt, targetCurrency)}.`);
    setTxAmount('100');
  };

  const handlePushNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMsg.trim()) return;

    if (broadcastMode) {
      await adminBroadcastNotification(notifTitle.trim(), notifMsg.trim(), notifType);
      toast.success('Notification broadcast delivered to all clients.');
    } else {
      if (!selectedUserId) return;
      await adminPushSystemNotification(
        selectedUserId,
        notifTitle.trim(),
        notifMsg.trim(),
        notifType,
      );
      toast.success(`Notification delivered to ${activeTargetProfile?.email || selectedUserId}.`);
    }
    setNotifTitle('');
    setNotifMsg('');
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !chatReply.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const ok = await adminSendChatMessage(selectedUserId, chatReply.trim());
      if (ok) setChatReply('');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 font-sans space-y-6 pb-24 transition-colors">
      {/* HEADER BAR */}
      <div className="border-b border-slate-200 dark:border-white/10 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-semibold">
            Morning Bright Operations
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Client Management Console
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {usersList.length} registered accounts · {totalUnreadChats} unread client messages · {pendingQueuesCount} items in review queues
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          {showCreateForm ? <X size={14} /> : <UserPlus size={14} />}
          <span>{showCreateForm ? 'Close Registration' : 'Register New Client'}</span>
        </button>
      </div>

      {/* CREATED CREDENTIALS RECEIPT */}
      {createdReceipt && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 size={15} />
              <span>Account Provisioned &amp; Ready for Immediate Login — {createdReceipt.fullName}</span>
            </div>
            <div className="text-xs font-mono text-slate-700 dark:text-slate-200 select-text">
              Email: <strong>{createdReceipt.email}</strong> · Password: <strong>{createdReceipt.password}</strong> · Acct #: <strong>{createdReceipt.accountNumber}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(
                  `Morning Bright Account\nEmail: ${createdReceipt.email}\nPassword: ${createdReceipt.password}\nAccount #: ${createdReceipt.accountNumber}`,
                );
                toast.success('Credentials copied to clipboard.');
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Copy size={13} />
              <span>Copy Credentials</span>
            </button>
            <button
              type="button"
              onClick={() => setCreatedReceipt(null)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* COLLAPSIBLE CLIENT REGISTRATION DRAWER */}
      {showCreateForm && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus size={15} className="text-emerald-600" />
                <span>Register New Client Account (Immediate Login, No Email Confirmation)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Creates an active Firebase Auth &amp; Firestore account without interrupting your admin session.
              </p>
            </div>
            <button
              type="button"
              onClick={generateStrongPassword}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Generate Password</span>
            </button>
          </div>

          <form onSubmit={handleCreateClientAccount} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">First Name</label>
              <input
                type="text"
                required
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                placeholder="Jordan"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Last Name</label>
              <input
                type="text"
                required
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                placeholder="Taylor"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Client Email</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="client@domain.com"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Initial Password</label>
              <div className="relative">
                <KeyRound size={13} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full h-10 pl-8 pr-9 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Opening Checking</label>
              <input
                type="number"
                min={0}
                step="any"
                value={newChecking}
                onChange={(e) => setNewChecking(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Opening Savings</label>
              <input
                type="number"
                min={0}
                step="any"
                value={newSavings}
                onChange={(e) => setNewSavings(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Currency</label>
              <select
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value as 'USD' | 'EUR' | 'GBP')}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="md:col-span-4 flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-center gap-4 h-10">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsVerified}
                    onChange={(e) => setNewIsVerified(e.target.checked)}
                    className="rounded text-emerald-600 cursor-pointer"
                  />
                  <span>KYC Verified</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsAdmin}
                    onChange={(e) => setNewIsAdmin(e.target.checked)}
                    className="rounded text-amber-600 cursor-pointer"
                  />
                  <span>Admin</span>
                </label>
              </div>
              <button
                type="submit"
                disabled={creatingAccount}
                className="h-10 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <UserPlus size={14} />
                <span>{creatingAccount ? 'Creating...' : 'Create Account'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MAIN MASTER-DETAIL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CLIENT DIRECTORY */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Client Directory ({filteredUsers.length})
            </h3>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search name, email, or account #..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                No matching client accounts.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = u.uid === selectedUserId;
                const unread = unreadByUser[u.uid] || 0;
                const flags: string[] = [];
                if (u.isAdmin) flags.push('Admin');
                flags.push(u.isVerified ? 'KYC Verified' : 'Unverified');
                if (u.isFrozen) flags.push('Frozen');
                if (u.isSuspended) flags.push('Suspended');

                return (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => setSelectedUserId(u.uid)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-500/10'
                        : 'border-slate-200 dark:border-white/5 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {u.email}
                        </p>
                      </div>
                      {unread > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-mono font-bold shrink-0">
                          {unread} new
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-2">
                      {flags.join(' · ')}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SELECTED CLIENT MANAGEMENT HUB */}
        <div className="lg:col-span-8 space-y-6">
          {/* SELECTED CLIENT SUMMARY HEADER + TAB BAR */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm space-y-4">
            {activeTargetProfile ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {activeTargetProfile.firstName} {activeTargetProfile.lastName}
                    </h3>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      · Acct #{activeTargetProfile.accountNumber || '—'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeTargetProfile.email} · {activeTargetProfile.isVerified ? 'Verified In-Site' : 'KYC Pending'}
                    {activeTargetProfile.isFrozen ? ' · Frozen' : ''}
                    {activeTargetProfile.isSuspended ? ' · Suspended' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-right tabular-nums">
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-slate-500">Checking</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                      {formatCurrency(adminSelectedUserBalance?.checking ?? 0, targetCurrency)}
                    </span>
                  </div>
                  <div className="h-7 w-px bg-slate-200 dark:bg-white/10" />
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-slate-500">Savings</span>
                    <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      {formatCurrency(adminSelectedUserBalance?.savings ?? 0, targetCurrency)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Select a client from the directory to manage their account.</p>
            )}

            {/* CLEAN SUB-TABS */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
              {[
                { id: 'finances' as const, label: 'Balances & Ledger', icon: Wallet },
                {
                  id: 'chat' as const,
                  label: `Management Chat${selectedUserId && unreadByUser[selectedUserId] ? ` (${unreadByUser[selectedUserId]})` : ''}`,
                  icon: MessageSquare,
                },
                { id: 'controls' as const, label: 'Alerts & Controls', icon: Bell },
                {
                  id: 'queues' as const,
                  label: `Queues & Audit${pendingQueuesCount ? ` (${pendingQueuesCount})` : ''}`,
                  icon: ClipboardList,
                },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <t.icon size={14} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: BALANCES & TRANSACTIONS */}
          {activeTab === 'finances' && activeTargetProfile && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Direct Balance Editor */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-sm">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Adjust Account Balances
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Updates balances live and notifies {activeTargetProfile.firstName}.
                    </p>
                  </div>
                  <form onSubmit={handleUpdateBalances} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Checking Balance ({targetCurrency})
                      </label>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        value={checkingInput}
                        onChange={(e) => setCheckingInput(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-sm font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Savings Balance ({targetCurrency})
                      </label>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        value={savingsInput}
                        onChange={(e) => setSavingsInput(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-sm font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full h-10 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Save Balance Update
                    </button>
                  </form>
                </div>

                {/* Post Transaction */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-sm">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Post Ledger Transaction
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Credits or debits checking automatically and posts to client history.
                    </p>
                  </div>
                  <form onSubmit={handleInsertTransaction} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Amount ({targetCurrency})
                        </label>
                        <input
                          type="number"
                          step="any"
                          min={0.01}
                          required
                          value={txAmount}
                          onChange={(e) => setTxAmount(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-sm font-mono tabular-nums text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Entry Type
                        </label>
                        <select
                          value={txType}
                          onChange={(e) => setTxType(e.target.value as TransactionType)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                        >
                          <option value={TransactionType.DEPOSIT}>Deposit (+)</option>
                          <option value={TransactionType.TRANSFER_RECEIVED}>Transfer Received (+)</option>
                          <option value={TransactionType.WITHDRAWAL}>Withdrawal (-)</option>
                          <option value={TransactionType.CARD_SPEND}>Card Spend (-)</option>
                          <option value={TransactionType.TRANSFER_SENT}>Transfer Sent (-)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Description / Merchant
                        </label>
                        <input
                          type="text"
                          required
                          value={txMerchant}
                          onChange={(e) => setTxMerchant(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          required
                          value={txCategory}
                          onChange={(e) => setTxCategory(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Post Transaction &amp; Sync Balance
                    </button>
                  </form>
                </div>
              </div>

              {/* Live Client Transaction Ledger */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Live Transaction Ledger ({adminSelectedUserTransactions.length})
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Real-time history for {activeTargetProfile.firstName} {activeTargetProfile.lastName}
                    </p>
                  </div>
                </div>

                {adminSelectedUserTransactions.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                    No transactions recorded for this account yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-80 overflow-y-auto pr-1">
                    {adminSelectedUserTransactions.map((tx) => {
                      const isCredit =
                        tx.type === TransactionType.DEPOSIT ||
                        tx.type === TransactionType.TRANSFER_RECEIVED;
                      return (
                        <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isCredit
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {isCredit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {tx.merchant}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {tx.category} · {tx.type.replace('_', ' ')} ·{' '}
                                {new Date(tx.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 tabular-nums">
                            <span
                              className={`block text-xs font-mono font-bold ${
                                isCredit
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {isCredit ? '+' : '-'}
                              {formatCurrency(tx.amount, targetCurrency)}
                            </span>
                            <span className="text-[10px] font-mono uppercase text-slate-400">
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MANAGEMENT CHAT */}
          {activeTab === 'chat' && activeTargetProfile && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/50">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Direct Chat — {activeTargetProfile.firstName} {activeTargetProfile.lastName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Replies deliver in real time to the client&apos;s Support &amp; Management Chat and notification inbox.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={14} /> Live Sync
                </span>
              </div>

              <div className="h-96 overflow-y-auto p-5 space-y-3.5 bg-slate-50/40 dark:bg-slate-950/30">
                {selectedUserChat.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No messages with {activeTargetProfile.firstName} yet
                    </p>
                    <p className="text-xs text-slate-500">
                      Send a proactive message below to open a direct management conversation.
                    </p>
                  </div>
                ) : (
                  selectedUserChat.map((msg) => {
                    const isAdminMsg = msg.senderRole === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {isAdminMsg ? msg.senderName : `${activeTargetProfile.firstName} ${activeTargetProfile.lastName}`}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div
                          className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isAdminMsg
                              ? 'bg-emerald-700 text-white rounded-br-sm'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={handleSendAdminReply}
                className="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex items-center gap-3"
              >
                <input
                  type="text"
                  value={chatReply}
                  onChange={(e) => setChatReply(e.target.value)}
                  placeholder={`Reply to ${activeTargetProfile.firstName}...`}
                  maxLength={2000}
                  className="flex-1 h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !chatReply.trim()}
                  className="h-11 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Send size={14} />
                  <span>{sendingReply ? 'Sending' : 'Send Reply'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS & ACCOUNT CONTROLS */}
          {activeTab === 'controls' && activeTargetProfile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Controls */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-sm">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Account Status &amp; Permissions
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Instant compliance and access toggles for {activeTargetProfile.email}.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">In-Site KYC Verification</p>
                      <p className="text-[11px] text-slate-500">
                        {activeTargetProfile.isVerified ? 'Verified client account' : 'Pending compliance verification'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await adminVerifyUser(activeTargetProfile.uid, !activeTargetProfile.isVerified);
                        toast.success(
                          `KYC ${!activeTargetProfile.isVerified ? 'approved' : 'revoked'} for ${activeTargetProfile.email}.`,
                        );
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        activeTargetProfile.isVerified
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white dark:bg-slate-900 border border-emerald-600 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {activeTargetProfile.isVerified ? 'Verified · Revoke' : 'Approve KYC'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Outbound Freeze</p>
                      <p className="text-[11px] text-slate-500">
                        {activeTargetProfile.isFrozen ? 'Transfers & cards locked' : 'Normal spending active'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await adminFreezeUser(activeTargetProfile.uid, !activeTargetProfile.isFrozen);
                        toast.success(
                          `${activeTargetProfile.email} ${!activeTargetProfile.isFrozen ? 'frozen' : 'unfrozen'}.`,
                        );
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        activeTargetProfile.isFrozen
                          ? 'bg-red-600 text-white'
                          : 'bg-white dark:bg-slate-900 border border-red-500/40 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {activeTargetProfile.isFrozen ? 'Frozen · Unfreeze' : 'Freeze Account'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Access Suspension</p>
                      <p className="text-[11px] text-slate-500">
                        {activeTargetProfile.isSuspended ? 'Portal access blocked' : 'Portal login active'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await adminSuspendUser(activeTargetProfile.uid, !activeTargetProfile.isSuspended);
                        toast.success(
                          `${activeTargetProfile.email} ${!activeTargetProfile.isSuspended ? 'suspended' : 'reactivated'}.`,
                        );
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        activeTargetProfile.isSuspended
                          ? 'bg-amber-600 text-white'
                          : 'bg-white dark:bg-slate-900 border border-amber-500/40 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {activeTargetProfile.isSuspended ? 'Suspended · Restore' : 'Suspend Portal'}
                    </button>
                  </div>

                  {activeTargetProfile.uid !== user?.uid && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Administrator Privileges</p>
                        <p className="text-[11px] text-slate-500">
                          {activeTargetProfile.isAdmin ? 'Has full admin console access' : 'Standard client account'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await adminToggleAdminRole(
                            activeTargetProfile.uid,
                            activeTargetProfile.email,
                            !activeTargetProfile.isAdmin,
                          );
                          toast.success(
                            `Admin access ${!activeTargetProfile.isAdmin ? 'granted' : 'revoked'} for ${activeTargetProfile.email}.`,
                          );
                        }}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          activeTargetProfile.isAdmin
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                            : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {activeTargetProfile.isAdmin ? 'Revoke Admin' : 'Grant Admin'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Clean Notification Dispatcher */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-sm">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Notification Dispatcher
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Deliver real-time alerts to the selected client or broadcast globally.
                  </p>
                </div>

                <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-950">
                  <button
                    type="button"
                    onClick={() => setBroadcastMode(false)}
                    className={`py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      !broadcastMode
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    Selected Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastMode(true)}
                    className={`py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      broadcastMode
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    All Clients ({usersList.length})
                  </button>
                </div>

                <form onSubmit={handlePushNotification} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Alert Type
                    </label>
                    <select
                      value={notifType}
                      onChange={(e) => setNotifType(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="info">Information</option>
                      <option value="success">Confirmation / Cleared</option>
                      <option value="alert">Important Alert</option>
                      <option value="system">System Notice</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Notification Title
                    </label>
                    <input
                      type="text"
                      required
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="e.g., Wire Settlement Complete"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Message Body
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={notifMsg}
                      onChange={(e) => setNotifMsg(e.target.value)}
                      placeholder="Enter clear, concise details..."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-10 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Send size={13} />
                    <span>
                      {broadcastMode
                        ? 'Send Global Broadcast'
                        : `Send to ${activeTargetProfile.firstName}`}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: QUEUES & AUDIT LOGS */}
          {activeTab === 'queues' && (
            <div className="space-y-6">
              {/* LOANS & INVESTMENTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Landmark size={15} className="text-emerald-600" />
                    <span>Loan Applications ({adminLoans.length})</span>
                  </h4>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {adminLoans.length === 0 ? (
                      <p className="text-xs text-slate-500 py-8 text-center">No loan applications.</p>
                    ) : (
                      adminLoans.map((loan) => {
                        const owner = usersList.find((u) => u.uid === loan.userId);
                        return (
                          <div
                            key={loan.id}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white uppercase">
                                {loan.loanType} · ${loan.amount.toLocaleString()}
                              </span>
                              <span className="text-[11px] font-mono uppercase font-semibold text-slate-500">
                                {loan.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {owner?.email || loan.userId} · {loan.termMonths} mo @ {loan.apr}% APR
                            </p>
                            {loan.status === 'pending' && (
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => adminUpdateLoanStatus(loan.id, 'approved', true)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                                >
                                  Approve &amp; Disburse
                                </button>
                                <button
                                  type="button"
                                  onClick={() => adminUpdateLoanStatus(loan.id, 'declined', false)}
                                  className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 text-[11px] font-bold cursor-pointer"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp size={15} className="text-emerald-600" />
                    <span>Investment Redemptions ({adminInvestments.length})</span>
                  </h4>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {adminInvestments.length === 0 ? (
                      <p className="text-xs text-slate-500 py-8 text-center">No investment positions.</p>
                    ) : (
                      adminInvestments.map((pos) => {
                        const owner = usersList.find((u) => u.uid === pos.userId);
                        return (
                          <div
                            key={pos.id}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white">
                                <span className="font-mono text-emerald-700 dark:text-emerald-400 mr-1.5">
                                  {pos.symbol}
                                </span>
                                {pos.name}
                              </span>
                              <span className="font-mono font-bold tabular-nums">
                                ${pos.investedAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] text-slate-500">
                                {owner?.email || pos.userId} · {pos.status.replace('_', ' ')}
                              </span>
                              {pos.status === 'redemption_requested' && (
                                <button
                                  type="button"
                                  onClick={() => adminSettleRedemption(pos.id)}
                                  className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                                >
                                  Settle to Checking
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* SUPPORT & KYC TICKETS */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Support &amp; In-Site KYC Verification Queue ({adminTickets.length})
                </h4>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {adminTickets.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">Ticket queue is empty.</p>
                  ) : (
                    adminTickets.map((ticket) => {
                      const owner = usersList.find((u) => u.uid === ticket.userId);
                      const isKyc =
                        ticket.category.toLowerCase().includes('kyc') ||
                        ticket.subject.toLowerCase().includes('kyc');
                      return (
                        <div
                          key={ticket.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 flex flex-col md:flex-row justify-between gap-4 text-xs"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {ticket.subject}
                              </span>
                              <span className="text-[10px] font-mono uppercase font-semibold text-slate-500">
                                · {ticket.status.replace('_', ' ')} · {ticket.category}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                              {ticket.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              <span className="text-[11px] font-mono text-slate-500">
                                {owner?.email || ticket.userId} · {new Date(ticket.createdAt).toLocaleString()}
                              </span>
                              {ticket.documentBase64 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDocument({
                                      subject: ticket.subject,
                                      dataUri: ticket.documentBase64!,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                                >
                                  <FileText size={12} /> View Attached Document
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap md:flex-col gap-2 shrink-0 justify-center">
                            {isKyc && !owner?.isVerified && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await adminVerifyUser(ticket.userId, true);
                                  await adminUpdateTicketStatus(ticket.id, 'resolved');
                                  toast.success('KYC approved and ticket resolved.');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                              >
                                Approve KYC &amp; Resolve
                              </button>
                            )}
                            {ticket.status !== 'resolved' && (
                              <button
                                type="button"
                                onClick={() => adminUpdateTicketStatus(ticket.id, 'resolved')}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 text-[11px] font-bold cursor-pointer"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* AUDIT LOGS */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-3 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Administrative Audit Trail ({adminLogs.length})
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-60 overflow-y-auto pr-1 text-xs">
                  {adminLogs.length === 0 ? (
                    <p className="text-slate-500 py-6 text-center">No audit entries recorded yet.</p>
                  ) : (
                    adminLogs.slice(0, 30).map((log) => (
                      <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 mr-2">
                            {log.action}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">{log.details}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {previewDocument.subject}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewDocument(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 overflow-auto flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-950">
              {previewDocument.dataUri.startsWith('data:image') ? (
                <img
                  src={previewDocument.dataUri}
                  alt={previewDocument.subject}
                  className="max-w-full max-h-[65vh] rounded-xl object-contain"
                />
              ) : (
                <iframe
                  title={previewDocument.subject}
                  src={previewDocument.dataUri}
                  className="w-full h-[65vh] rounded-xl bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
