"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { trpc } from "./trpc/client";

interface Session {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  setSession: (session: Session, sessionToken: string) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionTokenState] = useState<string | null>(null);

  const { data: me } = trpc.auth.me.useQuery(undefined, {
    enabled: !!sessionToken,
    retry: false,
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("sessionToken");
    if (storedToken) {
      setSessionTokenState(storedToken);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (me) {
      setSessionState({
        user: {
          id: me.id,
          email: me.email,
          name: me.name,
          image: me.image,
        },
      });
    } else if (sessionToken) {
      setSessionState(null);
    }
  }, [me, sessionToken]);

  const setSession = (newSession: Session, token: string) => {
    setSessionState(newSession);
    setSessionTokenState(token);
    localStorage.setItem("sessionToken", token);
  };

  const clearSession = () => {
    setSessionState(null);
    setSessionTokenState(null);
    localStorage.removeItem("sessionToken");
  };

  return (
    <AuthContext.Provider value={{ session, loading, setSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
