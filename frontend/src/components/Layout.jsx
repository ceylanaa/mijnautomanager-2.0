import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import Button from './Button';
import './Layout.css';

// Vaste kopbalk, inhoud en voettekst van iedere pagina.
export default function Layout() {
  const { session, logout } = useAuth();

  return (
    <>
      <a className="skip-link" href="#inhoud">Naar inhoud</a>
      <header className="header">
        <div className="header-inner">
          <Link className="brand" to={session ? '/voertuigen' : '/inloggen'}>
            <span className="brand-icon" aria-hidden="true">M</span>
            MijnAutoManager
          </Link>
          {session ? (
            <nav aria-label="Hoofdnavigatie">
              <NavLink to="/voertuigen">Mijn auto's</NavLink>
              <NavLink to="/kenteken">Kenteken</NavLink>
              <Button variant="secondary" onClick={() => logout()}>Uitloggen</Button>
            </nav>
          ) : (
            <span className="header-tagline">Jouw auto. Alles bij elkaar.</span>
          )}
        </div>
      </header>
      <main id="inhoud" className="main">
        {session?.mode === 'demo' && (
          <div className="mode-banner">
            <span className="mode-dot" aria-hidden="true" />
            <span>Lokale voorbeeldmodus · niets wordt naar NOVI verstuurd</span>
          </div>
        )}
        <Outlet />
      </main>
      <footer className="footer">
        <span>MijnAutoManager</span>
        <span>Onderwijsdemo · gebruik alleen fictieve gegevens.</span>
      </footer>
    </>
  );
}
