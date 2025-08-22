import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { LoginRequest, LoginResponse, User, UserRole } from '@crm/shared';

interface AuthUser extends Omit<User, 'password'> {
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isLoading: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isStaff: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (accessToken && refreshToken) {
        try {
          const response = await apiClient.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.data);
          } else {
            clearTokens();
          }
        } catch (error) {
          // Try to refresh token if access token is expired
          try {
            await refresh();
          } catch (refreshError) {
            clearTokens();
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    try {
      const loginData: LoginRequest = { email, password };
      const response = await apiClient.post<{ success: boolean; data: LoginResponse }>('/auth/login', loginData);
      
      if (response.data.success) {
        const { accessToken, refreshToken, user: userData } = response.data.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(userData as AuthUser);
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      // Ignore logout API errors, we'll clear tokens anyway
      console.warn('Logout API call failed:', error);
    } finally {
      clearTokens();
    }
  };

  const refresh = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.post<{ success: boolean; data: { accessToken: string } }>('/auth/refresh', {
        refreshToken,
      });

      if (response.data.success) {
        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        
        // Get updated user info
        const userResponse = await apiClient.get('/auth/me');
        if (userResponse.data.success) {
          setUser(userResponse.data.data);
        }
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      clearTokens();
      throw error;
    }
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    return user ? allowedRoles.includes(user.role) : false;
  };

  const isAdmin = (): boolean => {
    return user?.role === 'ADMIN';
  };

  const isManager = (): boolean => {
    return user?.role === 'MANAGER';
  };

  const isStaff = (): boolean => {
    return user?.role === 'STAFF';
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        refresh,
        isLoading, 
        hasRole, 
        isAdmin, 
        isManager, 
        isStaff 
      }}
    >
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