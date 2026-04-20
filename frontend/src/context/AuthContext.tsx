import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  user_id: string;
  parent_id?: string;
  parent_pin?: string;
  parent_whatsapp?: string;
  gender?: string | null;
  role?: 'student' | 'parent';
  selected_career?: string | null;
  simulation_state?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  selectedCareer: string | null;
  setSelectedCareer: (career: string | null) => void;
  mode: 'student' | 'parent' | null;
  setMode: (mode: 'student' | 'parent' | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || '';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [selectedCareer, setSelectedCareerState] = useState<string | null>(localStorage.getItem('selectedCareer'));
  const [mode, setModeState] = useState<'student' | 'parent' | null>(localStorage.getItem('userMode') as any);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
           const res = await axios.get(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data);
          // Sync persistent career from DB if it exists
          if (res.data.selected_career) {
            setSelectedCareerState(res.data.selected_career);
            localStorage.setItem('selectedCareer', res.data.selected_career);
          } else {
            // CRITICAL: Clear local cache for new users or those without a selection
            setSelectedCareerState(null);
            localStorage.removeItem('selectedCareer');
          }
        } catch (err) {
          console.error("Auth verification failed", err);
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    if (userData.selected_career) {
      setSelectedCareerState(userData.selected_career);
      localStorage.setItem('selectedCareer', userData.selected_career);
    } else {
      // CRITICAL: Clear local cache for new signups
      setSelectedCareerState(null);
      localStorage.removeItem('selectedCareer');
    }
    setMode(userData.role || 'student'); // Auto-set mode based on role
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedCareer');
    localStorage.removeItem('userMode');
    setToken(null);
    setUser(null);
    setSelectedCareerState(null);
    setModeState(null);
  };

  const setSelectedCareer = (career: string | null) => {
    if (career) {
      localStorage.setItem('selectedCareer', career);
    } else {
      localStorage.removeItem('selectedCareer');
    }
    setSelectedCareerState(career);
  };

  const setMode = (newMode: 'student' | 'parent' | null) => {
    if (newMode) {
      localStorage.setItem('userMode', newMode);
    } else {
      localStorage.removeItem('userMode');
    }
    setModeState(newMode);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
    selectedCareer,
    setSelectedCareer,
    mode,
    setMode
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
