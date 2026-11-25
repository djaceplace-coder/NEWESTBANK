/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, ArrowLeftRight, CreditCard, Target, Landmark, TrendingUp, Settings, ShieldAlert } from 'lucide-react';
import { useStore } from '../store';

interface MobileNavProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
}

export function MobileNav({ currentTab, onChangeTab }: MobileNavProps) {
  const { user } = useStore();
  const [isPWA, setIsPWA] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    setIsPWA(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsPWA(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const menuItems = [
    { id: 'home', label: 'Home', icon: <Home size={18} /> },
    { id: 'transfers', label: 'Transfers', icon: <ArrowLeftRight size={18} /> },
    { id: 'cards', label: 'Cards', icon: <CreditCard size={18} /> },
    { id: 'savings', label: 'Savings', icon: <Target size={18} /> },
    { id: 'loans', label: 'Loans', icon: <Landmark size={18} /> },
    { id: 'investing', label: 'Invest', icon: <TrendingUp size={18} /> },
    { id: 'settings', label: 'Profile', icon: <Settings size={18} /> },
  ];

  return (
    <nav className={`${isPWA ? 'flex' : 'md:hidden flex'} fixed bottom-0 left-0 right-0 h-16 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-md border-t border-slate-200 dark:border-white/5 justify-start sm:justify-around items-center px-2 gap-1 overflow-x-auto scrollbar-hide z-40 select-none pb-[env(safe-area-inset-bottom)] transition-colors ${isPWA ? 'max-w-[480px] mx-auto absolute' : ''}`}>
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onChangeTab(item.id)}
          className={`shrink-0 flex flex-col items-center justify-center space-y-1 min-w-[52px] h-12 rounded-xl transition-all cursor-pointer ${
            currentTab === item.id ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500'
          }`}
        >
          {item.icon}
          <span className="text-[9px] font-medium tracking-tight font-sans">
            {item.label}
          </span>
        </button>
      ))}

      {/* Admin shortcut on Mobile if user is Admin */}
      {user?.isAdmin && (
        <button
          onClick={() => onChangeTab('admin')}
          className={`flex flex-col items-center justify-center space-y-1 w-12 h-12 rounded-xl transition-all cursor-pointer ${
            currentTab === 'admin' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500'
          }`}
        >
          <ShieldAlert size={20} />
          <span className="text-[9px] font-medium tracking-tight font-sans">
            Admin
          </span>
        </button>
      )}
    </nav>
  );
}
