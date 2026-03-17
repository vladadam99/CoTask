import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const updateUser = async (data) => {
    const updated = await base44.auth.updateMe(data);
    setUser(prev => ({ ...prev, ...data }));
    return updated;
  };

  return { user, loading, updateUser };
}