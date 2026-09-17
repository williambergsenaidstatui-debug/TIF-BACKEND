import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { api, configureSession } from '../routes/api';

const AuthContext = createContext(null);
const storageKey = 'verify-system-session';

function readSession() {
  try {
    return Platform.OS === 'web' ? window.sessionStorage.getItem(storageKey) : null;
  } catch {
    return null;
  }
}

function saveSession(value) {
  try {
    if (Platform.OS === 'web') {
      if (value) window.sessionStorage.setItem(storageKey, value);
      else window.sessionStorage.removeItem(storageKey);
    }
  } catch { /* A sessão continua em memória quando o navegador bloqueia o armazenamento. */ }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  function clearSession() {
    configureSession(null);
    saveSession(null);
    setUsuario(null);
  }

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      setLoading(false);
      return;
    }
    configureSession(saved, clearSession);
    api('/user').then(setUsuario).catch(clearSession).finally(() => setLoading(false));
  }, []);

  async function login(email, senha) {
    const data = await api('/login', { method: 'POST', body: { email: email.trim(), senha } });
    configureSession(data.token, clearSession);
    saveSession(data.token);
    setUsuario(data.usuario);
  }

  async function logout() {
    await api('/logout', { method: 'POST' });
    clearSession();
  }

  return <AuthContext.Provider value={{ usuario, isAdmin: usuario?.is_admin === true, loading, login, logout }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
