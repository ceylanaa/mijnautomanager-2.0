import { useEffect, useState } from 'react';

// Eenvoudige hook voor één verzoek met laden, fout, opnieuw proberen en het tijdstip van ophalen.
// load krijgt een AbortSignal; key bepaalt wanneer er opnieuw wordt opgehaald.
export default function useRequest(load, key) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchedAt, setFetchedAt] = useState(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (key === null) return undefined;
    const controller = new AbortController();
    let current = true;
    setLoading(true);
    setError('');
    setData(null);

    load(controller.signal)
      .then(result => {
        if (!current) return;
        setData(result);
        setFetchedAt(new Date());
      })
      .catch(loadError => { if (current) setError(loadError.message); })
      .finally(() => { if (current) setLoading(false); });

    return () => {
      current = false;
      controller.abort();
    };
    // load verandert bij elke render; key en revision bepalen wanneer we opnieuw ophalen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, revision]);

  return { data, loading, error, fetchedAt, reload: () => setRevision(value => value + 1) };
}
