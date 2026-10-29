import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { demoVehicle, formatRdwDate } from '../api/data';

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
export function PageHeading({ eyebrow, title, description, children }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>{children}</div>;
}
export function EmptyState() {
  return <section className="card empty"><span className="empty-symbol" aria-hidden="true">＋</span><h2>Ruimte voor je eerste auto.</h2><p>Voeg een fictief demovoertuig toe om je overzicht te bekijken.</p><Link className="button" to="/kenteken">Auto toevoegen</Link></section>;
}
export function VehicleCard({ vehicle }) {
  const details = demoVehicle(vehicle.licensePlate);
  return <article className="card vehicle-card"><div className="car-mark" aria-hidden="true"><svg viewBox="0 0 180 75"><path d="M20 46h140l-8-24H47L28 46v12h128V46M47 22l12-13h67l20 13M66 12v30m58-30 9 30"/><circle cx="52" cy="59" r="10"/><circle cx="135" cy="59" r="10"/></svg></div><h2>{vehicle.nickname || 'Mijn auto'}</h2><p className="muted">{details ? `${details.brand} · ${details.model}` : 'Opgeslagen voertuig'}</p><span className="plate">{vehicle.licensePlate}</span><div className="vehicle-meta"><span className="badge">Fictief demovoertuig</span><p>APK-datum: {formatRdwDate(details?.apk)}</p></div><Link className="button secondary" to={`/voertuigen/${vehicle.id}`}>Details <span aria-hidden="true">↗</span></Link></article>;
}
export function ProtectedRoute() {
  const { session } = useAuth(); const location = useLocation();
  return session ? <Outlet key={`${session.mode}-${session.user.id}`} /> : <Navigate to="/inloggen" replace state={{ from: location.pathname }} />;
}
export function Layout() {
  const { session, logout } = useAuth();
  return <><a className="skip-link" href="#inhoud">Naar inhoud</a><header className="header"><div className="header-inner"><Link className="brand" to={session ? '/voertuigen' : '/inloggen'}><span className="brand-icon" aria-hidden="true">M</span>MijnAutoManager</Link>{session ? <nav aria-label="Hoofdnavigatie"><NavLink to="/voertuigen">Mijn auto's</NavLink><NavLink to="/kenteken">Kenteken</NavLink><Button secondary onClick={() => logout()}>Uitloggen</Button></nav> : <span className="header-tagline">Jouw auto. Alles bij elkaar.</span>}</div></header><main id="inhoud" className="main">{session?.mode === 'demo' && <div className="mode-banner"><span className="mode-dot" aria-hidden="true"/><span>Lokale voorbeeldmodus · niets wordt naar NOVI verstuurd</span></div>}<Outlet /></main><footer className="footer"><span>MijnAutoManager</span><span>Voertuigen, overzicht en een goed begin.</span></footer></>;
}
