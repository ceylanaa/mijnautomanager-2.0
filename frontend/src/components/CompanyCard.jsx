import { useState } from 'react';
import { fetchRecognitions, formatAddress } from '../api/garages';
import Button from './Button';
import Notice from './Notice';
import './CompanyCard.css';

// Eén bedrijf in de zoekresultaten. De erkenningen worden pas opgehaald bij uitklappen.
export default function CompanyCard({ company }) {
  const [open, setOpen] = useState(false);
  const [recognitions, setRecognitions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const panelId = `erkenningen-${company.volgnummer}`;

  async function load() {
    setLoading(true);
    setError('');
    try {
      setRecognitions(await fetchRecognitions(company.volgnummer));
    } catch (loadError) {
      setError(`${loadError.message} Zonder erkenningen kunnen we niet bevestigen wat dit bedrijf mag doen.`);
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !recognitions && !loading) load();
  }

  return (
    <li className="card company-card">
      <h3>{company.naam_bedrijf || 'Naam niet beschikbaar'}</h3>
      {company.gevelnaam && company.gevelnaam !== company.naam_bedrijf && <p className="muted">Gevelnaam: {company.gevelnaam}</p>}
      <p>{formatAddress(company)}</p>
      <Button variant="secondary" onClick={toggle} aria-expanded={open} aria-controls={panelId}>
        {open ? 'Erkenningen verbergen' : 'Bekijk erkenningen'}
      </Button>
      {open && (
        <div id={panelId} className="company-recognitions">
          {loading && <Notice>Erkenningen ophalen...</Notice>}
          <Notice error onRetry={error ? load : undefined}>{error}</Notice>
          {recognitions && recognitions.length === 0 && <p>Geen erkenningen gevonden bij de RDW.</p>}
          {recognitions && recognitions.length > 0 && (
            <ul>{recognitions.map(item => <li key={item}>{item}</li>)}</ul>
          )}
        </div>
      )}
    </li>
  );
}
