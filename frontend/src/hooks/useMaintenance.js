import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { loadMaintenance } from '../api/maintenance';
import { sortMaintenance } from '../helpers/maintenance';

// Eigen hook: haalt al het onderhoud van één voertuig op, gesorteerd van nieuw naar oud.
// Met enabled=false wordt er (nog) niets opgehaald, bijvoorbeeld zolang het voertuig niet gevonden is.
export default function useMaintenance(vehicleId, enabled = true) {
  const { session, handleError } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    let current = true;
    setLoading(true);
    setError('');

    loadMaintenance(session, vehicleId, controller.signal)
      .then(data => { if (current) setRecords(sortMaintenance(data)); })
      .catch(loadError => { if (current) setError(handleError(loadError)); })
      .finally(() => { if (current) setLoading(false); });

    return () => {
      current = false;
      controller.abort();
    };
  }, [session, vehicleId, enabled, revision]);

  return { records, loading, error, reload: () => setRevision(value => value + 1) };
}
