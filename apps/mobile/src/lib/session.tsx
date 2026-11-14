import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setAuthToken, type Me } from './api';
import { storage } from './storage';

const TOKEN_KEY = 'cabsathi.token';

interface Session {
  ready: boolean;
  user: Me | null;
  signIn: (token: string, user: Me) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: Me) => void;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<Me | null>(null);

  useEffect(() => {
    (async () => {
      const token = await storage.get(TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        try {
          setUser(await api.me());
        } catch {
          setAuthToken(null);
          await storage.remove(TOKEN_KEY);
        }
      }
      setReady(true);
    })();
  }, []);

  const signIn = useCallback(async (token: string, u: Me) => {
    setAuthToken(token);
    await storage.set(TOKEN_KEY, token);
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    await storage.remove(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <SessionContext.Provider value={{ ready, user, signIn, signOut, setUser }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
