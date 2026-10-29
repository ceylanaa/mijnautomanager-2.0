import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { novi } from '../api/client';
const AuthContext = createContext(null);
const SESSION_KEY = 'mam-session';
export function tokenExpiry(token) {
  try { const raw = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); const { exp } = JSON.parse(atob(raw)); return Number.isFinite(exp) ? exp * 1000 : null; } catch { return null; }
}
function restore() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (!session?.user || !Number.isSafeInteger(session.user.id)) return null;
    if (session.mode === 'demo') return session;
    if (session.mode !== 'novi' || !session.token) return null;
    const expires = tokenExpiry(session.token);
    return expires && expires <= Date.now() ? null : session;
  } catch { return null; }
}
export function AuthProvider({ children }) {
  const [session, setSession] = useState(restore);
  const [notice, setNotice] = useState('');
  const loginVersion = useRef(0);
  function logout(message = '') { loginVersion.current++; setSession(null); setNotice(message); sessionStorage.removeItem(SESSION_KEY); }
  useEffect(() => {
    if (!session) return;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    const expires = tokenExpiry(session.token || '');
    if (!expires) return;
    const timer = setTimeout(() => logout('Je sessie is verlopen. Log opnieuw in.'), Math.min(Math.max(expires - Date.now(), 0), 2147483647));
    return () => clearTimeout(timer);
  }, [session]);
  async function login(email, password) {
    logout();
    const version = loginVersion.current;
    const next = await novi.login(email, password);
    // Een logout, nieuwe login of demo maakt dit antwoord verouderd.
    if (version !== loginVersion.current) return false;
    const expires = tokenExpiry(next.token);
    if (expires && expires <= Date.now()) throw new Error('De ontvangen sessie is verlopen. Log opnieuw in.');
    setSession(next);
    return true;
  }
  function startDemo() { loginVersion.current++; setNotice(''); setSession({ mode: 'demo', user: { id: 1, email: 'Lokale voorbeeldgebruiker' } }); }
  function handleError(error) {
    if (error.status === 401) logout('Je sessie is verlopen. Log opnieuw in.');
    return error.message || 'Er ging iets mis. Probeer het opnieuw.';
  }
  return <AuthContext.Provider value={{ session, notice, login, logout, startDemo, handleError }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
