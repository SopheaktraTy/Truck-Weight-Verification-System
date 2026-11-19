import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isOperator: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signInWithDemoAdmin: () => void;
  signInWithDemoOperator: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Predefined admin emails for fallback/offline checks
const KNOWN_ADMIN_EMAILS = ['pheaktra.st67@gmail.com', 'lynasem99@gmail.com'];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or construct profile from public.profiles
  const fetchProfile = async (currentUser: User) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching user profile:', error.message);
      }

      const email = currentUser.email || '';
      const isKnownAdmin = KNOWN_ADMIN_EMAILS.includes(email.toLowerCase());

      if (data) {
        // If it's a known admin email but DB hasn't updated yet, enforce admin
        const finalRole: UserRole = isKnownAdmin ? 'admin' : (data.role as UserRole) || 'operator';
        setProfile({
          id: data.id,
          email: data.email || email,
          full_name: data.full_name || currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || email.split('@')[0],
          avatar_url: data.avatar_url || currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture,
          role: finalRole,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      } else {
        // Fallback: build profile from auth user metadata
        const fallbackRole: UserRole = isKnownAdmin ? 'admin' : 'operator';
        setProfile({
          id: currentUser.id,
          email,
          full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || email.split('@')[0],
          avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture,
          role: fallbackRole,
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign In with Google OAuth
  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Sign In with Email & Password
  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase is not configured') };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      if (data.user) {
        setUser(data.user);
        await fetchProfile(data.user);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Sign Up with Email & Password
  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    if (!supabase) return { error: new Error('Supabase is not configured') };
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) return { error };
      if (data.user) {
        setUser(data.user);
        await fetchProfile(data.user);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Demo Sign-In modes (for local development or offline testing)
  const signInWithDemoAdmin = () => {
    const demoAdminUser = {
      id: 'demo-admin-id',
      email: 'pheaktra.st67@gmail.com',
      user_metadata: {
        full_name: 'Sopheaktra',
        avatar_url: '',
      },
    } as unknown as User;

    setUser(demoAdminUser);
    setProfile({
      id: 'demo-admin-id',
      email: 'pheaktra.st67@gmail.com',
      full_name: 'Sopheaktra',
      role: 'admin',
    });
  };

  const signInWithDemoOperator = () => {
    const demoOpUser = {
      id: 'demo-op-id',
      email: 'operator@weighbridge.com',
      user_metadata: {
        full_name: 'Weighbridge Operator',
        avatar_url: '',
      },
    } as unknown as User;

    setUser(demoOpUser);
    setProfile({
      id: 'demo-op-id',
      email: 'operator@weighbridge.com',
      full_name: 'Weighbridge Operator',
      role: 'operator',
    });
  };

  // Sign out
  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const role = profile?.role || null;
  const isAdmin = role === 'admin';
  const isOperator = role === 'admin' || role === 'operator';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        isOperator,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInWithDemoAdmin,
        signInWithDemoOperator,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
