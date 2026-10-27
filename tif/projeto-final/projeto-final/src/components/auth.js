import { createContext, useContext, useEffect, useState } from 'react';
import { api, configureSession } from '../routes/api';
import { readSession, saveSession } from './session';

const AuthContext = createContext(null);
let storageQueue = Promise.resolve();
function persist(value) {
  storageQueue = storageQueue.catch(() => {}).then(() => saveSession(value));
  return storageQueue;
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  function clearSession() {
    configureSession(null);
    setUsuario(null);
    return persist(null).catch(() => {});
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await readSession();
        if (!saved || !mounted) return;
        configureSession(saved, clearSession);
        const user = await api('/user');
        if (mounted) setUsuario(user);
      } catch { await clearSession(); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  async function login(email, senha) {
    const data = await api('/login', { method: 'POST', body: { email: email.trim(), senha } });
    configureSession(data.token, clearSession);
    try { await persist(data.token); }
    catch {
      try { await api('/logout', { method: 'POST' }); } catch {}
      await clearSession();
      throw new Error('Não foi possível guardar a sessão com segurança. Tente novamente.');
    }
    setUsuario(data.usuario);
  }

  async function logout() {
    await api('/logout', { method: 'POST' });
    await clearSession();
  }

  return <AuthContext.Provider value={{ usuario, isAdmin: usuario?.is_admin === true, loading, login, logout, clearSession }}>
    {children}
  </AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
