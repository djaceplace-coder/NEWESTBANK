/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { canNativeInstall, isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'full') {
      return (
        <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 size={15} />
          <span>Installed as App</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (canNativeInstall) {
      const outcome = await triggerInstall();
      if (outcome === 'manual') {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          className ||
          (variant === 'full'
            ? 'inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0'
            : 'inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors whitespace-nowrap shrink-0')
        }
      >
        <Download size={14} />
        <span>Install App</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Smartphone size={22} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Install MorningBank App
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Full-screen mobile banking with biometrics & push alerts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="min-w-[44px] min-h-[44px] -mr-2 -mt-2 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> icon{' '}
                    <Share size={14} className="inline mx-0.5 text-emerald-600" /> in Safari&apos;s
                    bottom toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>{' '}
                    <PlusSquare size={14} className="inline mx-0.5 text-emerald-600" />.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Open <strong>MorningBank</strong> from your home screen to enable Face ID and
                    instant device notifications.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Open your browser menu (three dots in Chrome, Edge, or Brave) or look for the{' '}
                    <strong>Install</strong> icon in the address bar.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Select <strong>Install App</strong> or <strong>Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Launch MorningBank as a standalone app for biometric passkey unlock and real-time
                    mobile notifications.
                  </span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[46px] rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-sm font-medium hover:opacity-95 transition-opacity"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
