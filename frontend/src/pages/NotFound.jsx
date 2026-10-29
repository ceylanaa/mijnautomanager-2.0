import { Link } from 'react-router';
import { useAuth } from '../auth/AuthContext';

// 404-pagina voor onbekende adressen.
export default function NotFound() {
  const { session } = useAuth();

  return (
    <section className="card not-found">
      <p className="eyebrow">404</p>
      <h1>Deze pagina bestaat niet.</h1>
      <p className="muted">Controleer het adres of ga terug naar een bekende pagina.</p>
      {session
        ? <Link className="button primary" to="/voertuigen">Terug naar overzicht</Link>
        : <Link className="button primary" to="/inloggen">Naar Inloggen</Link>}
    </section>
  );
}
