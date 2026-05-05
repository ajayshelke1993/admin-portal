// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [userName, setUserName] = useState(
    () => localStorage.getItem('userName') || ''
  );
  const [userRole, setUserRole] = useState(
    () => localStorage.getItem('userRole') || 'staff'
  );
  const navigateRef = useRef(null);

  const logout = () => {
    setIsAuthenticated(false);
    setUserName('');
    setUserRole('staff');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    if (navigateRef.current) {
      navigateRef.current('/login');
    }
  };

  const resetTimeout = () => {
    clearTimeout(window.logoutTimer);
    window.logoutTimer = setTimeout(() => {
      logout();
    }, 30 * 60 * 1000);
  };

  useEffect(() => {
    const handleActivity = () => resetTimeout();
    resetTimeout();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    return () => {
      clearTimeout(window.logoutTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
    };
  }, []);

  const login = (name, adminFlag,active) => {
    const role = adminFlag == 1 ? 'admin' : 'staff';
    setIsAuthenticated(true);
    setUserName(name);
    setUserRole(role);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userName', name);
    localStorage.setItem('userRole', role);
      localStorage.setItem('userActive', active ? 'true' : 'false');
    resetTimeout();
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      userName,
      userRole,
      login,
      logout,
      navigateRef
    }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);