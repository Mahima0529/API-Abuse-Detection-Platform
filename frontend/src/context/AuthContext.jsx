import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/users/me');
        setUser(response.data.data.user);
      } catch (err) {
        console.error('Failed to fetch current user profile:', err);
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const loginUser = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: authToken, data } = response.data;
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(data.user);
    return data.user;
  };

  const registerUser = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { token: authToken, data } = response.data;
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(data.user);
    return data.user;
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginUser,
        registerUser,
        logoutUser,
        isAuthenticated: !!token && !!user,
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
