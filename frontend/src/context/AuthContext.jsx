import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { getAuthToken, setAuthToken, clearAuthToken, formatApiError } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);

  // Initialize auth state by verifying existing token against backend
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = getAuthToken();
      if (!savedToken) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch (err) {
        console.warn('Session expired or invalid token:', err?.message);
        clearAuthToken();
        setUser(null);
        setTokenState(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const resp = await api.login(email, password);
      setAuthToken(resp.access_token);
      setTokenState(resp.access_token);
      setUser(resp.user);
      return { success: true, user: resp.user };
    } catch (err) {
      const message = formatApiError(err);
      return { success: false, error: message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const resp = await api.register(name, email, password);
      setAuthToken(resp.access_token);
      setTokenState(resp.access_token);
      setUser(resp.user);
      return { success: true, user: resp.user };
    } catch (err) {
      const message = formatApiError(err);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    clearAuthToken();
    setTokenState(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await api.getMe();
      setUser(userData);
      return userData;
    } catch (err) {
      console.warn('Failed to refresh user:', err);
      return null;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
