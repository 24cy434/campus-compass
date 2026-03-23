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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('Profile fetch error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Profile fetch exception:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check initial session first
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (mounted) {
          setUser(profile);
          setLoading(false);
        }
      } else {
        if (mounted) setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        // Use setTimeout to avoid deadlock with Supabase auth callbacks
        setTimeout(async () => {
          if (!mounted) return;
          const profile = await fetchProfile(session.user.id);
          if (mounted) {
            setUser(profile);
            setLoading(false);
          }
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
    // Try sign in first
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // If invalid credentials, try to create the admin account
      if (error.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: 'Admin', role: 'admin' } },
        });
        if (signUpError) {
          // "User already registered" means password is wrong
          if (signUpError.message.includes('already registered')) {
            return { error: 'Invalid password for this admin account' };
          }
          return { error: signUpError.message };
        }
        // Ensure profile exists
        if (signUpData.user) {
          await supabase.from('profiles').upsert({
            id: signUpData.user.id,
            name: 'Admin',
            email: email.toLowerCase(),
            role: 'admin',
            approval_status: 'approved',
          });
        }
        // Login after signup
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) return { error: loginError.message };
      } else {
        return { error: error.message };
      }
    }
    return {};
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, adminLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
