import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginOfficer } from '../api/authApi';

const AuthContext = createContext(null);
const TOKEN_KEY = 'officer_token';
const USER_KEY = 'officer_profile';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [officer, setOfficer] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    setIsCheckingSession(false);
  }, []);

  async function signIn({ email, password }) {
    const response = await loginOfficer(email, password);

    if (response.success) {
      const nextToken = response.data.token;
      const nextOfficer = response.data.officer;

      localStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.setItem(USER_KEY, JSON.stringify(nextOfficer));
      setToken(nextToken);
      setOfficer(nextOfficer);
    }

    return response;
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setOfficer(null);
  }

  const value = useMemo(() => ({
    token,
    officer,
    isAuthenticated: Boolean(token),
    isCheckingSession,
    signIn,
    signOut,
  }), [token, officer, isCheckingSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
