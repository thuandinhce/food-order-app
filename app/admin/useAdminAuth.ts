'use client';

import { useEffect, useState } from 'react';

const ADMIN_PASSWORD = '090819';
const ADMIN_AUTH_KEY = 'tintune-admin-authorized';

export function useAdminAuth() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true') {
      const timer = window.setTimeout(() => setAuthorized(true), 0);
      return () => window.clearTimeout(timer);
    }

    const password = window.prompt('Nhập mật khẩu admin');

    if (password === ADMIN_PASSWORD) {
      window.sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      const timer = window.setTimeout(() => setAuthorized(true), 0);
      return () => window.clearTimeout(timer);
    } else {
      alert('Sai mật khẩu');
      window.location.href = '/';
    }
  }, []);

  return authorized;
}
