import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';

export function Button({ children, secondary = false, busy = false, ...props }) {
  return <button type="button" className={`button${secondary ? ' secondary' : ''}`} aria-busy={busy || undefined} {...props} disabled={props.disabled || busy}>{children}</button>;
}
export function Field({ label, id, hint, ...props }) {
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />{hint && <small id={`${id}-hint`}>{hint}</small>}</div>;
}
export function Notice({ children, error = false }) {
  if (!children) return null;
  return <div className={`notice${error ? ' error' : ''}`} role={error ? 'alert' : 'status'}>{children}</div>;
}
export function ProtectedRoute() {
  const { session } = useAuth(); const location = useLocation();
  return session ? <Outlet key={`${session.mode}-${session.user.id}`} /> : <Navigate to="/inloggen" replace state={{ from: location.pathname }} />;
}
export function Layout() {
  const { session, logout } = useAuth();
  return <><a className="skip-link" href="#inhoud">Naar inhoud</a><header className="header"><div className="header-inner"><Link className="brand" to={session ? '/voertuigen' : '/inloggen'}><span className="brand-icon" aria-hidden="true">M</span>MijnAutoManager</Link>{session ? <nav aria-label="Hoofdnavigatie"><NavLink to="/voertuigen">Mijn auto's</NavLink><Button secondary onClick={() => logout()}>Uitloggen</Button></nav> : <span className="header-tagline">Jouw auto. Alles bij elkaar.</span>}</div></header><main id="inhoud" className="main">{session?.mode === 'demo' && <div className="mode-banner"><span className="mode-dot" aria-hidden="true"/><span>Lokale voorbeeldmodus · niets wordt naar NOVI verstuurd</span></div>}<Outlet /></main><footer className="footer"><span>MijnAutoManager</span><span>Voertuigen, overzicht en een goed begin.</span></footer></>;
}
