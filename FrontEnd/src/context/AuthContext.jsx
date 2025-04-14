import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Try to get user profile data to validate token
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/auth/profile/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setUser(response.data);
      } catch (err) {
        console.error('Error validating token:', err);
        // Clear token if invalid
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      setError('');
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/login/`, {
        email,
        password,
      });

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Invalid credentials');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/register/`, userData);
      return response.data;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;