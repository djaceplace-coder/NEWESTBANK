/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed top-0 left-0 right-0 z-[120] bg-amber-600 text-white text-xs font-medium py-2 px-4 flex items-center justify-center gap-2 shadow-md"
    >
      <WifiOff size={14} />
      <span>You are offline. Viewing cached account data — transactions will resume once connected.</span>
    </div>
  );
};
