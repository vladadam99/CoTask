import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Shared state so all components using useCurrentUser stay in sync
let _user = null;
let _listeners = [];
let _lastNotifiedAt = 0; // timestamp of last notify() call

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
  _lastNotifiedAt = Date.now();
  _listeners.forEach(fn => fn(newUser));
}

export function useCurrentUser() {
  const [user, setUser] = useState(_user); // init with cached user if available (SPA navigation)
  const [loading, setLoading] = useState(!_user); // if we already have user, not loading

  useEffect(() => {
    const listener = (u) => setUser(u);
    _listeners.push(listener);

    // Fetch fresh, but skip if user was just updated (< 5s ago) to avoid overwriting with stale JWT
    const timeSinceLastNotify = Date.now() - _lastNotifiedAt;
    if (_user && timeSinceLastNotify < 5000) {
      setLoading(false);
    } else {
      base44.auth.me()
        .then(u => { notify(u); setLoading(false); })
        .catch(() => { notify(null); setLoading(false); });
    }

    return () => { _listeners = _listeners.filter(fn => fn !== listener); };
  }, []);

  const updateUser = useCallback(async (data) => {
    const updated = await base44.auth.updateMe(data);
    // Immediately notify with merged result so all listeners get the new role right away
    // This avoids relying on base44.auth.me() which may return stale JWT data
    notify({ ..._user, ...data, ...updated });
    return updated;
  }, []);

  return { user, loading, updateUser };
}