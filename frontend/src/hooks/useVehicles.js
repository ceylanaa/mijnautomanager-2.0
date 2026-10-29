import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { loadVehicles } from '../api/vehicles';

// Eigen hook: haalt de gefilterde voertuigen van de ingelogde gebruiker op.
// Wordt gedeeld door het overzicht en de detailpagina.
export default function useVehicles() {
  const { session, handleError } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setLoading(true);
    setError('');
    setRecords([]);

    loadVehicles(session, controller.signal)
      .then(data => { if (current) setRecords(data); })
      .catch(loadError => { if (current) setError(handleError(loadError)); })
      .finally(() => { if (current) setLoading(false); });

    // Cleanup: een verouderd antwoord wordt genegeerd en het verzoek afgebroken.
    return () => {
      current = false;
      controller.abort();
    };
    // De sessie is stabiel binnen de privé-routes; uitloggen ontkoppelt deze pagina's.
  }, [session, revision]);

  return { records, loading, error, reload: () => setRevision(value => value + 1) };
}
