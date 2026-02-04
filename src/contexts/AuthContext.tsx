// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  organization_id: string;
  email: string;
  name: string | null;
  role: 'owner' | 'team_leader' | 'agent';
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  settings: any;
  preferences: any;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'professional' | 'enterprise' | 'custom';
  seats_total: number;
  seats_used: number;
  settings: any;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  organization: Organization | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setProfile(null);
        setOrganization(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData(userId: string) {
    if (!supabase) return;

    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile error:', profileError);
        return;
      }

      if (profileData) {
        setProfile(profileData);

        // Load organization
        if (profileData?.organization_id) {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profileData.organization_id)
            .single();

          if (orgError && orgError.code !== 'PGRST116') {
            console.error('Organization error:', orgError);
          } else if (orgData) {
            setOrganization(orgData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile() {
    if (user) {
      await loadUserData(user.id);
    }
  }

  async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const errorMessage = getAuthErrorMessage(error.code || error.message);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Errore durante il login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async function signUp(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    setError(null);

    try {
      const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (signUpError) {
        const errorMessage = getAuthErrorMessage(signUpError.code || signUpError.message);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (authUser) {
        // Create user profile
        const { error: profileError } = await supabase.from('users').insert({
          id: authUser.id,
          email,
          name,
          role: 'agent',
          is_active: true,
        });

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile creation error:', profileError);
        }
      }

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Errore durante la registrazione';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async function signOut() {
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      setOrganization(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  function clearError() {
    setError(null);
  }

  function getAuthErrorMessage(code: string): string {
    const errorMessages: Record<string, string> = {
      'invalid_credentials': 'Email o password non valida',
      'user_already_exists': 'Questo account esiste già',
      'weak_password': 'La password deve avere almeno 6 caratteri',
      'email_not_confirmed': 'Conferma il tuo email prima di accedere',
      'over_email_send_rate_limit': 'Troppi tentativi, riprova più tardi',
      'user_banned': 'Questo account è stato disabilitato',
    };
    
    return errorMessages[code] || 'Errore di autenticazione. Riprova più tardi.';
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        organization,
        session,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
