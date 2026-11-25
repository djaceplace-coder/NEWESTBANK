/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';

const normalizePath = (raw: string): string => {
  if (!raw || raw === '/') return '/';
  const cleaned = raw.replace(/\/+$/, '');
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
};

export function useRouter() {
  const [path, setPath] = useState<string>(() =>
    typeof window !== 'undefined' ? normalizePath(window.location.pathname) : '/',
  );

  useEffect(() => {
    const onPopState = () => {
      setPath(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string, replace = false) => {
    const normalized = normalizePath(to);
    if (typeof window !== 'undefined') {
      if (replace) {
        window.history.replaceState({}, '', normalized);
      } else if (window.location.pathname !== normalized) {
        window.history.pushState({}, '', normalized);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setPath(normalized);
  }, []);

  const isAdminRoute = path === '/admin' || path.startsWith('/admin/');

  return { path, navigate, isAdminRoute };
}
