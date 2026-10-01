import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on first mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Optionally verify token freshness against /api/auth/me
          try {
            const res = await api.get('/auth/me');
            if (res.data?.success && res.data?.data) {
              setUser(res.data.data);
              localStorage.setItem('user', JSON.stringify(res.data.data));
            }
          } catch (err) {
            console.warn('Silent session validation failed, token may be expired');
          }
        }
      } catch (err) {
        console.error('Error restoring session:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token: receivedToken, user: receivedUser } = response.data.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('token', receivedToken);
        localStorage.setItem('user', JSON.stringify(receivedUser));
        return { success: true, user: receivedUser };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.friendlyMessage || error.response?.data?.message || 'Login failed. Please check credentials.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Helper flags
  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isUser = user?.role === 'USER';
  const canManageCampaigns = isAdmin || isManager;
  const canAccessAuditLogs = isAdmin || isManager;
  const canManageUsers = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isManager,
        isUser,
        canManageCampaigns,
        canAccessAuditLogs,
        canManageUsers,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
