import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';

// Private route: zonder sessie gaat de bezoeker naar Inloggen. Dit is een interfacecontrole.
export default function ProtectedRoute() {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/inloggen" replace state={{ from: location.pathname }} />;
  }
  // De key zorgt dat alle privé-schermdata opnieuw start bij een andere gebruiker.
  return <Outlet key={`${session.mode}-${session.user.id}`} />;
}
