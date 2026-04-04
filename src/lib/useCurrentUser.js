import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Shared state so all components using useCurrentUser stay in sync
let _user = null;
let _listeners = [];

// Refresh user from server and update all listeners
export async function refreshUser() {
  try {
    const fresh = await base44.auth.me();
    notify(fresh);
    return fresh;
  } catch (err) {
    notify(null);
    throw err;
  }
}

function notify(newUser) {
  _user = newUser;
  _listeners.forEach(fn => fn(newUser));
}

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const listener = (u) => setUser(u);
    _listeners.push(listener);

    // Always fetch fresh to avoid stale cached role from previous session
    base44.auth.me()
      .then(u => { notify(u); setLoading(false); })
      .catch(() => { notify(null); setLoading(false); });

    return () => { _listeners = _listeners.filter(fn => fn !== listener); };
  }, []);

  const updateUser = useCallback(async (data) => {
    const updated = await base44.auth.updateMe(data);
    // Re-fetch fresh user data to ensure all fields are current
    const fresh = await base44.auth.me();
    notify(fresh);
    return updated;
  }, []);

  return { user, loading, updateUser };
}