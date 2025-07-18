import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'site_owner' | 'bot_developer';
}

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  role: 'site_owner' | 'bot_developer';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'site_owner' | 'bot_developer') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use VITE_BACKEND_URL from environment, fallback to '/api' for relative proxy in dev
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '/api';
// To set: add VITE_BACKEND_URL=http://localhost:3001/api (or your prod URL) to your .env file

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Check for existing token and validate it
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile('current')
        .then((profileData) => {
          if (profileData) {
            setUser({
              id: profileData.user_id,
              email: profileData.email,
              full_name: profileData.full_name,
              role: profileData.role
            });
            setProfile(profileData);
          }
        })
        .catch((error) => {
          console.error('Error fetching profile:', error);
          // Clear invalid token
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: 'site_owner' | 'bot_developer') => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        email,
        password,
            full_name: fullName,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Sign up failed",
          description: data.message || 'An error occurred during sign up',
          variant: "destructive",
        });
        return { error: data };
      }

        toast({
          title: "Success!",
        description: "Account created successfully. Please sign in.",
        });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Sign in failed",
        description: data.message || 'Invalid credentials',
        variant: "destructive",
      });
      return { error: data };
    }

    // Store token
    localStorage.setItem('token', data.token);

    // Always fetch the latest profile after sign in
    const profileData = await fetchProfile('current');
    if (profileData) {
      setUser({
        id: profileData.user_id,
        email: profileData.email,
        full_name: profileData.full_name,
        role: profileData.role
      });
      setProfile(profileData);
    } else {
      // fallback to response data if profile fetch fails
      setUser({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        role: data.user.role
      });
      setProfile(data.profile);
    }

    toast({
      title: "Welcome back!",
      description: "You have successfully signed in.",
    });

    return { error: null };
  } catch (error: any) {
    toast({
      title: "Sign in failed",
      description: error.message,
      variant: "destructive",
    });
    return { error };
  }
};

  const signOut = async () => {
    try {
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}