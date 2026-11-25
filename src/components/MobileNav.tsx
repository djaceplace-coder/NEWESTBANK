/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Home,
  ArrowLeftRight,
  CreditCard,
  Target,
  Landmark,
  TrendingUp,
  MessageSquare,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { useStore } from '../store';

interface MobileNavProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
}

export function MobileNav({ currentTab, onChangeTab }: MobileNavProps) {
  const { user, chatMessages, adminChatMessages } = useStore();
  const [isPWA, setIsPWA] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    setIsPWA(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsPWA(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const clientUnreadChatCount = chatMessages.filter(
    (m) => m.senderRole === 'admin' && !m.isReadByClient,
  ).length;

  const adminUnreadChatCount = user?.isAdmin
    ? adminChatMessages.filter((m) => m.senderRole === 'client' && !m.isReadByAdmin).length
    : 0;

  const menuItems = [
    { id: 'home', label: 'Home', icon: <Home size={18} />, badge: 0 },
    { id: 'transfers', label: 'Transfers', icon: <ArrowLeftRight size={18} />, badge: 0 },
    { id: 'cards', label: 'Cards', icon: <CreditCard size={18} />, badge: 0 },
    { id: 'savings', label: 'Savings', icon: <Target size={18} />, badge: 0 },
    { id: 'loans', label: 'Loans', icon: <Landmark size={18} />, badge: 0 },
    { id: 'investing', label: 'Invest', icon: <TrendingUp size={18} />, badge: 0 },
    { id: 'support', label: 'Support', icon: <MessageSquare size={18} />, badge: clientUnreadChatCount },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} />, badge: 0 },
  ];

  return (
    <nav
      className={`${
        isPWA ? 'flex' : 'md:hidden flex'
      } fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 justify-start sm:justify-around items-center px-2 gap-1 overflow-x-auto scrollbar-hide z-40 select-none pb-[env(safe-area-inset-bottom)] transition-colors ${
        isPWA ? 'max-w-[480px] mx-auto absolute' : ''
      }`}
    >
      {menuItems.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChangeTab(item.id)}
          className={`relative shrink-0 flex flex-col items-center justify-center space-y-1 min-w-[54px] h-12 rounded-xl transition-all cursor-pointer ${
            currentTab === item.id
              ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {item.icon}
          <span className="text-[10px] font-medium tracking-tight font-sans leading-none">
            {item.label}
          </span>
          {item.badge > 0 && (
            <span className="absolute top-1 right-1.5 min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
              {item.badge}
            </span>
          )}
        </button>
      ))}

      {user?.isAdmin && (
        <button
          type="button"
          onClick={() => onChangeTab('admin')}
          className={`relative shrink-0 flex flex-col items-center justify-center space-y-1 min-w-[54px] h-12 rounded-xl transition-all cursor-pointer ${
            currentTab === 'admin'
              ? 'text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ShieldAlert size={18} />
          <span className="text-[10px] font-medium tracking-tight font-sans leading-none">
            Admin
          </span>
          {adminUnreadChatCount > 0 && (
            <span className="absolute top-1 right-1.5 min-w-4 h-4 px-1 rounded-full bg-amber-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
              {adminUnreadChatCount}
            </span>
          )}
        </button>
      )}
    </nav>
  );
}
