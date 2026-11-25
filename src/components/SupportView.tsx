/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useStore } from '../store';
import { formatCurrency } from '../utils';
import {
  ShieldAlert,
  HelpCircle,
  Activity,
  Send,
  Upload,
  Copy,
  Check,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

const CopyableText = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
      <div className="flex flex-col min-w-0 pr-3">
        <span className="text-[10px] font-mono uppercase text-slate-500 mb-0.5">{label}</span>
        <span className="text-xs font-mono text-slate-900 dark:text-slate-200 font-bold break-all">{text}</span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="p-2 bg-white dark:bg-white/10 rounded-md hover:bg-slate-100 dark:hover:bg-white/20 transition-colors shrink-0 cursor-pointer"
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-500" />}
      </button>
    </div>
  );
};

export const SupportView = () => {
  const {
    user,
    tickets,
    chatMessages,
    loadTickets,
    createTicket,
    sendChatMessage,
    markClientChatRead,
  } = useStore();
  const currency = user?.currency || 'USD';

  // Direct Management Chat state
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Support ticket state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [fileBase64, setFileBase64] = useState<string | null>(null);

  // Activation state
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'giftcard'>('crypto');
  const [cryptoAsset, setCryptoAsset] = useState<'usdt_erc20' | 'usdt_trc20' | 'btc' | ''>('');
  const [activationFileBase64, setActivationFileBase64] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    markClientChatRead();
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length, markClientChatRead]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || sendingChat) return;
    setSendingChat(true);
    try {
      const ok = await sendChatMessage(text);
      if (ok) setChatInput('');
    } finally {
      setSendingChat(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 650 * 1024) {
        toast.error('Attachment must be smaller than 650 KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleActivationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 650 * 1024) {
        toast.error('Receipt file must be smaller than 650 KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setActivationFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleActivationSubmit = async () => {
    if (!activationFileBase64) return;
    await createTicket(
      'Account Activation Payment Receipt',
      `User submitted a payment receipt for account activation. Method selected: ${paymentMethod}`,
      'verification',
      activationFileBase64,
    );
    setActivationFileBase64(null);
    toast.success('Receipt submitted for administrator review.');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    await createTicket(subject, description, category, fileBase64 || undefined);
    setSubject('');
    setDescription('');
    setFileBase64(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-950 pb-24 md:pb-8">
      <div className="border-b border-slate-200 dark:border-white/5 pb-4">
        <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-semibold">
          Client Relations &amp; Operations
        </span>
        <h1 className="text-2xl font-bold font-sans text-slate-900 dark:text-white mt-1">
          Management Chat &amp; Support Desk
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Message account management directly in real time, submit formal requests, or upload verification documents.
        </p>
      </div>

      {/* DIRECT MANAGEMENT CHAT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Direct Management Chat
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time encrypted channel with Morning Bright administrators
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>End-to-End Logged</span>
          </div>
        </div>

        <div className="h-80 overflow-y-auto p-5 space-y-3.5 bg-slate-50/40 dark:bg-slate-950/40">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Start a conversation with your account manager
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ask about wire clearing, balance adjustments, KYC status, cards, or loan underwriting. Replies appear here instantly.
              </p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isClient = msg.senderRole === 'client';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isClient ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {isClient ? 'You' : msg.senderName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div
                    className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isClient
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
          onSubmit={handleSendChat}
          className="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex items-center gap-3"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Write a message to Morning Bright Management..."
            maxLength={2000}
            className="flex-1 h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600"
          />
          <button
            type="submit"
            disabled={sendingChat || !chatInput.trim()}
            className="h-11 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingChat ? 'Sending' : 'Send'}</span>
          </button>
        </form>
      </div>

      {/* SUPPORT TICKETS + RECENT TICKETS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm">
          <h2 className="text-sm font-semibold mb-6 flex items-center space-x-2 text-slate-800 dark:text-slate-100">
            <HelpCircle size={16} className="text-emerald-600" />
            <span>Open Formal Support Request</span>
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Query Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-600 transition-colors"
              >
                <option value="general">General Support</option>
                <option value="verification">Verification &amp; Documents</option>
                <option value="account_manager">Request Account Manager</option>
                <option value="dispute">Transaction Dispute</option>
                <option value="loans">Loans &amp; Applications</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief title of your request"
                className="w-full h-11 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-600 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details for our team..."
                className="w-full py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-600 transition-colors resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Upload Attachments (Optional, max 650 KB)
              </label>
              <label className="w-full h-11 flex items-center justify-center space-x-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 border-dashed rounded-xl px-4 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <Upload size={14} />
                <span>{fileBase64 ? 'Document Attached' : 'Select Document'}</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold transition-colors hover:bg-slate-800 dark:hover:bg-slate-200 flex items-center justify-center space-x-2 mt-4 cursor-pointer"
            >
              <Send size={14} />
              <span>Submit Ticket</span>
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm">
          <h2 className="text-sm font-semibold mb-6 flex items-center space-x-2 text-slate-800 dark:text-slate-100">
            <Activity size={16} className="text-emerald-500" />
            <span>Your Submitted Tickets ({tickets.length})</span>
          </h2>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {tickets.length === 0 ? (
              <div className="p-6 rounded-xl text-xs text-slate-500 italic text-center border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50">
                No support tickets submitted yet.
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/30 flex justify-between items-start gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {t.subject}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase ${
                          t.status === 'open'
                            ? 'text-amber-700 dark:text-amber-400'
                            : t.status === 'in_progress'
                              ? 'text-blue-700 dark:text-blue-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        · {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 whitespace-pre-line">
                      {t.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-2 text-[11px] text-slate-400">
                      <span className="capitalize">{t.category.replace('_', ' ')}</span>
                      <span>·</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ACCOUNT ACTIVATION / CLEARING PANEL */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-white/10 shadow-sm">
        <h2 className="text-lg font-bold font-sans text-slate-900 dark:text-white flex items-center space-x-2">
          <ShieldAlert size={18} className="text-emerald-600" />
          <span>Account Activation &amp; Clearing Receipts</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
          Upload proof of clearing to unlock extended withdrawals, direct deposits, and physical card dispatch.{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
            Activation clearing threshold: {formatCurrency(750, currency)}.
          </span>
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
              01. Select Clearing Channel
            </h3>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('crypto')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  paymentMethod === 'crypto'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                }`}
              >
                Digital Asset Rail
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('giftcard')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  paymentMethod === 'giftcard'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                }`}
              >
                Prepaid Vouchers
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50">
              {paymentMethod === 'crypto' ? (
                <div className="space-y-3">
                  <select
                    value={cryptoAsset}
                    onChange={(e) => setCryptoAsset(e.target.value as any)}
                    className="w-full h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-600"
                  >
                    <option value="" disabled>
                      Select Asset Network
                    </option>
                    <option value="usdt_erc20">USDT (ERC20 - Ethereum Network)</option>
                    <option value="usdt_trc20">USDT (TRC20 - Tron Network)</option>
                    <option value="btc">BITCOIN (BTC Network)</option>
                  </select>

                  {cryptoAsset === 'usdt_erc20' && (
                    <CopyableText
                      label="USDT (ERC20) Wallet Address"
                      text="0x6420440fe3052422134229ff5ac904ec1aadf882"
                    />
                  )}
                  {cryptoAsset === 'usdt_trc20' && (
                    <CopyableText
                      label="USDT (TRC20) Wallet Address"
                      text="TY1rjXKoLM4MKUmUMAJNaqngxdXAUQDrUG"
                    />
                  )}
                  {cryptoAsset === 'btc' && (
                    <CopyableText
                      label="BITCOIN Wallet Address"
                      text="1M4CxHqAhCeWQnoF3HgmzhS4sxKgDWwF1g"
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <p>
                    Upload clear images of valid, unregistered prepaid cards (front and back). Minimum value{' '}
                    <span className="font-semibold tabular-nums">{formatCurrency(750, currency)}</span>.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Supported brands: Apple Store, Amazon, Steam, Google Play, Target, Walmart.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
              02. Upload Clearing Receipt
            </h3>

            <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-950/50">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-3">
                <Upload size={18} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                Attach transfer confirmation screenshot, transaction hash, or receipt image.
              </p>

              <label className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer">
                {activationFileBase64 ? 'Receipt Selected — Replace' : 'Select Receipt File'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleActivationUpload}
                />
              </label>

              {activationFileBase64 && (
                <button
                  type="button"
                  onClick={handleActivationSubmit}
                  className="mt-3 px-5 py-2 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-xs font-bold transition-colors cursor-pointer"
                >
                  Submit Receipt for Review
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
