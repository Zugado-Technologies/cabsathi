'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError, api, tokenStore, type Me } from './api';

interface Session {
  ready: boolean;
  user: Me | null;
  signIn: (token: string, user: Me) => void;
  signOut: () => void;
  setUser: (user: Me) => void;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<Me | null>(null);

  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    api
      .me()
      .then(setUser)
      // Only a rejected token logs you out; a network blip keeps you signed in.
      .catch((e) => e instanceof ApiError && e.status === 401 && tokenStore.clear())
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback((token: string, u: Me) => {
    tokenStore.set(token);
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <SessionContext.Provider value={{ ready, user, signIn, signOut, setUser }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
