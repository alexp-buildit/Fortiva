import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, type Database } from '@/lib/supabase';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'admin' | 'sender' | 'receiver';
    username: string;
  }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set a maximum loading time
    const loadingTimeout = setTimeout(() => {
      console.warn('Auth loading timed out, setting loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadUserProfile(session.user.id).finally(() => {
          setLoading(false);
          clearTimeout(loadingTimeout);
        });
      } else {
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
      clearTimeout(loadingTimeout);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading user profile for:', userId);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        // Set loading to false even if profile fails to load
        setLoading(false);
        return;
      }

      if (data) {
        console.log('User profile loaded:', data);
        setProfile(data);
      } else {
        console.warn('No profile data found for user:', userId);
      }
    } catch (err: any) {
      console.error('Profile loading error:', err);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'admin' | 'sender' | 'receiver';
    username: string;
  }) => {
    console.log('🔄 Attempting signup with:', { email, userData });

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          role: userData.role,
          username: userData.username,
        },
      },
    });

    if (error) {
      console.error('❌ Signup error:', error);
    } else {
      console.log('✅ Signup successful:', data);
    }

    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (!error) {
        // Clear local state immediately
        setUser(null);
        setProfile(null);
        setSession(null);

        // Navigate to login page
        window.location.href = '/login';
      }

      return { error };
    } catch (err: any) {
      console.error('Sign out error:', err);
      return { error: err };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}