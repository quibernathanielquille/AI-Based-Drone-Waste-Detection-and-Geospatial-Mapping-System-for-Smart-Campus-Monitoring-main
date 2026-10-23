import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';
import { getToken, getUser, setToken, setUser, clearAuth } from '../utils/storage';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(getUser());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authService.me();
      if (res.data.success) {
        const userData = res.data.data.user;
        if (userData.role !== ROLES.ADMIN) {
          clearAuth();
          setUserState(null);
          return;
        }
        setUserState(userData);
        setUser(userData, localStorage.getItem('scw_admin_remember') === 'true');
      }
    } catch {
      clearAuth();
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password, remember = false) => {
    const res = await authService.login({ email, password, remember });
    if (res.data.success) {
      const { token, user: userData } = res.data.data;
      if (userData.role !== ROLES.ADMIN) {
        throw new Error('Administrator access only. Use the Campus Eye officer portal to sign in.');
      }
      setToken(token, remember);
      setUser(userData, remember);
      setUserState(userData);
      return userData;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    setUserState(null);
  };

  const isAdmin = () => user?.role === ROLES.ADMIN;
  const isAuthenticated = () => !!user && !!getToken();

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, refreshUser,
      isAdmin, isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
