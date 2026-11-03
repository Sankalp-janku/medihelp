import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api.js';
import { setUnauthorizedHandler, tokenStore } from '../services/httpClient.js';

const AuthContext = createContext(null);
const ToastContext = createContext(() => {});
export const useAuth = () => useContext(AuthContext);
export const useToast = () => useContext(ToastContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { setUnauthorizedHandler(() => setUser(null)); }, []);
  useEffect(() => {
    if (!tokenStore.get()) return setReady(true);
    authApi.me().then(setUser).catch(() => tokenStore.clear()).finally(() => setReady(true));
  }, []);
  const signIn = ({ token, user: u }) => { tokenStore.set(token); setUser(u); };
  const signOut = () => { tokenStore.clear(); setUser(null); };
  return <AuthContext.Provider value={{ user, ready, signIn, signOut, setUser }}>{children}</AuthContext.Provider>;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, kind = 'success') => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast toast-${t.kind}`}>{t.message}</div>)}
      </div>
    </ToastContext.Provider>
  );
}
