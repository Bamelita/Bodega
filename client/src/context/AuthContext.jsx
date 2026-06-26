import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import api from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const isNetlify = typeof window !== 'undefined' && /netlify\.app$/.test(window.location.hostname);
  const ALLOW_DEMO = (import.meta.env?.VITE_DEMO_LOGIN === 'true') || isNetlify;
  const DEMO_USER = import.meta.env?.VITE_DEMO_USER || 'admin';
  const DEMO_PASS = import.meta.env?.VITE_DEMO_PASS || 'admin123';

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutTimer = useRef(null);
  const warnTimer = useRef(null);
  const countdownRef = useRef(null);
  const [warningActive, setWarningActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Inactivity timeout duration: 5 minutes
  const INACTIVITY_LIMIT = 300000;
  const WARNING_BEFORE_MS = 30000;

  const resetInactivityTimer = () => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
    }
    if (warnTimer.current) {
      clearTimeout(warnTimer.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setWarningActive(false);
    setSecondsLeft(0);
    if (user) {
      logoutTimer.current = setTimeout(() => {
        logout();
      }, INACTIVITY_LIMIT);
      warnTimer.current = setTimeout(() => {
        setWarningActive(true);
        setSecondsLeft(Math.floor(WARNING_BEFORE_MS / 1000));
        countdownRef.current = setInterval(() => {
          setSecondsLeft(prev => {
            const next = prev - 1;
            if (next <= 0) {
              clearInterval(countdownRef.current);
            }
            return next;
          });
        }, 1000);
      }, INACTIVITY_LIMIT - WARNING_BEFORE_MS);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      // Set initial timer
      resetInactivityTimer();

      // Events to track activity
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

      const handleActivity = () => {
        resetInactivityTimer();
      };

      events.forEach(event => {
        window.addEventListener(event, handleActivity);
      });

      return () => {
        if (logoutTimer.current) clearTimeout(logoutTimer.current);
        events.forEach(event => {
          window.removeEventListener(event, handleActivity);
        });
      };
    }
  }, [user]);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      const userData = { ...res.data.user, access_token: res.data.access_token };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      if (ALLOW_DEMO) {
        const role = (username || '').toLowerCase() === 'admin' ? 'admin' : 'user';
        const demoUser = { id: 1, username: username || DEMO_USER, role, access_token: 'demo_token' };
        setUser(demoUser);
        localStorage.setItem('user', JSON.stringify(demoUser));
        return { success: true };
      }
      return { success: false, message: error.response?.data?.message || 'Error al iniciar sesión' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setWarningActive(false);
    setSecondsLeft(0);
  };
  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading, warningActive, secondsLeft }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
