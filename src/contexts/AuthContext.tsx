import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/types';

const ADMIN_EMAILS = ['asharaj@mgits.ac.in', 'adhithyakrishna00001@gmail.com'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<User | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { name, role } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        email,
        role,
        approval_status: role === 'faculty' ? 'pending' : 'approved',
      });
    }
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const adminLogin = async (email: string, password: string) => {
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      return { error: 'This email is not authorized as admin' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Auto-register admin if first time
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: 'Admin', role: 'admin' } },
      });
      if (signUpError) return { error: signUpError.message };
      // Try login again after signup (auto-confirm is enabled)
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) return { error: loginError.message };
    }
    return {};
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, adminLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
