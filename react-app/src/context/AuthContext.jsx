import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe().then(res => setUser(res.data.user)).finally(() => setLoading(false));
  }, []);

  const login = async (data) => {
    const res = await api.login(data);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
