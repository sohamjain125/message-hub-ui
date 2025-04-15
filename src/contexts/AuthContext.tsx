import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthState, User, LoginRequest } from '@/lib/types';
import { authService } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('access-token');
    const user = authService.getCurrentUser();
    
    console.log('AuthProvider: Initial auth check', { token, user });
    
    if (token && user) {
      setAuthState({
        user,
        token,
        isAuthenticated: true,
      });
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      const data = await authService.login(credentials);
      
      // Map the response data to our User type
      const userData = {
        id: data.data.userId,
        username: data.data.userName,
        phoneNumber: data.data.phoneNumber,
        countryCode: data.data.countryCode
      };
      
      console.log('AuthProvider: Login successful', { user: userData, token: data.accessToken });
      
      setAuthState({
        user: userData,
        token: data.accessToken,
        isAuthenticated: true,
      });
      
      navigate('/chats');
    } catch (error) {
      console.error('AuthProvider: Login failed', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An error occurred during login",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('AuthProvider: Logging out');
    authService.logout();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    navigate('/login');
  };

  // Don't render children until auth is ready
  if (loading) {
    return null;
  }

  const value = {
    ...authState,
    login,
    logout,
    loading,
    token: authState.token
  };

  console.log('AuthProvider: Current auth state', value);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
